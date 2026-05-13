const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe no configurado en el servidor' });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || 'https://bealquimist.com';

  try {
    let priceId = process.env.STRIPE_ACADEMIA_PRICE_ID;
    if (!priceId) {
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.name === 'Academia Be Alquimist PRO' && p.active);
      if (!product) product = await stripe.products.create({ name: 'Academia Be Alquimist PRO' });

      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
      let price = prices.data.find(p => p.currency === 'mxn' && p.unit_amount === 14900 && p.recurring?.interval === 'month');
      if (!price) price = await stripe.prices.create({ currency: 'mxn', unit_amount: 14900, recurring: { interval: 'month' }, product: product.id });
      priceId = price.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/academia/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/academia`,
      locale: 'es',
      metadata: { plan: 'academia_pro' },
    });

    return res.json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
