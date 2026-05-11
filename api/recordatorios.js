const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('./_resend');

function getSb() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const H = h => h * 60 * 60 * 1000;

// ── Email sequences ────────────────────────────────────────────────────────────

const CARRITO_TIENDA = [
  {
    key: 'r1', delay: H(24),
    subject: '🛒 Dejaste algo en tu carrito en Be Alquimist',
    bloques: [
      { type: 'h1', content: '¡Olvidaste algo en tu carrito! 🛒' },
      { type: 'text', content: 'Notamos que empezaste una compra en Be Alquimist pero no la completaste. ¡Tus productos siguen ahí esperándote!' },
      { type: 'divider' },
      { type: 'text', content: '✅ Más de 200 insumos naturales\n✅ Envío a toda la República Mexicana\n✅ Calidad garantizada' },
      { type: 'button', content: 'Completar mi pedido', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r2', delay: H(72),
    subject: '🌿 ¿Sigues pensando en tu pedido?',
    bloques: [
      { type: 'h1', content: '¿Todavía piensas en Be Alquimist? 🌿' },
      { type: 'text', content: 'Hace 3 días comenzaste una compra con nosotros. Si tienes alguna duda sobre los productos o el envío, con gusto te ayudamos.' },
      { type: 'divider' },
      { type: 'text', content: '¿Sabías que hacemos envíos a todo México y contamos con más de 200 insumos naturales para tus cosméticos artesanales?' },
      { type: 'button', content: 'Ver catálogo', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r3', delay: H(168),
    subject: '⏰ Última oportunidad — tu pedido en Be Alquimist',
    bloques: [
      { type: 'h1', content: 'Esta es tu última oportunidad ⏰' },
      { type: 'text', content: 'Han pasado 7 días desde que visitaste nuestra tienda. No queremos que te pierdas de nuestros insumos naturales.' },
      { type: 'divider' },
      { type: 'text', content: 'Si tienes alguna pregunta antes de comprar, escríbenos por WhatsApp. Con gusto te ayudamos a elegir los mejores ingredientes para tus fórmulas.' },
      { type: 'button', content: 'Ir a la tienda', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
];

const CARRITO_CURSO_VELAS = [
  {
    key: 'r1', delay: H(24),
    subject: '🕯️ Tu lugar en el Curso de Velas sigue disponible',
    bloques: [
      { type: 'h1', content: '¡Tu lugar sigue disponible! 🕯️' },
      { type: 'text', content: 'Estuviste a punto de inscribirte al Curso de Velas de Soya. ¡El curso sigue disponible por solo $200 MXN!' },
      { type: 'divider' },
      { type: 'text', content: '✅ Acceso de por vida\n✅ Material en video paso a paso\n✅ 7 días de garantía — si no te gusta, te devolvemos el 100%' },
      { type: 'button', content: 'Inscribirme ahora', url: 'https://bealquimist.com/cursos/velas-de-soya/checkout', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r2', delay: H(72),
    subject: '🕯️ ¿Todavía piensas en el Curso de Velas?',
    bloques: [
      { type: 'h1', content: '¿Sigues interesada en aprender? 🕯️' },
      { type: 'text', content: 'Hace 3 días estuviste a punto de inscribirte a nuestro Curso de Velas de Soya. ¿Tienes alguna duda? Podemos ayudarte.' },
      { type: 'divider' },
      { type: 'text', content: 'Aprende a crear velas de soya desde cero, con acceso de por vida y garantía de satisfacción de 7 días.' },
      { type: 'button', content: 'Ver el curso', url: 'https://bealquimist.com/cursos/velas-de-soya', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r3', delay: H(168),
    subject: '⏰ Última oportunidad — Curso de Velas de Soya',
    bloques: [
      { type: 'h1', content: 'Última oportunidad ⏰' },
      { type: 'text', content: 'Han pasado 7 días desde que visitaste nuestro Curso de Velas de Soya. Recuerda: tienes 7 días de garantía. Si no es lo que buscas, te reembolsamos el 100%.' },
      { type: 'divider' },
      { type: 'text', content: 'Si tienes dudas o necesitas ayuda para decidirte, escríbenos. Estamos aquí para ti.' },
      { type: 'button', content: 'Inscribirme con garantía', url: 'https://bealquimist.com/cursos/velas-de-soya/checkout', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
];

const ACEITE_SECUENCIA = [
  {
    key: 'r1', delay: H(24),
    subject: '🌿 Tu aceite esencial gratuito sigue esperándote',
    bloques: [
      { type: 'h1', content: '¡Tu aceite esencial te espera! 🌿' },
      { type: 'text', content: 'Registraste tu interés en recibir un aceite esencial de regalo con tu primer pedido. ¡Todavía está disponible para ti!' },
      { type: 'divider' },
      { type: 'text', content: '✅ Más de 200 insumos naturales\n✅ Envío a todo México\n✅ Tu aceite esencial gratis con tu primer pedido' },
      { type: 'button', content: 'Reclamar mi regalo', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r2', delay: H(72),
    subject: '🌸 ¿Ya hiciste tu primer pedido?',
    bloques: [
      { type: 'h1', content: '¿Ya visitaste nuestra tienda? 🌸' },
      { type: 'text', content: 'Hace 3 días te registraste para recibir tu aceite esencial de regalo. ¡Solo necesitas hacer tu primer pedido para reclamarlo!' },
      { type: 'divider' },
      { type: 'text', content: 'Encuentra todos los ingredientes naturales que necesitas para tus cosméticos artesanales y recibe tu aceite esencial gratis.' },
      { type: 'button', content: 'Ver catálogo', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
  {
    key: 'r3', delay: H(168),
    subject: '⏰ Tu aceite esencial gratuito caduca pronto',
    bloques: [
      { type: 'h1', content: 'Tu regalo está a punto de caducar ⏰' },
      { type: 'text', content: 'Han pasado 7 días desde que solicitaste tu aceite esencial de regalo. Esta es tu última oportunidad de reclamarlo.' },
      { type: 'divider' },
      { type: 'text', content: 'Haz tu primer pedido hoy y te incluimos tu aceite esencial gratis en el paquete.' },
      { type: 'button', content: 'Hacer mi primer pedido', url: 'https://bealquimist.com/insumos', color: '#B08968' },
      { type: 'text', content: 'Con cariño,\nEl equipo de Be Alquimist 🌿' },
    ],
  },
];

// ── Core logic ─────────────────────────────────────────────────────────────────

async function procesarCarritos(sb) {
  let sent = 0;
  const { data: carritos } = await sb.from('carritos_abandonados').select('*');
  const now = Date.now();

  for (const c of carritos || []) {
    const age = now - new Date(c.created_at).getTime();
    const seq = c.origen === 'curso_velas' ? CARRITO_CURSO_VELAS : CARRITO_TIENDA;

    for (const step of seq) {
      if (age >= step.delay && !c[`${step.key}_at`]) {
        try {
          await sendEmail({ to: c.email, subject: step.subject, bloques: step.bloques });
          await sb.from('carritos_abandonados')
            .update({ [`${step.key}_at`]: new Date().toISOString() })
            .eq('id', c.id);
          sent++;
          console.log(`[recordatorio] ${step.key} carrito(${c.origen}) → ${c.email}`);
        } catch (e) {
          console.error(`[recordatorio] error ${step.key} carrito ${c.email}:`, e.message);
        }
        break; // un recordatorio por corrida por usuario
      }
    }
  }
  return sent;
}

async function procesarAceite(sb) {
  let sent = 0;
  const { data: leads } = await sb.from('leads').select('*').eq('tipo', 'aceite_de_regalo');
  const now = Date.now();

  for (const l of leads || []) {
    const age = now - new Date(l.created_at).getTime();

    for (const step of ACEITE_SECUENCIA) {
      if (age >= step.delay && !l[`${step.key}_at`]) {
        try {
          await sendEmail({ to: l.email, subject: step.subject, bloques: step.bloques });
          await sb.from('leads')
            .update({ [`${step.key}_at`]: new Date().toISOString() })
            .eq('id', l.id);
          sent++;
          console.log(`[recordatorio] ${step.key} aceite → ${l.email}`);
        } catch (e) {
          console.error(`[recordatorio] error ${step.key} aceite ${l.email}:`, e.message);
        }
        break;
      }
    }
  }
  return sent;
}

module.exports = async function handler(req, res) {
  const sb = getSb();
  if (!sb) return res.status(500).json({ error: 'DB no configurada' });

  try {
    const [c, a] = await Promise.all([procesarCarritos(sb), procesarAceite(sb)]);
    const total = c + a;
    console.log(`[recordatorio] corrida: ${c} carritos + ${a} aceite = ${total} emails`);
    res.json({ ok: true, carritos: c, aceite: a, total });
  } catch (err) {
    console.error('[recordatorio] error general:', err.message);
    res.status(500).json({ error: err.message });
  }
};
