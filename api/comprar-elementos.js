const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const PAQUETES = {
  '10':  { elementos: 10,  monto: 1900 },
  '20':  { elementos: 20,  monto: 2900 },
  '50':  { elementos: 50,  monto: 5900 },
  '100': { elementos: 100, monto: 9900 },
};

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const claims = JSON.parse(json);
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch { return null; }
}

// Busca el Price de PRO o lo crea si no existe
async function getOrCreateProPrice(stripe) {
  if (process.env.STRIPE_PRO_PRICE_ID) return process.env.STRIPE_PRO_PRICE_ID;
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  const existing = prices.data.find(
    p => p.metadata?.plan === 'pro' && p.recurring?.interval === 'month'
  );
  if (existing) return existing.id;
  const product = await stripe.products.create({
    name: 'Alquimista PRO',
    metadata: { plan: 'pro' },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 14900,
    currency: 'mxn',
    recurring: { interval: 'month' },
    metadata: { plan: 'pro' },
  });
  return price.id;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' });

  const { paquete, token } = req.body || {};
  const stripe = Stripe(secret);

  // ── PAQUETES DE ELEMENTOS (cobro único) ──────────────────────────
  if (paquete !== 'pro') {
    const pkg = PAQUETES[paquete];
    if (!pkg) return res.status(400).json({ error: 'Paquete inválido' });
    try {
      const pi = await stripe.paymentIntents.create({
        amount: pkg.monto,
        currency: 'mxn',
        automatic_payment_methods: { enabled: true },
        metadata: { paquete, elementos: pkg.elementos },
      });
      return res.json({ clientSecret: pi.client_secret });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── PLAN PRO (suscripción mensual recurrente) ────────────────────
  if (!token) return res.status(400).json({ error: 'Se requiere iniciar sesión para activar el plan PRO' });
  const claims = decodeJwt(token);
  if (!claims?.email) return res.status(401).json({ error: 'Token inválido o expirado' });

  const email  = claims.email;
  const userId = claims.sub;

  try {
    // Buscar o crear Customer en Stripe
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email, metadata: { userId } });

    // Verificar si ya tiene suscripción activa
    const activeSubs = await stripe.subscriptions.list({
      customer: customer.id, status: 'active', limit: 1,
    });
    if (activeSubs.data.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una suscripción PRO activa' });
    }

    // Obtener o crear el Price mensual de PRO
    const priceId = await getOrCreateProPrice(stripe);

    // Stripe API 2026+: el flujo invoice.payment_intent fue eliminado.
    // Cobramos el primer mes con un PaymentIntent directo (setup_future_usage guarda la tarjeta).
    // El webhook payment_intent.succeeded crea la suscripción con la tarjeta guardada.
    const pi = await stripe.paymentIntents.create({
      amount:   14900,
      currency: 'mxn',
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: 'off_session',
      metadata: { plan: 'pro', userId, priceId, customerEmail: email },
    });

    // Guardar customer ID en la BD (subscription_id se añade en el webhook)
    const sbUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sbUrl && sbKey) {
      const sb = createClient(sbUrl, sbKey, { auth: { autoRefreshToken: false, persistSession: false } });
      await sb.from('perfiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
    }

    return res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
