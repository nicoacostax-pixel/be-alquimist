import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './shared/context/CartContext';
import { ElementosProvider } from './shared/context/ElementosContext';
import ErrorBoundary from './shared/components/ErrorBoundary';

import Login from './features/auth/pages/Login';
import ChatIA from './features/chat/pages/ChatIA';
import Registro from './features/auth/pages/Registro';
import Insumos from './features/catalog/pages/Insumos';
import Cuenta from './features/account/pages/Cuenta';
import AdminPanel from './features/admin/pages/AdminPanel';
import ProductoDetalle from './features/catalog/pages/ProductoDetalle';
import SocialProofPopup from './shared/components/SocialProofPopup';

import Checkout from './features/checkout/pages/Checkout';
import CheckoutGracias from './features/checkout/pages/CheckoutGracias';
import PerfilUsuario from './features/comunidad/pages/PerfilUsuario';
import ProLanding from './features/pro/pages/ProLanding';
import Cursos from './features/cursos/pages/Cursos';
import Biblioteca from './features/biblioteca/pages/Biblioteca';
import Footer from './shared/components/Footer';
import PoliticasDeCompra from './features/legal/PoliticasDeCompra';
import Privacidad from './features/legal/Privacidad';
import AvisoLegal from './features/legal/AvisoLegal';
import Distribuidoras from './features/distribuidoras/pages/Distribuidoras';
import DistribuidorasGracias from './features/distribuidoras/pages/DistribuidorasGracias';
import CursoVelas from './features/cursos/pages/CursoVelas';
import CursoVelasCheckout from './features/cursos/pages/CursoVelasCheckout';
import CursoPlayer from './features/cursos/pages/CursoPlayer';
import AdminCursosBuilder from './features/cursos/pages/AdminCursosBuilder';

// Importaciones de Comunidad
import ComunidadLayout from './features/comunidad/components/ComunidadLayout';
import ForoPrincipal from './features/comunidad/pages/ForoPrincipal';
import Calendario from './features/comunidad/pages/Calendario';
import Miembros from './features/comunidad/pages/Miembros';
import Marcadores from './features/comunidad/pages/Marcadores';
import CursosComunidad from './features/comunidad/pages/CursosComunidad';
import AcademiaLanding from './features/academia/pages/AcademiaLanding';



function WhatsAppFab() {
  const { pathname } = useLocation();
  const visible = pathname.startsWith('/insumos');
  if (!visible) return null;
  return (
    <a
      href="https://wa.me/524921365983"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Contactar por WhatsApp"
    >
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.47.647 4.788 1.778 6.8L2 30l7.4-1.744A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="#fff"/>
        <path d="M23.07 19.44c-.32-.16-1.892-.934-2.185-1.04-.292-.107-.505-.16-.718.16-.213.32-.825 1.04-.013 1.307.293.107 1.038.373 1.972.24.587-.086 1.12-.32 1.56-.693.32-.267.48-.587.16-.747zM16.08 7.2C11.2 7.2 7.2 11.2 7.2 16.08c0 1.747.48 3.387 1.307 4.8L7.2 24.8l4.053-1.28c1.36.747 2.934 1.173 4.613 1.173 4.88 0 8.88-4 8.88-8.88 0-4.893-3.893-8.613-8.667-8.613zm4.507 12.373c-.187.533-.96 1.013-1.6 1.147-.427.08-.987.16-2.88-.613-2.4-1.013-3.947-3.44-4.053-3.6-.107-.16-.854-1.147-.854-2.187 0-1.04.534-1.546.72-1.76.187-.213.427-.267.56-.267.133 0 .267 0 .373.004.134 0 .267.04.4.347.16.373.56 1.413.613 1.52.053.107.08.24.013.373-.16.32-.32.507-.427.64-.16.187-.32.387-.16.667.48.8 1.12 1.493 1.867 2.027.64.48 1.333.773 1.6.88.267.107.427.08.587-.053.16-.133.693-.8.88-1.08.187-.267.373-.213.627-.12.267.107 1.653.787 1.947.933.293.147.48.213.547.32.067.107.067.64-.12 1.173z" fill="#25D366"/>
      </svg>
    </a>
  );
}

function App() {
  return (
    <HelmetProvider>
    <ErrorBoundary>
    <CartProvider>
    <ElementosProvider>
      <Router>
        <WhatsAppFab />
        <Routes>
          {/* Home / Chat */}
          <Route path="/" element={<ChatIA />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          
          {/* Rutas de Insumos */}
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/insumos/:categoria" element={<Insumos />} />
          <Route path="/insumos/:categoria/:slug" element={<ProductoDetalle />} />
          
          {/* Perfil y Admin */}
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/gracias" element={<CheckoutGracias />} />
          <Route path="/perfil/:userId" element={<PerfilUsuario />} />
          <Route path="/pro" element={<ProLanding />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/cursos/velas-de-soya" element={<CursoVelas />} />
          <Route path="/cursos/velas-de-soya/checkout" element={<CursoVelasCheckout />} />
          <Route path="/cursos/:slug/aprender" element={<CursoPlayer />} />
          <Route path="/admin/cursos" element={<AdminCursosBuilder />} />
          <Route path="/academia" element={<AcademiaLanding />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/politicas-de-compra" element={<PoliticasDeCompra />} />
          <Route path="/privacidad"           element={<Privacidad />} />
          <Route path="/aviso-legal"          element={<AvisoLegal />} />
          <Route path="/distribuidoras"        element={<Distribuidoras />} />
          <Route path="/distribuidoras/gracias" element={<DistribuidorasGracias />} />

          {/* --- RUTAS DE COMUNIDAD (TIPO SKOOL) --- */}
          <Route path="/comunidad" element={<ComunidadLayout />}>
            {/* La ruta index es la que se ve apenas entras a /comunidad */}
            <Route index element={<ForoPrincipal />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="miembros" element={<Miembros />} />
            <Route path="marcadores" element={<Marcadores />} />
            <Route path="cursos" element={<CursosComunidad />} />
          </Route>

        </Routes>
        <Footer />
        <SocialProofPopup />
      </Router>
    </ElementosProvider>
    </CartProvider>
    </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;