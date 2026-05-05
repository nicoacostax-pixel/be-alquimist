import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../App.css';

const EXTENSIONES = [
  { code: '+52', flag: '🇲🇽', label: 'MX' },
  { code: '+1',  flag: '🇺🇸', label: 'US/CA' },
  { code: '+57', flag: '🇨🇴', label: 'CO' },
  { code: '+54', flag: '🇦🇷', label: 'AR' },
  { code: '+56', flag: '🇨🇱', label: 'CL' },
  { code: '+51', flag: '🇵🇪', label: 'PE' },
  { code: '+34', flag: '🇪🇸', label: 'ES' },
];

const PREGUNTAS = [
  {
    key: 'q1',
    texto: '¿Cómo piensas comercializar los productos?',
    opciones: ['Reventa directa', 'Tienda física', 'Redes sociales', 'Mercados o ferias', 'Otra'],
  },
  {
    key: 'q2',
    texto: '¿Cuánto estarías dispuesta a invertir en tu primer pedido?',
    opciones: ['Menos de $500', '$500 – $1,500', 'Más de $1,500'],
  },
  {
    key: 'q3',
    texto: '¿Ya vendes productos de belleza o cosmética natural actualmente?',
    opciones: ['Sí, activamente', 'Sí, de vez en cuando', 'No, pero quiero empezar'],
  },
  {
    key: 'q4',
    texto: '¿Cuántos clientes o seguidores tienes actualmente a los que podrías ofrecer estos productos?',
    opciones: ['Menos de 100', '100 – 500', '500 – 2,000', 'Más de 2,000'],
  },
  {
    key: 'q5',
    texto: '¿Cuándo planeas hacer tu primer pedido?',
    opciones: ['Esta semana', 'Este mes', 'En 2–3 meses', 'Solo estoy explorando'],
  },
];

const BENEFICIOS = [
  { icon: '💰', titulo: 'Desde $999 MXN', desc: 'Inversión inicial accesible para empezar tu negocio sin riesgos.' },
  { icon: '🌿', titulo: 'Productos 100% naturales', desc: 'Cosmética artesanal con ingredientes de calidad que los clientes adoran.' },
  { icon: '📦', titulo: 'Sin exclusividades', desc: 'Vende en tu región sin restricciones geográficas ni cuotas mínimas.' },
  { icon: '💬', titulo: 'Comunidad y soporte', desc: 'Acceso a comunidad privada, materiales de venta y soporte directo.' },
];

const PASOS = [
  { num: '01', titulo: 'Regístrate gratis', desc: 'Llena el formulario y cuéntanos un poco sobre ti.' },
  { num: '02', titulo: 'Elige tu paquete', desc: 'Te contactamos para guiarte en tu primer pedido desde $999 MXN.' },
  { num: '03', titulo: 'Empieza a vender', desc: 'Recibe tus productos y vende con nuestro apoyo de marketing.' },
];

