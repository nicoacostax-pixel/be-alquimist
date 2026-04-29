const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, token } = req.body || {};
  if (!action || !token) return res.status(400).json({ error: 'Faltan parámetros' });

  // Validate session token → get user email
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Supabase no configurado' });

  const anonClient = createClient(url, key);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'No autorizado: ' + (authError?.message || 'usuario no encontrado') });

  const email = user.email;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  try {
    // ── PEDIDOS ──────────────────────────────────────────────────────
    if (action === 'getPedidos') {
      if (!stripeKey) return res.json({ pedidos: [] });
      const stripe = Stripe(stripeKey);
      const intents = await stripe.paymentIntents.list({ limit: 100 });
      const pedidos = intents.data
        .filter(pi =>
          pi.metadata?.email === email ||
          pi.receipt_email === email ||
          pi.metadata?.userId === user.id
        )
        .filter(pi => pi.status === 'succeeded')
        .map(pi => ({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: new Date(pi.created * 1000).toISOString(),
          descripcion: pi.metadata?.nombre
            ? `Pedido de ${pi.metadata.nombre}`
            : pi.metadata?.paquete
            ? `Elementos x${pi.metadata.paquete}`
            : 'Compra',
        }));
      return res.json({ pedidos });
    }

    // ── PORTAL DE STRIPE (métodos de pago) ───────────────────────────
    if (action === 'getPortalUrl') {
      if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY no configurada' });
      const stripe = Stripe(stripeKey);
      const returnUrl = `${process.env.SITE_URL || 'https://be-alquimist.vercel.app'}/cuenta`;

      // Buscar o crear Customer
      const existing = await stripe.customers.list({ email, limit: 1 });
      const customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email })).id;

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return res.json({ url: session.url });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
