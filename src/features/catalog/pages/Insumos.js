import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Menu,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useCart } from '../../../shared/context/CartContext';
import CartSidebar from '../../../shared/components/CartSidebar';
import '../../../App.css';
import SidebarMenu from '../components/SidebarMenu';

function toCategoryPath(value = '') {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function pseudoRating(slug = '') {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  const stars = 4 + (Math.abs(hash) % 2 === 0 ? 1 : 0);
  const reviews = 8 + (Math.abs(hash) % 43);
  return { stars, reviews };
}

function Insumos() {
  const { categoria } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      let query = supabase.from('productos').select('*');

      if (categoria && categoria !== 'todos') {
        const categoriaLabel = categoria.replace(/-/g, ' ');
        query = query.ilike('categoria', categoriaLabel);
      }

      const { data, error } = await query;
      if (!error) setProductos(data || []);
      setLoading(false);
    }
    fetchProductos();
  }, [categoria]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
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

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <div className="loading-state">Cargando catálogo...</div>;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <header className="app-header-premium insumos-header">
        <div className="insumos-mobile-top">
          <button className="header-icon-btn" onClick={toggleSidebar} type="button" aria-label="Abrir menú">
            <Menu size={22} color="#B08968" />
          </button>
          <Link to="/" className="logo-link">
            <div className="app-logo-small">Be Alquimist</div>
          </Link>
          <div className="cart-icon-wrapper">
            <button type="button" className="header-icon-btn" aria-label="Abrir carrito" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={23} color="#4A3F35" />
            </button>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
        </div>

        <div className="insumos-desktop-top">
          <div className="insumos-left-group">
            <button className="header-icon-btn" onClick={toggleSidebar} type="button" aria-label="Abrir menú">
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
              {showResults && (
                <div className="live-search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, index) => (
                      <Link
                        key={index}
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
                    ))
                  ) : (
                    <div className="no-results">No se encontraron coincidencias</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="header-top-row insumos-actions-wrap">
            <div className="cart-icon-wrapper">
              <button type="button" className="header-icon-btn" aria-label="Abrir carrito" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={24} color="#4A3F35" />
              </button>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </div>
        </div>

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
            {showResults && (
              <div className="live-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((res, index) => (
                    <Link
                      key={index}
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
                  ))
                ) : (
                  <div className="no-results">No se encontraron coincidencias</div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="insumos-page-content">
        <div className="promo-banner-full">
          <div className="promo-banner-inner">
            <p>
              Te regalamos $50 MXN en tu primera compra — solo tienes que usar el cupón
              <strong> “Newuser”</strong> (Válido en compras mayores a $499 MXN)
            </p>
          </div>
        </div>

        <div className="insumos-content-inner">
          <nav className="breadcrumb">
            <Link to="/">Inicio</Link>
            <ChevronRight size={14} />
            <span className="current capitalize">
              {categoria ? categoria.replace(/-/g, ' ') : 'Todos los productos'}
            </span>
          </nav>

          <header className="category-page-header">
            <h1 className="capitalize">{categoria ? categoria.replace(/-/g, ' ') : 'Catálogo'}</h1>
          </header>

          <div className="productos-grid">
            {productos.map((prod) => {
              const { stars, reviews } = pseudoRating(prod.slug);
              return (
                <div key={prod.id} className="producto-card">
                  <Link to={`/insumos/${toCategoryPath(prod.categoria)}/${prod.slug}`} className="card-link-wrapper">
                    <div className="prod-img-wrap">
                      <img src={prod.imagen_url} alt={prod.nombre} />
                    </div>
                    <div className="prod-info">
                      <h3 className="prod-name">{prod.nombre}</h3>
                      <div className="prod-rating">
                        <span className="prod-stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                        <span className="prod-reviews">({reviews})</span>
                      </div>
                      <p className="prod-price">Desde ${prod.variantes?.[0]?.precio} MXN</p>
                      <button className="prod-btn">Ver producto</button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Insumos;