import React, { useState, useEffect } from 'react';
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

  const [errorEmail, setErrorEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'email') setErrorEmail('');
  };

  const checkEmailExists = async () => {
    if (!formData.email) return;

    const { data } = await supabase
      .from('perfiles')
      .select('email')
      .eq('email', formData.email)
      .single();

    if (data) {
      setErrorEmail("Ups, otra Alquimista registró este correo");
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    if (errorEmail) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
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
              className="premium-input-field"
              placeholder="Ej: +52 8112345678"
              value={formData.telefono}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Email</label>
            <input
              name="email"
              type="email"
              className={`premium-input-field ${errorEmail ? 'input-error' : ''}`}
              placeholder="tu@email.com"
              onChange={handleChange}
              onBlur={checkEmailExists}
              required
            />
            {errorEmail && <span className="error-message-alquimist">{errorEmail}</span>}
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Contraseña</label>
            <input name="password" type="password" className="premium-input-field" placeholder="Tu contraseña" onChange={handleChange} required />
          </div>

          <button type="submit" className="premium-submit-btn" disabled={loading || errorEmail}>
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

