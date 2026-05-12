const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const WHATSAPP_LINK = 'https://chat.whatsapp.com/KVN6V1jrR2YAGzRKQNvnkd';
const COMUNIDAD_LINK = 'https://bealquimist.com/comunidad';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nombre, correo, telefono } = req.body || {};
  if (!correo || !nombre) return res.status(400).json({ error: 'Nombre y correo requeridos' });

  const email = correo.trim().toLowerCase();
  const sb = getSb();

  // 1. Create or retrieve Supabase user
  let userId;
  try {
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nombre: nombre.trim(), telefono: telefono || '' },
    });

    if (createErr) {
      // User may already exist — fetch by email
      const { data: { users } } = await sb.auth.admin.listUsers({ perPage: 1000 });
      const existing = (users || []).find(u => u.email === email);
      if (!existing) return res.status(500).json({ error: createErr.message });
      userId = existing.id;
    } else {
      userId = created.user.id;
    }
  } catch (e) {
    return res.status(500).json({ error: 'Error al crear cuenta: ' + e.message });
  }

  // 2. Set PRO benefits (7 days) in perfiles
  const proExpiraAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await sb.from('perfiles').upsert(
    { id: userId, nombre: nombre.trim(), es_pro: true, pro_expira_at: proExpiraAt },
    { onConflict: 'id' }
  );

  // 3. Generate password setup link
  let passwordLink = `${process.env.REACT_APP_SITE_URL || 'https://bealquimist.com'}/cuenta`;
  try {
    const { data: linkData } = await sb.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${process.env.REACT_APP_SITE_URL || 'https://bealquimist.com'}/cuenta` },
    });
    if (linkData?.properties?.action_link) {
      passwordLink = linkData.properties.action_link;
    }
  } catch (_) { /* use fallback */ }

  // 4. Send branded welcome email
  try {
    await sendEmail({
      to: email,
      subject: '¡Bienvenida a Be Alquimist Academia! 🌿',
      bloques: [
        { type: 'h1', content: `¡Hola ${nombre.trim()}! ⚗️` },
        { type: 'text', content: 'Tu cuenta de Be Alquimist Academia ya está activa con 7 días de acceso PRO gratuito. Sigue estos pasos para aprovecharlos al máximo:' },
        { type: 'divider' },
        { type: 'h2', content: '💬 Paso 1 — Únete al grupo de WhatsApp' },
        { type: 'text', content: 'Conecta con la comunidad de alquimistas, comparte dudas y recibe novedades exclusivas directamente en tu teléfono.' },
        { type: 'button', content: 'Unirme al grupo de WhatsApp', url: WHATSAPP_LINK, color: '#25D366' },
        { type: 'h2', content: '✍️ Paso 2 — Haz tu primera publicación' },
        { type: 'text', content: '¡Preséntate en la comunidad! Cuéntanos quién eres, por qué te interesa la cosmética natural y qué quieres aprender.' },
        { type: 'button', content: 'Ir a la comunidad', url: COMUNIDAD_LINK, color: '#B08968' },
        { type: 'divider' },
        { type: 'h2', content: '🔐 Crea tu contraseña' },
        { type: 'text', content: 'Para acceder a todos los cursos y funciones de la academia, establece tu contraseña haciendo clic en el botón de abajo:' },
        { type: 'button', content: 'Establecer mi contraseña', url: passwordLink, color: '#4A3F35' },
        { type: 'text', content: 'Tu acceso PRO es válido por 7 días. Después podrás continuar con tu suscripción mensual por solo $149 MXN.\n\nCon cariño,\nEl equipo de Be Alquimist 🌿' },
      ],
    });
  } catch (e) {
    console.error('[academia-registro] error enviando email:', e.message);
  }

  // 5. Add to Resend "Alumnos" audience
  const audienceId = process.env.RESEND_ALUMNOS_AUDIENCE_ID;
  if (audienceId) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.contacts.create({
        audienceId,
        email,
        firstName: nombre.trim().split(' ')[0],
        lastName: nombre.trim().split(' ').slice(1).join(' ') || undefined,
        unsubscribed: false,
      });
    } catch (e) {
      console.error('[academia-registro] error añadiendo a audiencia:', e.message);
    }
  }

  // 6. Schedule reminder emails via academia_recordatorios table
  try {
    await sb.from('academia_recordatorios').upsert(
      { user_id: userId, email, pro_expira_at: proExpiraAt, r1_sent: false, r2_sent: false },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.error('[academia-registro] error guardando recordatorio:', e.message);
  }

  return res.json({ ok: true });
};
