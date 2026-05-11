const { createClient } = require('@supabase/supabase-js');

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, telefono, origen } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email requerido' });

  const sb = getSb();
  if (!sb) return res.status(500).json({ error: 'DB no configurada' });

  // Upsert by email so we don't duplicate the same visitor
  const { error } = await sb.from('carritos_abandonados')
    .upsert({ email, telefono: telefono || null, origen: origen || null }, { onConflict: 'email' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};
