import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useElementos } from '../../../shared/context/ElementosContext';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

const CURSOS = [
  {
    icon: '✨',
    nombre: 'Skin Care Natural',
    desc: 'Crea sérum, tónicos, cremas y rutinas completas para el cuidado facial con activos botánicos.',
    nivel: 'Intermedio',
  },
  {
    icon: '🧼',
    nombre: 'Jabones Artesanales',
    desc: 'Domina el proceso en frío y en caliente para formular jabones personalizados que venden solos.',
    nivel: 'Principiante',
  },
  {
    icon: '💆',
    nombre: 'Shampoo Sólido',
    desc: 'Aprende a formular shampoos sólidos libres de sulfatos con tensioactivos naturales.',
    nivel: 'Intermedio',
  },
  {
    icon: '🕯️',
    nombre: 'Velas de Soya',
    desc: 'Elabora velas de soya aromáticas con aceites esenciales: desde la fórmula hasta el empaque.',
    nivel: 'Principiante',
  },
  {
    icon: '🧪',
    nombre: 'Mini Curso de pH',
    desc: 'Entiende el pH en cosmética, cómo medirlo y ajustarlo correctamente en cada fórmula.',
    nivel: 'Básico',
  },
  {
    icon: '🌿',
    nombre: 'Formulación Botánica',
    desc: 'Extrae y aplica activos de plantas en tus fórmulas: macerados, infusiones y extracciones CO₂.',
    nivel: 'Intermedio',
  },
  {
    icon: '🔬',
    nombre: 'Seguridad e Higiene en el Taller',
    desc: 'Protocolos, BPM y condiciones de trabajo para formular de manera segura y profesional.',
    nivel: 'Básico',
  },
  {
    icon: '🎨',
    nombre: 'Branding para Cosmética',
    desc: 'Construye una marca memorable: nombre, paleta, packaging y posicionamiento visual.',
    nivel: 'Negocio',
  },
  {
    icon: '📱',
    nombre: 'Instagram para Alquimistas',
    desc: 'Estrategia de contenidos, reels, storytelling y cómo convertir seguidores en clientes.',
    nivel: 'Negocio',
  },
  {
    icon: '🛒',
    nombre: 'Tiendas en Línea',
    desc: 'Lanza tu tienda digital: plataformas, fichas de producto, pagos y logística básica.',
    nivel: 'Negocio',
  },
];

const RUTA_MODULOS = [
  { num: '01', nombre: 'Empieza aquí', desc: 'Orientación completa: herramientas, glosario y mentalidad de alquimista.' },
  { num: '02', nombre: 'El ABC de la Cosmética Natural', desc: 'Ingredientes base, pH, emulsiones y los principios de toda buena fórmula.' },
  { num: '03', nombre: 'Velas de Soya', desc: 'Tu primer producto terminado: velas aromáticas con fórmula probada.' },
  { num: '04', nombre: 'Zero Waste', desc: 'Cosmética sólida, envases sostenibles y cómo convertirlo en diferenciador.' },
  { num: '05', nombre: 'Fórmulas Flash', desc: 'Recetas rápidas y rentables para empezar a vender en menos de una semana.' },
  { num: '06', nombre: 'Construye tu Marca', desc: 'De la fórmula al producto: etiquetado, legalidad básica y primeras ventas.' },
];

const BIBLIOTECA = [
  { icon: '🫒', cat: 'Aceites vegetales', items: '+40 fichas con propiedades, porcentajes y usos recomendados' },
  { icon: '🕯️', cat: 'Ceras y mantecas', items: 'Ceras naturales y tropicales con guía de fusión y combinación' },
  { icon: '💧', cat: 'Hidrolatos y aguas florales', items: 'Usos cosméticos, conservación y combinaciones por tipo de piel' },
  { icon: '🌸', cat: 'Aceites esenciales', items: '+60 fichas con notas olfativas, beneficios y dosis máximas IFRA' },
  { icon: '⚗️', cat: 'Activos cosméticos', items: 'Niacinamida, ácido hialurónico, vitamina C y más — con % de uso' },
  { icon: '🧫', cat: 'Emulsificantes y conservadores', items: 'Guía para elegir el correcto según tu fórmula y pH objetivo' },
  { icon: '📋', cat: '+30 fórmulas base', items: 'Cremas, sérum, jabones, shampoos y más — listas para adaptar' },
];

