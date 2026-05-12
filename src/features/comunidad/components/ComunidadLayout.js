import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link, Navigate, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useCart } from '../../../shared/context/CartContext';
import { useElementos } from '../../../shared/context/ElementosContext';
import CartSidebar from '../../../shared/components/CartSidebar';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import '../../../App.css';

function VideoWelcomePopup({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(20,14,8,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        maxWidth: 680, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 1,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
        <div style={{ padding: '24px 24px 12px', background: 'linear-gradient(135deg, #F3EFE8, #EDE0D4)' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#B08968', fontFamily: 'Poppins, sans-serif' }}>
            ⚗️ Bienvenida a Be Alquimist
          </p>
          <h2 style={{ margin: '6px 0 0', fontFamily: 'Georgia, serif', fontSize: 20, color: '#2C2318' }}>
            Empieza aquí — mira este video
          </h2>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src="https://player.vimeo.com/video/1191623841?autoplay=1&title=0&byline=0&portrait=0"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Bienvenida a Be Alquimist Academia"
          />
        </div>
        <div style={{ padding: '16px 24px 20px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#9E8E80',
              fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
              textDecoration: 'underline',
            }}
          >
            Cerrar y explorar la comunidad
          </button>
        </div>
      </div>
    </div>
  );
}

function ProUpgradePopup({ diasRestantes, onClose }) {
  const navigate = useNavigate();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(20,14,8,0.65)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, maxWidth: 440, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.12)', border: 'none', borderRadius: '50%',
            width: 30, height: 30, cursor: 'pointer', color: '#4A3F35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={15} />
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #B08968, #8C6A4F)',
          padding: '28px 28px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>⭐</div>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: 22, color: '#fff',
            margin: '0 0 8px', fontWeight: 900,
          }}>
            ¡Activa PRO completo!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Tu prueba gratuita termina en{' '}
            <strong style={{ color: '#FFE0B2' }}>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''}</strong>.
            Paga $149 MXN y extiende tu acceso a <strong style={{ color: '#FFE0B2' }}>30 días completos</strong>.
          </p>
        </div>

        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {['+12 cursos de cosmética natural', 'Envíos gratuitos en cada pedido', 'Chat IA de recetas personalizado', 'Comunidad activa de alquimistas'].map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#4A3F35' }}>
                <span style={{ color: '#B08968', fontWeight: 700 }}>✓</span> {b}
              </div>
            ))}
          </div>
          <button
            onClick={() => { onClose(); navigate('/pro'); }}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #B08968, #8C6A4F)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '14px 0', fontSize: 16, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 6px 20px rgba(176,137,104,0.4)',
            }}
          >
            Activar PRO por $149 MXN →
          </button>
          <button
            onClick={onClose}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: '#9E8E80', fontSize: 12, cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif', marginTop: 10,
            }}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

function toCategoryPath(value = '') {
  return value.toLowerCase().replace(/\s+/g, '-');
}

const TABS = [
  { name: 'Comunidad',  path: '/comunidad' },
  { name: 'Cursos',     path: '/comunidad/cursos' },
  { name: 'Calendario', path: '/comunidad/calendario' },
  { name: 'Marcadores', path: '/comunidad/marcadores' },
];

