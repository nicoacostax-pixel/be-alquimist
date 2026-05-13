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

    // Find or create product + price (avoids inline product_data which requires newer API version)
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

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { plan: 'academia_pro', nombre: nombre.trim(), customerEmail: email.trim().toLowerCase() },
    });

    // expand may return the PI as an object or just an ID depending on SDK version
    let clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      const invoiceId = typeof subscription.latest_invoice === 'string'
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;
      if (!invoiceId) return res.status(500).json({ error: 'No se pudo obtener la factura de la suscripción' });
      const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['payment_intent'] });
      clientSecret = invoice.payment_intent?.client_secret;
    }

    if (!clientSecret) return res.status(500).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });

    return res.json({ clientSecret, subscriptionId: subscription.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
