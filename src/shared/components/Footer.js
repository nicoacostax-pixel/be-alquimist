import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const HIDDEN_ON = ['/', '/login', '/registro', '/admin', '/checkout', '/checkout/gracias', '/distribuidoras', '/distribuidoras/gracias'];

export default function Footer() {
  const { pathname } = useLocation();
  if (HIDDEN_ON.some(p => pathname === p) || pathname.startsWith('/admin') || pathname.startsWith('/comunidad')) return null;

  return (
    <footer style={{
      background: '#2D2520',
      color: '#C9B8A8',
      fontFamily: 'Poppins, sans-serif',
      padding: '48px 24px 28px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Top */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, marginBottom: 40, justifyContent: 'space-between' }}>

          {/* Brand */}
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F5EDE3', letterSpacing: 1, marginBottom: 8 }}>
              Be Alquimist
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 240 }}>
              Cosmética natural formulada con inteligencia artificial. Insumos de calidad, enviados a todo México.
            </p>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#B08968', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px' }}>
              Legal
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/politicas-de-compra" style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Políticas de compra</Link>
              <Link to="/privacidad"           style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Política de privacidad</Link>
              <Link to="/aviso-legal"          style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Aviso legal</Link>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#B08968', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px' }}>
              Tienda
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/insumos"    style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Todos los insumos</Link>
              <Link to="/biblioteca" style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Biblioteca</Link>
              <Link to="/comunidad"  style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Comunidad</Link>
              <Link to="/pro"        style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>Alquimist PRO</Link>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#B08968', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px' }}>
              Contacto
            </p>
            <a href="mailto:hola@bealquimist.com" style={{ color: '#C9B8A8', textDecoration: 'none', fontSize: 14 }}>
              hola@bealquimist.com
            </a>
            <p style={{ fontSize: 13, margin: '10px 0 0', lineHeight: 1.6 }}>
              Lunes a viernes<br />9:00 – 18:00 hrs (CDMX)
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #3D3028', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#7A6A5A' }}>
            © {new Date().getFullYear()} Be Alquimist. Todos los derechos reservados.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#7A6A5A' }}>
            Hecho con 🌿 en México
          </p>
        </div>

      </div>
    </footer>
  );
}
