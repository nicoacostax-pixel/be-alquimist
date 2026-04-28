import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useCart } from '../../../shared/context/CartContext';
import CartSidebar from '../../../shared/components/CartSidebar';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import '../../../App.css';

function toCategoryPath(value = '') {
  return value.toLowerCase().replace(/\s+/g, '-');
}

const TABS = [
  { name: 'Comunidad',  path: '/comunidad' },
  { name: 'Calendario', path: '/comunidad/calendario' },
  { name: 'Miembros',   path: '/comunidad/miembros' },
  { name: 'Marcadores', path: '/comunidad/marcadores' },
];

export default function ComunidadLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults]     = useState(false);
  const searchRef = useRef(null);
  const { cartCount } = useCart();

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

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
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
    </div>
  );
}