const BENEFICIOS = [
  { icon: '🚚', titulo: 'Envíos gratis siempre', desc: 'Cada pedido que hagas en la tienda llega a tu puerta sin costo de envío, sin mínimo.' },
  { icon: '🤖', titulo: 'Chat IA ilimitado', desc: 'Genera todas las recetas que necesites con Be Alquimist, sin restricción de elementos.' },
  { icon: '👥', titulo: 'Comunidad activa', desc: 'Acceso a nuestra comunidad privada de formuladoras, foros y eventos en vivo.' },
  { icon: '🏆', titulo: 'Insignia Alquimista PRO', desc: 'Badge exclusivo en tu perfil de la comunidad que reconoce tu nivel.' },
];

const FAQ = [
  { q: '¿Cuándo empiezo a ver los cursos?', a: 'Al instante. En cuanto confirmes tu suscripción tienes acceso a todos los cursos y la biblioteca.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, sin penalizaciones. Al cancelar conservas el acceso hasta el final del período ya pagado.' },
  { q: '¿Se agregan cursos nuevos?', a: 'Sí. Los suscriptores reciben cada curso nuevo de forma automática sin costo adicional.' },
  { q: '¿Los envíos gratis aplican para toda la tienda?', a: 'Sí, en todos los pedidos de insumos en bealquimist.com sin monto mínimo.' },
  { q: '¿En qué moneda y cómo se cobra?', a: 'En pesos mexicanos (MXN). El cobro es mensual automático, puedes pagar con tarjeta.' },
  { q: '¿El chat IA tiene límite de uso?', a: 'No. Con PRO el chat de formulación es completamente ilimitado.' },
];

const NIVEL_COLOR = {
  'Principiante': { bg: '#E8F5E9', color: '#2E7D32' },
  'Básico':       { bg: '#E3F2FD', color: '#1565C0' },
  'Intermedio':   { bg: '#FFF3E0', color: '#E65100' },
  'Negocio':      { bg: '#F3E5F5', color: '#6A1B9A' },
};

