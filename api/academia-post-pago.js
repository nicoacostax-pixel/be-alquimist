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

  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId requerido' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    return res.status(400).json({ error: 'Sesión inválida' });
  }

  if (session.payment_status !== 'paid') {
    return res.status(400).json({ error: 'El pago no fue completado' });
  }

  const email = (session.customer_details?.email || session.customer_email || '').toLowerCase();
  const nombre = session.customer_details?.name || '';
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  if (!email) return res.status(400).json({ error: 'No se encontró el correo del pago' });

  const sb = getSb();
  const tempPassword = crypto.randomBytes(20).toString('hex');
  let userId;

  try {
    const { data: created, error } = await sb.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre },
    });

    if (error) {
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const found = (users || []).find(u => u.email === email);
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
    { id: userId, nombre, es_pro: true, pro_expira_at: null },
    { onConflict: 'id' }
  );

  await sb.from('leads')
    .insert({ email, tipo: 'academia_pro' })
    .catch(() => {});

  return res.json({ ok: true, email, tempPassword });
};
