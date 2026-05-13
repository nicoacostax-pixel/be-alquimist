const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email } = req.body || {};
  if (!email || !nombre) return res.status(400).json({ error: 'Nombre y correo son requeridos' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no configurado en el servidor' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const existing = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 });
  const customer = existing.data.length > 0
    ? existing.data[0]
    : await stripe.customers.create({ email: email.trim().toLowerCase(), name: nombre.trim() });

  const pi = await stripe.paymentIntents.create({
    amount: 14900,
    currency: 'mxn',
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
    setup_future_usage: 'off_session',
    metadata: { plan: 'academia_pro', nombre: nombre.trim(), customerEmail: email.trim().toLowerCase() },
  });

  return res.json({ clientSecret: pi.client_secret });
};