export default function ComunidadLayout() {
  const { isLoggedIn, isInitializing } = useElementos();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults]     = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showProPopup,   setShowProPopup]   = useState(false);
  const [diasRestantes,  setDiasRestantes]  = useState(0);
  const searchRef = useRef(null);
  const { cartCount } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.id) return;
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('es_pro, pro_expira_at')
        .eq('id', session.user.id)
        .single();

      // Welcome video popup — solo la primera vez
      const visto = localStorage.getItem('bea_welcome_seen');
      if (!visto) {
        setShowVideoPopup(true);
        localStorage.setItem('bea_welcome_seen', '1');
      }

      // PRO upgrade popup — usuarios en trial (≤8 días restantes)
      if (perfil?.es_pro && perfil?.pro_expira_at) {
        const dias = Math.ceil((new Date(perfil.pro_expira_at) - Date.now()) / (1000 * 60 * 60 * 24));
        if (dias > 0 && dias <= 8) {
          setDiasRestantes(dias);
          setShowProPopup(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        const { data } = await supabase
          .from('productos')
          .select('nombre, imagen_url, categoria, slug, variantes')
          .ilike('nombre', `%${searchTerm}%`)
          .limit(6);
        setSearchResults(data || []);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SearchDropdown = ({ results }) => (
    <div className="live-search-results">
      {results.length > 0 ? results.map((res, i) => (
        <Link
          key={i}
          to={`/insumos/${toCategoryPath(res.categoria)}/${res.slug}`}
          className="search-result-item"
          onClick={() => { setShowResults(false); setSearchTerm(''); }}
        >
          <img src={res.imagen_url} alt={res.nombre} />
          <div className="result-info">
            <p className="result-name">{res.nombre}</p>
            <p className="result-price">${res.variantes?.[0]?.precio} MXN</p>
          </div>
        </Link>
      )) : (
        <div className="no-results">No se encontraron coincidencias</div>
      )}
    </div>
  );

  if (!isInitializing && !isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      {showVideoPopup && <VideoWelcomePopup onClose={() => setShowVideoPopup(false)} />}
      {!showVideoPopup && showProPopup && <ProUpgradePopup diasRestantes={diasRestantes} onClose={() => setShowProPopup(false)} />}
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <header className="app-header-premium insumos-header">

        {/* ── Fila móvil ── */}
        <div className="insumos-mobile-top">
          <button className="header-icon-btn" onClick={() => setIsSidebarOpen(true)} type="button" aria-label="Abrir menú">
            <Menu size={22} color="#B08968" />
          </button>
          <Link to="/" className="logo-link">
            <div className="app-logo-small">Be Alquimist</div>
          </Link>
          <div className="cart-icon-wrapper">
            <button type="button" className="header-icon-btn" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrito">
              <ShoppingCart size={23} color="#4A3F35" />
            </button>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
        </div>

        {/* ── Buscador móvil ── */}
        <div className="header-search-row insumos-search-wrap insumos-mobile-search" ref={searchRef}>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar insumo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-premium"
              onFocus={() => searchTerm.length > 2 && setShowResults(true)}
            />
            {showResults && <SearchDropdown results={searchResults} />}
          </div>
        </div>

        {/* ── Fila desktop ── */}
        <div className="insumos-desktop-top">
          <div className="insumos-left-group">
            <button className="header-icon-btn" onClick={() => setIsSidebarOpen(true)} type="button" aria-label="Abrir menú">
              <Menu size={22} color="#B08968" />
            </button>
            <Link to="/" className="logo-link insumos-logo-wrap">
              <div className="app-logo-small">Be Alquimist</div>
            </Link>
          </div>

          <div className="header-search-row insumos-search-wrap" ref={searchRef}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-premium"
                onFocus={() => searchTerm.length > 2 && setShowResults(true)}
              />
              {showResults && <SearchDropdown results={searchResults} />}
            </div>
          </div>

          <div className="header-top-row insumos-actions-wrap">
            <div className="cart-icon-wrapper">
              <button type="button" className="header-icon-btn" onClick={() => setIsCartOpen(true)} aria-label="Abrir carrito">
                <ShoppingCart size={24} color="#4A3F35" />
              </button>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </div>
        </div>

        {/* ── Tabs de comunidad (dentro del header fijo) ── */}
        <nav className="comunidad-tabs-row">
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/comunidad'}
              className={({ isActive }) => isActive ? 'comunidad-tab active' : 'comunidad-tab'}
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>

      </header>

      <main className="comunidad-content">
        <Outlet />
      </main>

      {/* ── Fixed PRO CTA button ── */}
      <button
        onClick={() => navigate('/pro')}
        style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900,
          background: 'linear-gradient(135deg, #B08968, #8C6A4F)',
          color: '#fff', border: 'none', borderRadius: 50,
          padding: '14px 32px', fontSize: 15, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
          boxShadow: '0 6px 24px rgba(176,137,104,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        ⭐ Únete a PRO
      </button>
    </div>
  );
}
