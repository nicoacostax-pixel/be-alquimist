const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function getSb() {
  return createClient(
    process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email, paymentIntentId } = req.body || {};
  if (!email || !paymentIntentId) return res.status(400).json({ error: 'Datos incompletos' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null);
  if (!pi || pi.status !== 'succeeded') {
    return res.status(400).json({ error: 'El pago no fue completado' });
  }

  const sb = getSb();
  const emailLower = email.trim().toLowerCase();
  const tempPassword = crypto.randomBytes(20).toString('hex');
  let userId;

  try {
    const { data: created, error } = await sb.auth.admin.createUser({
      email: emailLower,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre: (nombre || '').trim() },
    });

    if (error) {
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const found = (users || []).find(u => u.email === emailLower);
      if (!found) return res.status(500).json({ error: error.message });
      userId = found.id;
      await sb.auth.admin.updateUserById(userId, { password: tempPassword });
    } else {
      userId = created.user.id;
    }
  } catch (e) {
    return res.status(500).json({ error: 'Error al crear cuenta: ' + e.message });
  }

  await sb.from('perfiles').upsert(
    { id: userId, nombre: (nombre || '').trim(), es_pro: true, pro_expira_at: null },
    { onConflict: 'id' }
  );

  await sb.from('leads').insert({ email: emailLower, tipo: 'academia_pro' }).catch(() => {});

  // Create recurring subscription starting in 30 days (first month already charged via PI)
  try {
    const priceId = await getOrCreatePrice(stripe);
    if (priceId && pi.payment_method) {
      await stripe.subscriptions.create({
        customer: pi.customer,
        items: [{ price: priceId }],
        default_payment_method: pi.payment_method,
        trial_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        metadata: { plan: 'academia_pro', userId },
      });
    }
  } catch (_) { /* subscription setup is best-effort */ }

  return res.json({ ok: true, email: emailLower, tempPassword });
};

async function getOrCreatePrice(stripe) {
  if (process.env.STRIPE_ACADEMIA_PRICE_ID) return process.env.STRIPE_ACADEMIA_PRICE_ID;
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find(p => p.name === 'Academia Be Alquimist PRO' && p.active);
  if (!product) product = await stripe.products.create({ name: 'Academia Be Alquimist PRO' });
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
  let price = prices.data.find(p => p.currency === 'mxn' && p.unit_amount === 14900 && p.recurring?.interval === 'month');
  if (!price) price = await stripe.prices.create({ currency: 'mxn', unit_amount: 14900, recurring: { interval: 'month' }, product: product.id });
  return price.id;
}
