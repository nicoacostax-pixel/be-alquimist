import React, { useState, useEffect } from 'react'; // Agregamos useEffect
import { useNavigate } from 'react-router-dom';
// Importamos supabase desde la nueva carpeta shared/lib
import { supabase } from '../../../shared/lib/supabaseClient'; 
import '../../../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- LÓGICA DE REDIRECCIÓN PROACTIVA ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Si el usuario ya está logueado, lo mandamos a cuenta de inmediato
        navigate('/cuenta'); 
      }
    };

    checkUser();
  }, [navigate]);
  // ---------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        alert("Error: " + error.message);
      } else if (data.user) {
        navigate('/cuenta');
      }
    } catch (error) {
      alert("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container login-page-wrapper">
      <div className="login-box-premium">
        <div className="center-text">
          <div className="static-name">Be Alquimist</div>
          <p className="app-subtitle-final">Acceso al Laboratorio</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group-premium">
            <label className="premium-label">Email</label>
            <input
              type="email"
              className="premium-input-field"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group-premium">
            <label className="premium-label">Contraseña</label>
            <input
              type="password"
              className="premium-input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="premium-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer-actions center-text" style={{ marginTop: '25px' }}>
          <p className="app-subtitle-final">
            ¿No tienes cuenta?{' '}
            <span
              className="premium-link"
              onClick={() => navigate('/registro')}
              style={{ cursor: 'pointer', fontWeight: 'bold', color: '#B08968' }}
            >
              Crea una aquí
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;