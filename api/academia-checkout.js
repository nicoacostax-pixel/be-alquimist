const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no configurado en el servidor' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const pi = await stripe.paymentIntents.create({
      amount: 14900,
      currency: 'mxn',
      payment_method_types: ['card'],
      metadata: { plan: 'academia_pro' },
    });
    return res.json({ clientSecret: pi.client_secret });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
