const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { user_id, nombre, contenido } = req.body || {};
  if (!contenido) return res.status(400).json({ error: 'Falta contenido' });

  const { error } = await supabase.from('recetas').insert({ user_id: user_id || null, nombre, contenido });
  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true });
};
