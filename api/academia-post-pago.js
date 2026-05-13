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
      // Already exists — find and update password for auto-login
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

  // Activar PRO permanente (pagó)
  await sb.from('perfiles').upsert(
    { id: userId, nombre: (nombre || '').trim(), es_pro: true, pro_expira_at: null },
    { onConflict: 'id' }
  );

  // Registrar lead
  await sb.from('leads')
    .insert({ email: emailLower, tipo: 'academia_pro' })
    .catch(() => {});

  return res.json({ ok: true, email: emailLower, tempPassword });
};
