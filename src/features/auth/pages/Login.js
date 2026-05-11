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
        navigate('/'); 
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
        navigate('/');
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
          Entrar con Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E8D5C0' }} />
          <span style={{ color: '#9E8E80', fontSize: 13 }}>o con email</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #E8D5C0' }} />
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