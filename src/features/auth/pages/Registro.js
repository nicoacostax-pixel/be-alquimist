import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

function Registro() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/cuenta');
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
          <p className="app-subtitle-final">Crea tu cuenta de Alquimista</p>
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

