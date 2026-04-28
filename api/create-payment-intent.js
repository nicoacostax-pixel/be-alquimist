const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' });
  }

  const { amount, currency = 'mxn', metadata = {} } = req.body || {};

  if (!amount || amount < 10) {
    return res.status(400).json({ error: 'Monto inválido' });
  }

  const stripe = Stripe(secret);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // centavos MXN
      currency,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