export default function Distribuidoras() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Formulario principal
  const [form, setForm] = useState({ nombre: '', extension: '+52', telefono: '', email: '' });
  const [formError, setFormError] = useState('');

  // Encuesta
  const [showEncuesta, setShowEncuesta] = useState(false);
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [encuestaError, setEncuestaError] = useState('');

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setFormError('Por favor completa nombre y correo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Ingresa un correo válido.');
      return;
    }
    setFormError('');
    setShowEncuesta(true);
    setPaso(0);
    setRespuestas({});
  }

  function seleccionar(key, valor) {
    setRespuestas(prev => ({ ...prev, [key]: valor }));
    setEncuestaError('');
  }

  function siguiente() {
    const pregunta = PREGUNTAS[paso];
    if (!respuestas[pregunta.key]) {
      setEncuestaError('Selecciona una opción para continuar.');
      return;
    }
    if (paso < PREGUNTAS.length - 1) {
      setPaso(p => p + 1);
    } else {
      enviarTodo();
    }
  }

  async function enviarTodo() {
    setEnviando(true);
    try {
      await fetch('/api/distribuidoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          extension: form.extension,
          telefono: form.telefono,
          email: form.email,
          q1: respuestas.q1,
          q2: respuestas.q2,
          q3: respuestas.q3,
          q4: respuestas.q4,
          q5: respuestas.q5,
        }),
      });
      if (window.fbq) window.fbq('track', 'Lead', { content_name: 'distribuidora' });
      navigate('/distribuidoras/gracias');
    } catch {
      setEncuestaError('Hubo un problema. Inténtalo de nuevo.');
      setEnviando(false);
    }
  }

  const pregActual = PREGUNTAS[paso];
  const progreso = Math.round(((paso + 1) / PREGUNTAS.length) * 100);

  return (
    <div className="dist-page">

      {/* ── ENCUESTA POPUP ─── */}
      {showEncuesta && (
        <div className="dist-encuesta-overlay" onClick={() => setShowEncuesta(false)}>
          <div className="dist-encuesta-modal" onClick={e => e.stopPropagation()}>
            <div className="dist-enc-progress-bar">
              <div className="dist-enc-progress-fill" style={{ width: `${progreso}%` }} />
            </div>
            <p className="dist-enc-step">Pregunta {paso + 1} de {PREGUNTAS.length}</p>
            <h3 className="dist-enc-pregunta">{pregActual.texto}</h3>
            <div className="dist-enc-opciones">
              {pregActual.opciones.map(op => (
                <button
                  key={op}
                  className={`dist-enc-opcion ${respuestas[pregActual.key] === op ? 'selected' : ''}`}
                  onClick={() => seleccionar(pregActual.key, op)}
                >
                  {op}
                </button>
              ))}
            </div>
            {encuestaError && <p className="dist-enc-error">{encuestaError}</p>}
            <button
              className="dist-enc-siguiente"
              onClick={siguiente}
              disabled={enviando}
            >
              {enviando ? 'Enviando…' : paso < PREGUNTAS.length - 1 ? 'Siguiente →' : '¡Enviar y ver mis beneficios! 🌿'}
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ─── */}
      <section className="dist-hero">
        <div className="dist-hero-badge">🌿 Oportunidad de negocio</div>
        <h1 className="dist-hero-title">
          Conviértete en<br />
          <span className="dist-hero-accent">Distribuidora Be Alquimist</span>
        </h1>
        <p className="dist-hero-sub">
          Vende cosmética 100% natural y artesanal en tu región.<br />
          Empieza desde <strong>$999 MXN</strong> con soporte completo y sin exclusividades.
        </p>
        <button className="dist-hero-cta" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          Quiero ser distribuidora →
        </button>
        <div className="dist-hero-stats">
          <div className="dist-stat"><span className="dist-stat-num">$999</span><span className="dist-stat-label">Inversión inicial mínima</span></div>
          <div className="dist-stat-div" />
          <div className="dist-stat"><span className="dist-stat-num">100%</span><span className="dist-stat-label">Natural y artesanal</span></div>
          <div className="dist-stat-div" />
          <div className="dist-stat"><span className="dist-stat-num">∞</span><span className="dist-stat-label">Potencial de ventas</span></div>
        </div>
      </section>

      {/* ── BENEFICIOS ─── */}
      <section className="dist-section">
        <h2 className="dist-section-title">¿Por qué ser distribuidora?</h2>
        <div className="dist-beneficios-grid">
          {BENEFICIOS.map((b, i) => (
            <div key={i} className="dist-beneficio-card">
              <span className="dist-beneficio-icon">{b.icon}</span>
              <h3 className="dist-beneficio-titulo">{b.titulo}</h3>
              <p className="dist-beneficio-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─── */}
      <section className="dist-section dist-section-dark">
        <h2 className="dist-section-title dist-title-light">Así de fácil es empezar</h2>
        <div className="dist-pasos">
          {PASOS.map((p, i) => (
            <div key={i} className="dist-paso">
              <div className="dist-paso-num">{p.num}</div>
              <h3 className="dist-paso-titulo">{p.titulo}</h3>
              <p className="dist-paso-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUÉ PUEDES VENDER ─── */}
      <section className="dist-section">
        <h2 className="dist-section-title">Productos que el mercado ya pide</h2>
        <div className="dist-productos-grid">
          {['🫒 Aceites vegetales', '🕯️ Ceras naturales', '💧 Hidrolatos', '🌸 Aceites esenciales', '🧴 Mantecas botánicas', '🫧 Emulsificantes', '✨ Activos cosméticos', '🌿 Extractos vegetales'].map((p, i) => (
            <div key={i} className="dist-producto-chip">{p}</div>
          ))}
        </div>
        <p className="dist-productos-note">Y más de 200 insumos para cosmética natural disponibles en nuestro catálogo</p>
      </section>

      {/* ── TESTIMONIAL / SOCIAL PROOF ─── */}
      <section className="dist-section dist-section-beige">
        <div className="dist-quote">
          <p className="dist-quote-text">"Empecé con un paquete inicial y en 3 meses ya tenía clientas fijas. Los productos se venden solos porque son de verdad naturales."</p>
          <p className="dist-quote-autor">— Mariana G., distribuidora en Guadalajara</p>
        </div>
      </section>

      {/* ── FORMULARIO ─── */}
      <section className="dist-section dist-form-section" ref={formRef}>
        <div className="dist-form-wrap">
          <h2 className="dist-form-title">¿Lista para empezar?</h2>
          <p className="dist-form-sub">Regístrate gratis. Te contactamos en menos de 24 horas.</p>
          <form className="dist-form" onSubmit={handleFormSubmit}>
            <div className="dist-field">
              <label className="dist-label">Nombre completo</label>
              <input
                type="text"
                className="dist-input"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="dist-field">
              <label className="dist-label">WhatsApp / Teléfono</label>
              <div className="dist-phone-row">
                <select
                  className="dist-ext-select"
                  value={form.extension}
                  onChange={e => setForm(f => ({ ...f, extension: e.target.value }))}
                >
                  {EXTENSIONES.map(ex => (
                    <option key={ex.code} value={ex.code}>{ex.flag} {ex.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  className="dist-input dist-input-tel"
                  placeholder="10 dígitos"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                />
              </div>
            </div>
            <div className="dist-field">
              <label className="dist-label">Correo electrónico</label>
              <input
                type="email"
                className="dist-input"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            {formError && <p className="dist-form-error">{formError}</p>}
            <button type="submit" className="dist-form-btn">
              Registrarme y ver más →
            </button>
            <p className="dist-form-legal">Sin spam. Tus datos son privados y no se comparten con terceros.</p>
          </form>
        </div>
      </section>

      {/* ── FOOTER MINI ─── */}
      <div className="dist-footer-mini">
        <span>© 2025 Be Alquimist</span>
        <a href="/privacidad">Privacidad</a>
        <a href="/politicas-de-compra">Políticas</a>
      </div>
    </div>
  );
}