export default function AcademiaLanding() {
  const { isLoggedIn, esPro } = useElementos();
  const navigate = useNavigate();
  const [openFaq,    setOpenFaq]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ nombre: '', correo: '', telefono: '' });
  const [sending,    setSending]    = useState(false);
  const [formErr,    setFormErr]    = useState('');

  const handleCTA = () => setShowForm(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) { setFormErr('Nombre y correo son requeridos.'); return; }
    setSending(true); setFormErr('');
    try {
      const res = await fetch('/api/academia-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre.trim(), correo: form.correo.trim(), telefono: form.telefono }),
      });
      const json = await res.json();
      if (!res.ok) { setFormErr(json.error || 'Ocurrió un error. Intenta de nuevo.'); setSending(false); return; }
      if (json.email && json.tempPassword) {
        await supabase.auth.signInWithPassword({ email: json.email, password: json.tempPassword });
      }
      if (window.fbq) window.fbq('track', 'Lead', { content_name: 'academia' });
      navigate('/academia/confirmacion');
    } catch {
      setFormErr('Ocurrió un error. Intenta de nuevo.');
      setSending(false);
    }
  };

  const inputSt = {
    border: '1.5px solid #E0D6CE', borderRadius: 10, padding: '13px 16px',
    fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none',
    color: '#1A1A1A', background: '#FAFAFA', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div className="ac-page">
      {/* ── CHECKOUT MODAL ── */}
      {showForm && (
        <div className="dist-encuesta-overlay" onClick={() => setShowForm(false)}>
          <div className="dist-encuesta-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 900, color: '#2C2318', marginBottom: 4 }}>
              Únete a la Academia
            </h3>
            <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 20 }}>Crea tu cuenta y accede al instante.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Nombre completo *" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required style={inputSt} />
              <input placeholder="Correo electrónico *" type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} required style={inputSt} />
              <div style={{ display: 'flex', border: '1.5px solid #E0D6CE', borderRadius: 10, overflow: 'hidden', background: '#FAFAFA' }}>
                <span style={{ padding: '13px 10px', fontSize: 13, color: '#7A6A5A', borderRight: '1px solid #E0D6CE', background: '#F3EFE8', whiteSpace: 'nowrap' }}>🇲🇽 +52</span>
                <input placeholder="Teléfono (opcional)" type="tel" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} style={{ flex: 1, border: 'none', padding: '13px 12px', fontSize: 14, fontFamily: 'Poppins, sans-serif', outline: 'none', color: '#1A1A1A', background: 'transparent', minWidth: 0 }} />
              </div>
              {formErr && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{formErr}</p>}
              <button type="submit" disabled={sending} className="dist-enc-siguiente" style={{ marginTop: 4 }}>
                {sending ? 'Creando tu cuenta…' : 'Ir a mis cursos →'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: '#B0A09A', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6 }}>
              Sin cobros automáticos. Cancela cuando quieras.
            </p>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="ac-nav">
        <Link to="/" className="ac-nav-logo">Be Alquimist</Link>
        <div className="ac-nav-right">
          {isLoggedIn
            ? <Link to="/cuenta" className="ac-nav-link">Mi cuenta</Link>
            : <Link to="/login"  className="ac-nav-link">Iniciar sesión</Link>
          }
          {!esPro && (
            <button className="ac-nav-cta" onClick={handleCTA}>Suscribirme $149</button>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ac-hero">
        <div className="ac-hero-inner">
          <div className="ac-hero-badge">🌿 Acceso completo · Sin contratos</div>
          <h1 className="ac-hero-title">
            La Academia de<br />
            <span className="ac-hero-accent">Cosmética Natural</span>
          </h1>
          <p className="ac-hero-sub">
            11 cursos, biblioteca de ingredientes, chat IA ilimitado y envíos gratis — todo por <strong>$149 MXN</strong>.
          </p>
          {esPro ? (
            <Link to="/comunidad/cursos" className="ac-hero-btn">Ir a mis cursos →</Link>
          ) : (
            <button className="ac-hero-btn" onClick={handleCTA}>Comenzar hoy por $149 →</button>
          )}
          <p className="ac-hero-fine">Cancela cuando quieras · Sin tarifa de inscripción</p>
        </div>

        <div className="ac-stats-row">
          {[['11+','Cursos'], ['30+','Fórmulas base'], ['∞','Chat IA'], ['🚚','Envíos gratis']].map(([n,l],i) => (
            <div key={i} className="ac-stat">
              <span className="ac-stat-num">{n}</span>
              <span className="ac-stat-lbl">{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURSOS ── */}
      <section className="ac-section">
        <div className="ac-section-inner">
          <p className="ac-section-tag">📚 Contenido incluido</p>
          <h2 className="ac-section-title">Todos los cursos de la academia</h2>
          <p className="ac-section-sub">Accede al instante a todo el catálogo. Avanza a tu ritmo.</p>
          <div className="ac-cursos-grid">
            {CURSOS.map((c, i) => {
              const lvl = NIVEL_COLOR[c.nivel] || NIVEL_COLOR['Básico'];
              return (
                <div key={i} className="ac-curso-card">
                  <span className="ac-curso-icon">{c.icon}</span>
                  <div className="ac-curso-body">
                    <div className="ac-curso-top">
                      <h3 className="ac-curso-nombre">{c.nombre}</h3>
                      <span className="ac-curso-nivel" style={{ background: lvl.bg, color: lvl.color }}>{c.nivel}</span>
                    </div>
                    <p className="ac-curso-desc">{c.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RUTA DE LA ALQUIMISTA ── */}
      <section className="ac-ruta-section">
        <div className="ac-section-inner">
          <div className="ac-ruta-header">
            <p className="ac-section-tag ac-tag-light">⭐ Programa estrella</p>
            <h2 className="ac-ruta-title">Ruta de la Alquimista</h2>
            <p className="ac-ruta-sub">
              El programa de formación estructurado para llevarte de cero a tener tu primer producto en venta.
              6 módulos progresivos diseñados para que no te pierdas en el camino.
            </p>
          </div>
          <div className="ac-ruta-grid">
            {RUTA_MODULOS.map((m, i) => (
              <div key={i} className="ac-ruta-modulo">
                <span className="ac-ruta-num">{m.num}</span>
                <div>
                  <h4 className="ac-ruta-mod-nombre">{m.nombre}</h4>
                  <p className="ac-ruta-mod-desc">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIBLIOTECA ── */}
      <section className="ac-section">
        <div className="ac-section-inner">
          <p className="ac-section-tag">📖 Referencia siempre disponible</p>
          <h2 className="ac-section-title">Biblioteca de ingredientes y formulaciones</h2>
          <p className="ac-section-sub">Todo lo que necesitas saber sobre cada ingrediente, en un solo lugar.</p>
          <div className="ac-bib-grid">
            {BIBLIOTECA.map((b, i) => (
              <div key={i} className="ac-bib-card">
                <span className="ac-bib-icon">{b.icon}</span>
                <div>
                  <h4 className="ac-bib-cat">{b.cat}</h4>
                  <p className="ac-bib-items">{b.items}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="ac-beneficios-section">
        <div className="ac-section-inner">
          <p className="ac-section-tag">✨ Con tu suscripción también obtienes</p>
          <h2 className="ac-section-title ac-title-light">Mucho más que cursos</h2>
          <div className="ac-beneficios-grid">
            {BENEFICIOS.map((b, i) => (
              <div key={i} className="ac-beneficio-card">
                <span className="ac-beneficio-icon">{b.icon}</span>
                <h3 className="ac-beneficio-titulo">{b.titulo}</h3>
                <p className="ac-beneficio-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="ac-section">
        <div className="ac-section-inner ac-pricing-wrap">
          <div className="ac-pricing-card">
            <p className="ac-pricing-badge">Todo incluido</p>
            <div className="ac-pricing-price">
              <span className="ac-pricing-currency">$</span>
              <span className="ac-pricing-amount">149</span>
              <span className="ac-pricing-period">MXN</span>
            </div>
            <p className="ac-pricing-note">Cancela cuando quieras. Sin contratos.</p>
            <ul className="ac-pricing-list">
              {['11 cursos especializados + los que se agreguen','Ruta de la Alquimista (6 módulos)','Biblioteca de +100 ingredientes y 30+ fórmulas','Chat IA de formulación ilimitado','Envíos gratis en todos tus pedidos','Comunidad activa e insignia PRO'].map((item, i) => (
                <li key={i}><span className="ac-check">✓</span>{item}</li>
              ))}
            </ul>
            {esPro ? (
              <Link to="/comunidad/cursos" className="ac-pricing-btn" style={{ display:'block', textAlign:'center', textDecoration:'none' }}>
                Ir a mis cursos →
              </Link>
            ) : (
              <button className="ac-pricing-btn" onClick={handleCTA}>
                {isLoggedIn ? 'Suscribirme ahora' : 'Crear cuenta y suscribirme'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ac-section ac-faq-section">
        <div className="ac-section-inner ac-faq-inner">
          <h2 className="ac-section-title">Preguntas frecuentes</h2>
          {FAQ.map((item, i) => (
            <div key={i} className="ac-faq-item">
              <button className="ac-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {item.q}
                <span className="ac-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && <p className="ac-faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      {!esPro && (
        <section className="ac-final-cta">
          <h2 className="ac-final-title">¿Lista para empezar a formular?</h2>
          <p className="ac-final-sub">Únete hoy y accede a todo al instante.</p>
          <button className="ac-hero-btn" onClick={handleCTA}>Suscribirme por $149 →</button>
          <p className="ac-hero-fine" style={{ marginTop: 12 }}>Sin tarifa de inscripción · Cancela cuando quieras</p>
        </section>
      )}

      <footer className="ac-footer">
        <Link to="/">← Volver al inicio</Link>
        <span>·</span>
        <Link to="/privacidad">Privacidad</Link>
        <span>·</span>
        <Link to="/politicas-de-compra">Políticas</Link>
      </footer>
    </div>
  );
}
