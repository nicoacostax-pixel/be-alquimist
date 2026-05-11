import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

function Registro() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: ''
  });

  const [errorEmail,    setErrorEmail]    = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');
  const [loading,       setLoading]       = useState(false);

  const telefonoTimer = useRef(null);
  const emailTimer    = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));

    if (name === 'telefono') {
      setErrorTelefono('');
      clearTimeout(telefonoTimer.current);
      telefonoTimer.current = setTimeout(async () => {
        if (!value.trim()) return;
        const { data } = await supabase
          .from('perfiles')
          .select('telefono')
          .eq('telefono', value.trim())
          .maybeSingle();
        if (data) setErrorTelefono("Este número ya está registrado");
      }, 500);
    }

    if (name === 'email') {
      setErrorEmail('');
      clearTimeout(emailTimer.current);
      emailTimer.current = setTimeout(async () => {
        if (!value.trim()) return;
        const { data } = await supabase
          .from('perfiles')
          .select('email')
          .eq('email', value.trim())
          .single();
        if (data) setErrorEmail("Ups, otra Alquimista registró este correo");
      }, 500);
    }
  };

  const checkEmailExists = async () => {
    if (!formData.email) return;
    const { data } = await supabase
      .from('perfiles')
      .select('email')
      .eq('email', formData.email)
      .single();
    if (data) setErrorEmail("Ups, otra Alquimista registró este correo");
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (errorEmail || errorTelefono) return;

    setLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.nombre,
          last_name: formData.apellido,
          phone: formData.telefono,
        }
      }
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      if (signUpData?.user) {
        await supabase.from('perfiles').upsert({
          id: signUpData.user.id,
          telefono: formData.telefono.trim(),
        });
        fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, nombre: formData.nombre }),
        }).catch(() => {});
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, telefono: formData.telefono, tipo: 'usuario_nuevo' }),
        }).catch(() => {});
        if (window.fbq) window.fbq('track', 'CompleteRegistration');
      }
      alert("¡Bienvenida al laboratorio!");
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="app-container login-page-wrapper">
      <div className="login-box-premium">
        <div className="center-text">
          <div className="static-name">Be Alquimist</div>
          <p className="app-subtitle-final" style={{ marginBottom: 24 }}>Crea tu cuenta de Alquimista</p>
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/' } })}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#fff', border: '1.5px solid #D0C8BF', borderRadius: 10, padding: '13px 16px',
            fontSize: 15, fontWeight: 600, cursor: 'pointer', color: '#4A3F35', marginBottom: 16,
            fontFamily: 'inherit',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
          Continuar con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E8D5C0' }} />
          <span style={{ color: '#9E8E80', fontSize: 13 }}>o con email</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E8D5C0' }} />
        </div>

        <form className="login-form" onSubmit={handleRegistro}>
          <div className="input-group-premium">
            <label className="premium-label">Nombre</label>
            <input name="nombre" type="text" className="premium-input-field" placeholder="Tu nombre" onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Apellido</label>
            <input name="apellido" type="text" className="premium-input-field" placeholder="Tu apellido" onChange={handleChange} required />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              className={`premium-input-field ${errorTelefono ? 'input-error' : ''}`}
              placeholder="Ej: +52 8112345678"
              value={formData.telefono}
              onChange={handleChange}
              required
            />
            {errorTelefono && <span className="error-message-alquimist">{errorTelefono}</span>}
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Email</label>
            <input
              name="email"
              type="email"
              className={`premium-input-field ${errorEmail ? 'input-error' : ''}`}
              placeholder="tu@email.com"
              onChange={handleChange}
              required
            />
            {errorEmail && <span className="error-message-alquimist">{errorEmail}</span>}
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Contraseña</label>
            <input name="password" type="password" className="premium-input-field" placeholder="Tu contraseña" onChange={handleChange} required />
          </div>

          <button type="submit" className="premium-submit-btn" disabled={loading || !!errorEmail || !!errorTelefono}>
            {loading ? "Mezclando ingredientes..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="login-footer-actions center-text" style={{ marginTop: '20px' }}>
          <p className="app-subtitle-final">
            ¿Ya tienes cuenta? <span className="premium-link" onClick={() => navigate('/login')}>Inicia sesión</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;

