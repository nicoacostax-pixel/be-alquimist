import React, { useState, useEffect } from 'react';

const POPUP_KEY = 'bea_curso_velas_popup_count';
const MAX_SHOWS = 3;

export default function CursoVelasPopup() {
  const [visible,  setVisible]  = useState(false);
  const [telefono, setTelefono] = useState('');
  const [email,    setEmail]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(POPUP_KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const cerrar = () => {
    const count = parseInt(localStorage.getItem(POPUP_KEY) || '0', 10);
    localStorage.setItem(POPUP_KEY, String(count + 1));
    setVisible(false);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, email, tipo: 'descuento_curso_velas' }),
      });
      setSent(true);
      setTimeout(cerrar, 15000);
    } catch {}
    setSending(false);
  };

  if (!visible) return null;

  return (
    <div className="lead-overlay" onClick={(e) => e.target === e.currentTarget && cerrar()}>
      <div className="lead-modal">
        <button className="lead-close" onClick={cerrar}>✕</button>

        <div className="lead-left">
          <div className="lead-logo">⚗️ Be Alquimist</div>

          <p className="lead-pre">Reclama tu</p>
          <h2 className="lead-product">DESCUENTO<br />DE $300</h2>
          <p className="lead-free" style={{ fontStyle: 'normal', color: '#B08968' }}>en el Curso de Velas de Soya</p>
          <p className="lead-sub">*Deja tus datos y te contactamos</p>

          {sent ? (
            <div>
              <p className="lead-thanks">¡Listo! Usa este cupón al hacer tu pedido 🕯️</p>
              <div style={{
                background: '#F3EFE8', border: '2px dashed #B08968', borderRadius: 10,
                padding: '14px 20px', textAlign: 'center', marginTop: 12,
              }}>
                <p style={{ fontSize: 11, color: '#7A6A5A', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 1 }}>Tu cupón de descuento</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#4A3F35', margin: 0, letterSpacing: 3 }}>300DES</p>
                <p style={{ fontSize: 11, color: '#B08968', margin: '4px 0 0' }}>Válido solo para el <strong>Kit de Velas de Soya</strong></p>
                <p style={{ fontSize: 11, color: '#C0392B', fontWeight: 700, margin: '8px 0 0', letterSpacing: 0.5 }}>⏳ Válido solo los próximos 5 minutos</p>
              </div>
            </div>
          ) : (
            <form className="lead-form" onSubmit={enviar}>
              <div className="lead-phone-wrap">
                <span className="lead-flag">🇲🇽 +52</span>
                <input
                  type="tel"
                  className="lead-input lead-input--phone"
                  placeholder="Número de teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <input
                type="email"
                className="lead-input"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="lead-submit" type="submit" disabled={sending}>
                {sending ? 'Enviando…' : 'RECLAMAR DESCUENTO'}
              </button>
            </form>
          )}

          <button className="lead-skip" onClick={cerrar}>No quiero el descuento</button>
        </div>

        <div className="lead-right">
          <img src="/KIT.jpg" alt="" className="lead-right-img" />
        </div>
      </div>
    </div>
  );
}
