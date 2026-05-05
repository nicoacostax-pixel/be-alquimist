import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Menu,
  Search,
  ShoppingCart,
  Star
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useCart } from '../../../shared/context/CartContext';
import CartSidebar from '../../../shared/components/CartSidebar'; 
import '../../../App.css';
import SidebarMenu from '../components/SidebarMenu';

function toCategoryPath(value = '') {
  return value?.toLowerCase().replace(/\s+/g, '-') || '';
}

function firstCategory(categoria = '') {
  return (categoria.split(',')[0] || '').trim();
}

function ProductoDetalle() {
  const { categoria, slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart(); 
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [reseñas, setReseñas] = useState([]);
  const [nuevaReseña, setNuevaReseña] = useState({ comentario: '', calificacion: 5 });
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    async function fetchProducto() {
      setLoading(true);
      const { data } = await supabase.from('productos').select('*').eq('slug', slug).single();
      if (data) {
        setProducto(data);
        setVarianteSeleccionada(data.variantes ? data.variantes[0] : null);
        fetchRelacionados(data.categoria, data.id);
        fetchReseñas(data.id);
        window.scrollTo(0, 0); 
      } else {
        navigate('/insumos');
      }
      setLoading(false);
    }
    fetchProducto();
  }, [slug, navigate]);

  async function fetchRelacionados(cat, currentId) {
    const primaryCat = firstCategory(cat);
    const { data } = await supabase.from('productos').select('*').ilike('categoria', `%${primaryCat}%`).neq('id', currentId).limit(4);
    if (data) setRelacionados(data);
  }

  async function fetchReseñas(productId) {
    const { data } = await supabase.from('reseñas_productos').select('*').eq('producto_id', productId).order('created_at', { ascending: false });
    if (data) setReseñas(data);
  }

  const enviarReseña = async (e) => {
    e.preventDefault();
    setEnviando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Debes iniciar sesión para compartir tu experiencia.");
      setEnviando(false);
      return;
    }
    const nombreReal = user.user_metadata.full_name || user.email.split('@')[0];
    const fotoReal = user.user_metadata.avatar_url || null;
    const { error } = await supabase.from('reseñas_productos').insert([{
      producto_id: producto.id,
      usuario_id: user.id,
      nombre_usuario: nombreReal,
      avatar_url: fotoReal,
      comentario: nuevaReseña.comentario,
      calificacion: nuevaReseña.calificacion
    }]);
    if (!error) {
      setNuevaReseña({ comentario: '', calificacion: 5 });
      fetchReseñas(producto.id);
    } else {
      alert("Error al enviar: " + error.message);
    }
    setEnviando(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        const { data } = await supabase.from('productos').select('nombre, imagen_url, categoria, slug, variantes').ilike('nombre', `%${searchTerm}%`).limit(6);
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

  if (loading) return <div className="loading-state">Destilando la esencia...</div>;
  if (!producto) return null;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <Helmet>
        <title>{`${producto.nombre} | Be Alquimist`}</title>
        <meta name="description" content={`${(producto.descripcion || producto.nombre).slice(0, 155)} — Compra en Be Alquimist, insumos de cosmética natural con envío a México.`} />
        <link rel="canonical" href={`https://bealquimist.com/insumos/${toCategoryPath(firstCategory(producto.categoria))}/${producto.slug}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${producto.nombre} | Be Alquimist`} />
        <meta property="og:description" content={`${(producto.descripcion || producto.nombre).slice(0, 155)}`} />
        <meta property="og:image" content={producto.imagen_url} />
        <meta property="og:url" content={`https://bealquimist.com/insumos/${toCategoryPath(firstCategory(producto.categoria))}/${producto.slug}`} />
        <meta property="og:locale" content="es_MX" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: producto.nombre,
          description: producto.descripcion || producto.nombre,
          image: producto.imagen_url,
          url: `https://bealquimist.com/insumos/${toCategoryPath(firstCategory(producto.categoria))}/${producto.slug}`,
          brand: { '@type': 'Brand', name: 'Be Alquimist' },
          offers: (producto.variantes || []).map(v => ({
            '@type': 'Offer',
            price: v.precio,
            priceCurrency: 'MXN',
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'Be Alquimist' },
          })),
        })}</script>
      </Helmet>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <header className="app-header-premium insumos-header">
        <div className="insumos-mobile-top">
          <button className="header-icon-btn" onClick={toggleSidebar} type="button" aria-label="Abrir menú">
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
                  {searchResults.map((res, index) => (
                    <Link
                      key={index}
                      to={`/insumos/${toCategoryPath(firstCategory(res.categoria))}/${res.slug}`}
                      className="search-result-item"
                      onClick={() => { setShowResults(false); setSearchTerm(''); }}
                    >
                      <img src={res.imagen_url} alt={res.nombre} />
                      <div className="result-info">
                        <p className="result-name">{res.nombre}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
                {searchResults.map((res, index) => (
                  <Link
                    key={index}
                    to={`/insumos/${toCategoryPath(firstCategory(res.categoria))}/${res.slug}`}
                    className="search-result-item"
                    onClick={() => { setShowResults(false); setSearchTerm(''); }}
                  >
                    <img src={res.imagen_url} alt={res.nombre} />
                    <div className="result-info">
                      <p className="result-name">{res.nombre}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="producto-detalle-container">
        <div className="promo-banner-full">
          <div className="promo-banner-inner">
            <p>🚚 Envío gratuito en compras mayores a <strong>$1,999 MXN</strong></p>
          </div>
        </div>

        <nav className="breadcrumb">
          <Link to="/insumos">Insumos</Link> <ChevronRight size={14} /> 
          <Link to={`/insumos/${toCategoryPath(firstCategory(producto.categoria))}`} className="breadcrumb-category capitalize">{firstCategory(producto.categoria)}</Link> <ChevronRight size={14} />
          <span className="current">{producto.nombre}</span>
        </nav>

        <div className="product-main-content">
          <div className="product-image-section">
            <img src={producto.imagen_url} alt={producto.nombre} className="main-product-img" />
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{producto.nombre}</h1>
            <p className="product-price-range">${(varianteSeleccionada?.precio * cantidad || 0).toFixed(2)} MXN</p>
            <div className="product-description"><p>{producto.descripcion}</p></div>
            
            <div className="quick-selection-container">
              <h3 className="quick-selection-title">Selección rápida g/ml</h3>
              <div className="quick-selection-grid">
                {producto.variantes?.map((v, index) => (
                  <button
                    key={index}
                    className={`quick-variant-btn ${varianteSeleccionada?.sku === v.sku ? 'active' : ''}`}
                    onClick={() => { setVarianteSeleccionada(v); setCantidad(1); }}
                  >
                    {v.nombre?.replace(/[^0-9]/g, '') || index + 1}
                  </button>
                ))}
              </div>
              {varianteSeleccionada && (
                <p className="variant-selected-msg">
                  Haz seleccionado {varianteSeleccionada.nombre?.replace(/[^0-9]/g, '') || varianteSeleccionada.nombre} gr/ml
                </p>
              )}
            </div>

            <div className="purchase-controls">
              <div className="quantity-selector">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}><Minus size={18} /></button>
                <span>{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)}><Plus size={18} /></button>
              </div>
              <button 
                className="add-to-cart-premium" 
                onClick={() => {
                  addToCart(producto, varianteSeleccionada, cantidad);
                  setIsCartOpen(true);
                }}
              >
                Añadir al carrito <ShoppingBag size={18} style={{marginLeft: '10px'}} />
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE RESEÑAS REINSTAURADA */}
        <section className="reviews-section-premium">
          <div className="reviews-wrapper-inner">
            <div className="section-header-left">
               <h2 className="app-subtitle-final">Comunidad Alquimista</h2>
               <div className="title-underline-left"></div>
            </div>
            <div className="reviews-container reviews-main-layout">
              <div className="reviews-list-column">
                {reseñas.length > 0 ? reseñas.map((r) => (
                  <div key={r.id} className="review-card-alquimist">
                    <div className="review-avatar-wrapper">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.nombre_usuario} className="avatar-img-final" />
                      ) : (
                        <div className="user-avatar-mini-placeholder">
                          {r.nombre_usuario?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="review-content-wrapper">
                      <div className="review-author-header">
                        <p className="review-author">{r.nombre_usuario}</p>
                        <div className="stars-display">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              fill={i < r.calificacion ? "#B08968" : "none"} 
                              stroke={i < r.calificacion ? "#B08968" : "#ddd"} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{r.comentario}</p>
                    </div>
                  </div>
                )) : (
                  <p className="no-reviews-msg">Aún no hay reseñas. ¡Comparte tu alquimia!</p>
                )}
              </div>
              <aside className="add-review-column">
                <div className="add-review-sticky-box">
                  <h3 className="add-review-title">Deja una reseña</h3>
                  <form onSubmit={enviarReseña}>
                    <div className="rating-selector-premium">
                      {[5,4,3,2,1].map(n => (
                        <React.Fragment key={n}>
                          <input type="radio" id={`star-${n}`} name="rating" value={n} checked={nuevaReseña.calificacion === n} onChange={() => setNuevaReseña({...nuevaReseña, calificacion: n})} style={{ display: 'none' }} />
                          <label htmlFor={`star-${n}`} style={{ fontSize: '24px', color: nuevaReseña.calificacion >= n ? '#B08968' : '#ddd', cursor: 'pointer' }}>★</label>
                        </React.Fragment>
                      ))}
                    </div>
                    <textarea 
                      className="premium-input-field bio-textarea" 
                      placeholder="Deja tu reseña" 
                      value={nuevaReseña.comentario} 
                      onChange={(e) => setNuevaReseña({...nuevaReseña, comentario: e.target.value})} 
                      required 
                    />
                    <button type="submit" className="add-to-cart-premium" disabled={enviando} style={{ width: '100%', marginTop: '15px' }}>
                      {enviando ? 'Publicando...' : 'Publicar Reseña'}
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* SECCIÓN PRODUCTOS RELACIONADOS REINSTAURADA */}
        {relacionados.length > 0 && (
          <section className="relacionados-container-premium">
            <div className="section-header-center">
              <h2 className="app-subtitle-final">Completa tu Alquimia</h2>
              <div className="title-underline"></div>
            </div>
            <div className="relacionados-grid-premium">
              {relacionados.map((item) => (
                <Link key={item.id} to={`/insumos/${toCategoryPath(firstCategory(item.categoria))}/${item.slug}`} className="card-relacionado-premium">
                  <div className="card-img-wrapper"><img src={item.imagen_url} alt={item.nombre} /></div>
                  <div className="card-body-premium">
                    <span className="card-category-tag">{firstCategory(item.categoria)}</span>
                    <h3 className="card-product-title">{item.nombre}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ProductoDetalle;