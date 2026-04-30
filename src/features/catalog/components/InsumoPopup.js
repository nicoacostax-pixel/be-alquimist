import React, { useState, useEffect } from 'react';

const POPUP_KEY = 'bea_lead_popup_count';
const MAX_SHOWS = 3;

export default function InsumoPopup() {
  const [visible,  setVisible]  = useState(false);
  const [telefono, setTelefono] = useState('');
  const [email,    setEmail]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem(POPUP_KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;
    const t = setTimeout(() => setVisible(true), 3000);
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
        body: JSON.stringify({ telefono, email, tipo: 'aceite_de_regalo' }),
      });
      setSent(true);
      setTimeout(cerrar, 2200);
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

          <p className="lead-pre">Adquiere tu</p>
          <h2 className="lead-product">ACEITE<br />ESENCIAL</h2>
          <p className="lead-free">gratuito</p>
          <p className="lead-sub">*Con tu primer pedido</p>

          {sent ? (
            <p className="lead-thanks">¡Gracias! Te contactaremos pronto 🌿</p>
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
                {sending ? 'Enviando…' : 'ENVIAR'}
              </button>
            </form>
          )}

          <button className="lead-skip" onClick={cerrar}>No quiero un regalo gratis</button>
        </div>

        <div className="lead-right">
          <img src="/popup-aceite.jpg" alt="" className="lead-right-img" />
        </div>
      </div>
    </div>
  );
}
