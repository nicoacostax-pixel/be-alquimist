const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { nombre, extension, telefono, email, q1, q2, q3, q4, q5 } = req.body || {};
  if (!nombre || !email) return res.status(400).json({ error: 'Nombre y correo son requeridos' });

  const { error } = await supabase.from('distribuidoras').insert({
    nombre,
    extension: extension || '+52',
    telefono:  telefono || '',
    email,
    q1_comercializacion:   q1 || '',
    q2_inversion:          q2 || '',
    q3_vende_actualmente:  q3 || '',
    q4_clientes:           q4 || '',
    q5_cuando:             q5 || '',
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
};
