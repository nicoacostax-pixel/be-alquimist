const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripeKey     = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return res.status(500).json({ error: 'Stripe no configurado' });

  const stripe  = Stripe(stripeKey);
  const sig     = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const sb         = getSupabaseAdmin();
  const customerId = event.data.object.customer;

  if (sb && customerId) {
    try {
      switch (event.type) {
        // Pago mensual exitoso → mantener PRO activo
        case 'invoice.paid':
          if (event.data.object.subscription) {
            await sb.from('perfiles').update({ es_pro: true }).eq('stripe_customer_id', customerId);
          }
          break;

        // PaymentIntent PRO confirmado → activar PRO y crear suscripción recurrente
        case 'payment_intent.succeeded': {
          const piObj   = event.data.object;
          const piMeta  = piObj.metadata || {};
          const monto   = (piObj.amount / 100).toFixed(2);
          const moneda  = (piObj.currency || 'mxn').toUpperCase();

          // Confirmación al cliente + BCC a Nico
          if (piMeta.email) {
            try {
              await sendEmail({
                to: piMeta.email,
                bcc: 'nico.acosta.x@gmail.com',
                subject: '✅ Confirmación de tu compra en Be Alquimist',
                bloques: [
                  { type: 'h1', content: `¡Gracias por tu compra, ${piMeta.nombre || ''}! 🕯️` },
                  { type: 'text', content: `Hemos recibido tu pago correctamente. Aquí están los detalles de tu pedido:` },
                  { type: 'divider' },
                  { type: 'h2', content: 'Resumen del pedido' },
                  { type: 'text', content: `Monto pagado: $${monto} ${moneda}\nNombre: ${piMeta.nombre || '—'}\nCorreo: ${piMeta.email}` },
                  { type: 'divider' },
                  { type: 'text', content: 'En breve recibirás más información sobre tu pedido. Si tienes alguna duda, responde este correo o contáctanos por WhatsApp.' },
                  { type: 'button', content: 'Ir a Be Alquimist', url: 'https://bealquimist.com', color: '#B08968' },
                  { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
                ],
              });
              console.log('[webhook] confirmación enviada a:', piMeta.email);
            } catch (emailErr) { console.error('Webhook confirm email error:', emailErr.message); }
          }

          if (piMeta.plan === 'pro' && piMeta.userId) {
            // Activar PRO de inmediato
            await sb.from('perfiles').update({ es_pro: true }).eq('id', piMeta.userId);
            // Crear suscripción con trial 30 días (primer mes ya cobrado por este PI)
            try {
              const stripe2 = Stripe(process.env.STRIPE_SECRET_KEY);
              const pm = piObj.payment_method;
              if (pm && piMeta.priceId) {
                await stripe2.customers.update(piObj.customer, {
                  invoice_settings: { default_payment_method: pm },
                });
                const sub = await stripe2.subscriptions.create({
                  customer:               piObj.customer,
                  items:                  [{ price: piMeta.priceId }],
                  default_payment_method: pm,
                  trial_period_days:      30,
                  metadata:               { userId: piMeta.userId },
                });
                await sb.from('perfiles')
                  .update({ stripe_subscription_id: sub.id })
                  .eq('id', piMeta.userId);
              }
            } catch (subErr) {
              console.error('Error creando suscripción PRO recurrente:', subErr.message);
            }
          }
          break;
        }

        // Pago falló → revocar PRO
        case 'invoice.payment_failed':
          if (event.data.object.subscription) {
            await sb.from('perfiles').update({ es_pro: false }).eq('stripe_customer_id', customerId);
          }
          break;

        // Suscripción cancelada → revocar PRO y limpiar IDs
        case 'customer.subscription.deleted':
          await sb.from('perfiles').update({
            es_pro: false,
            stripe_subscription_id: null,
          }).eq('stripe_customer_id', customerId);
          break;
      }
    } catch (err) {
      console.error('Webhook DB error:', err.message);
    }
  }

  res.json({ received: true });
};

module.exports.config = {
  api: { bodyParser: false },
};
