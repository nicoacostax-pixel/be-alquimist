const { createClient } = require('@supabase/supabase-js');
const { sendEmail, getTemplate } = require('./_resend');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { telefono, email, tipo = 'aceite_de_regalo' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'El correo es requerido' });

  const { error } = await supabase.from('leads').insert({ telefono, email, tipo });
  if (error) return res.status(500).json({ error: error.message });

  // Enviar email de bienvenida si existe la plantilla 'bienvenida'
  try {
    const tpl = await getTemplate('bienvenida');
    if (tpl?.asunto && tpl?.bloques?.length) {
      await sendEmail({ to: email, subject: tpl.asunto, bloques: tpl.bloques, fuente: tpl.fuente });
    }
  } catch (_) {
    // No bloquear el registro si el email falla
  }

  res.json({ ok: true });
};
