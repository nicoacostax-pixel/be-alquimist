import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './shared/context/CartContext';

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

// Importaciones de Comunidad
import ComunidadLayout from './features/comunidad/components/ComunidadLayout';
import ForoPrincipal from './features/comunidad/pages/ForoPrincipal';
import Calendario from './features/comunidad/pages/Calendario';
import Miembros from './features/comunidad/pages/Miembros';
import Marcadores from './features/comunidad/pages/Marcadores';



function App() {
  return (
    <CartProvider>
      <Router>
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

          {/* --- RUTAS DE COMUNIDAD (TIPO SKOOL) --- */}
          <Route path="/comunidad" element={<ComunidadLayout />}>
            {/* La ruta index es la que se ve apenas entras a /comunidad */}
            <Route index element={<ForoPrincipal />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="miembros" element={<Miembros />} />
            <Route path="marcadores" element={<Marcadores />} />
          </Route>

        </Routes>
        <SocialProofPopup />
      </Router>
    </CartProvider>
  );
}

export default App;