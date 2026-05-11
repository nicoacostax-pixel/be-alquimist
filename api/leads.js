const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BLOQUES_CUPON_VELAS = [
  { type: 'h1', content: '🕯️ Tu cupón de $300 de descuento' },
  { type: 'text', content: 'Gracias por tu interés en el Curso de Velas de Soya de Be Alquimist. Aquí está tu cupón exclusivo:' },
  { type: 'divider' },
  { type: 'h2', content: 'Tu código de descuento:' },
  { type: 'text', content: '300DES' },
  { type: 'text', content: 'Aplica $300 de descuento al adquirir el Kit de Velas de Soya. Úsalo al momento de hacer tu inscripción.' },
  { type: 'button', content: 'Inscribirme ahora', url: 'https://bealquimist.com/cursos/velas-de-soya', color: '#B08968' },
  { type: 'divider' },
  { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🕯️' },
];

const BLOQUES_ACEITE_REGALO = [
  {
    type: 'h1',
    content: '¡Tu aceite esencial gratuito te está esperando! 🌿',
  },
  {
    type: 'text',
    content: 'Gracias por registrarte. Tienes reservado un aceite esencial de regalo con tu primer pedido en Be Alquimist.',
  },
  {
    type: 'divider',
  },
  {
    type: 'h2',
    content: '¿Por qué hacer tu primer pedido hoy?',
  },
  {
    type: 'text',
    content: '✅ Más de 200 insumos naturales para cosmética\n✅ Envío a todo México\n✅ Ingredientes de primera calidad al mejor precio\n✅ Tu aceite esencial gratis incluido en el paquete',
  },
  {
    type: 'button',
    content: 'Ver catálogo y reclamar mi regalo',
    url: 'https://bealquimist.com/insumos',
    color: '#B08968',
  },
  {
    type: 'divider',
  },
  {
    type: 'text',
    content: 'Si tienes dudas sobre qué ingredientes necesitas para tus fórmulas, nuestra IA te ayuda a crear recetas personalizadas. Solo visita el chat en bealquimist.com.',
  },
  {
    type: 'text',
    content: 'Con cariño,\nEl equipo de Be Alquimist 🌸',
  },
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { telefono, email, tipo = 'aceite_de_regalo' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'El correo es requerido' });

  const { error } = await supabase.from('leads').insert({ telefono, email, tipo });
  if (error) return res.status(500).json({ error: error.message });

  if (tipo === 'aceite_de_regalo') {
    try {
      await sendEmail({
        to: email,
        subject: '🌿 Tu aceite esencial gratuito te está esperando',
        bloques: BLOQUES_ACEITE_REGALO,
      });
    } catch (err) { console.error('[leads] aceite email error:', err.message); }
  }

  if (tipo === 'descuento_curso_velas') {
    try {
      await sendEmail({
        to: email,
        subject: '🕯️ Tu cupón de $300 para el Curso de Velas de Soya',
        bloques: BLOQUES_CUPON_VELAS,
      });
      console.log('[leads] cupón enviado a:', email);
    } catch (err) { console.error('[leads] cupón email error:', err.message); }
  }

  res.json({ ok: true });
};
