const Stripe = require('stripe');

const PAQUETES = {
  '10':  { elementos: 10,  monto: 9900  },
  '20':  { elementos: 20,  monto: 14900 },
  '50':  { elementos: 50,  monto: 35000 },
  '100': { elementos: 100, monto: 50000 },
  'pro': { elementos: -1,  monto: 14900 },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' });

  const { paquete } = req.body || {};
  const pkg = PAQUETES[paquete];
  if (!pkg) return res.status(400).json({ error: 'Paquete inválido' });

  const stripe = Stripe(secret);
  try {
    const pi = await stripe.paymentIntents.create({
      amount:   pkg.monto,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: { paquete, elementos: pkg.elementos },
    });
    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
