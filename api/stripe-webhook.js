const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

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
