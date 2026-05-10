import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
import InsumoPopup from '../components/InsumoPopup';

function deaccent(str = '') {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function toCategoryPath(value = '') {
  return deaccent(value.toLowerCase()).replace(/\s+/g, '-');
}

function firstCategory(categoria = '') {
  return (categoria.split(',')[0] || '').trim();
}

function pseudoRating(slug = '') {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  const reviews = 8 + (Math.abs(hash) % 43);
  return { stars: 5, reviews };
}

const ITEMS_PER_PAGE = 12;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const [currentPage, setCurrentPage] = useState(1);
  const { cartCount } = useCart();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      let query = supabase.from('productos').select('*');

      const { data, error } = await query;
      if (!error) {
        let result = data || [];
        if (categoria && categoria !== 'todos') {
          const categoriaLabel = deaccent(categoria.replace(/-/g, ' ').toLowerCase());
          result = result.filter(p =>
            (p.categoria || '').split(',').some(c => deaccent(c.trim().toLowerCase()) === categoriaLabel)
          );
        }
        setProductos(shuffle(result));
      }
      setLoading(false);
    }
    fetchProductos();
  }, [categoria]);

  useEffect(() => { setCurrentPage(1); }, [categoria]);

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
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) return <div className="loading-state">Cargando catálogo...</div>;

  const catLabel = categoria ? categoria.replace(/-/g, ' ') : null;
  const pageTitle = catLabel
    ? `${catLabel.charAt(0).toUpperCase() + catLabel.slice(1)} para cosmética natural | Be Alquimist`
    : 'Insumos de cosmética natural | Be Alquimist';
  const pageDesc = catLabel
    ? `Compra ${catLabel} de alta calidad para formular cosméticos naturales. Envío a todo México. Be Alquimist.`
    : 'Insumos de cosmética natural: aceites, ceras, extractos, conservantes y más. Envío a todo México. Be Alquimist.';
  const pageUrl = `https://bealquimist.com/insumos${categoria ? '/' + categoria : ''}`;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={pageUrl} />
      </Helmet>
      <InsumoPopup />
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
                        to={`/insumos/${toCategoryPath(firstCategory(res.categoria))}/${res.slug}`}
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
                      to={`/insumos/${toCategoryPath(firstCategory(res.categoria))}/${res.slug}`}
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
            <p>🚚 Envío gratuito en compras mayores a <strong>$1,999 MXN</strong></p>
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
            {productos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((prod) => {
              const { stars, reviews } = pseudoRating(prod.slug);
              return (
                <div key={prod.id} className="producto-card">
                  <Link to={`/insumos/${toCategoryPath(firstCategory(prod.categoria))}/${prod.slug}`} className="card-link-wrapper">
                    <div className="prod-img-wrap">
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        loading="lazy"
                        onLoad={(e) => e.currentTarget.classList.add('img-loaded')}
                      />
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

          {Math.ceil(productos.length / ITEMS_PER_PAGE) > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
              >
                ← Anterior
              </button>
              <div className="pagination-pages">
                {(() => {
                  const total = Math.ceil(productos.length / ITEMS_PER_PAGE);
                  const pages = [];
                  for (let i = 1; i <= total; i++) {
                    if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
                      pages.push(i);
                    } else if (pages[pages.length - 1] !== '...') {
                      pages.push('...');
                    }
                  }
                  return pages.map((page, idx) =>
                    page === '...'
                      ? <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                      : (
                        <button
                          key={page}
                          className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                          onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          {page}
                        </button>
                      )
                  );
                })()}
              </div>
              <button
                className="pagination-btn"
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === Math.ceil(productos.length / ITEMS_PER_PAGE)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Insumos;