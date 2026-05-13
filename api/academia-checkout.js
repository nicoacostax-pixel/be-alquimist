const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, email } = req.body || {};
  if (!email || !nombre) return res.status(400).json({ error: 'Nombre y correo son requeridos' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no configurado en el servidor' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const existing = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 1 });
    const customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email: email.trim().toLowerCase(), name: nombre.trim() });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: 'mxn',
          unit_amount: 14900,
          recurring: { interval: 'month' },
          product_data: { name: 'Academia Be Alquimist PRO' },
        },
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { plan: 'academia_pro', nombre: nombre.trim(), customerEmail: email.trim().toLowerCase() },
    });

    return res.json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
