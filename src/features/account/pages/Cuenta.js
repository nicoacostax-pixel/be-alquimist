import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  ChevronRight 
} from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import SidebarMenu from '../../catalog/components/SidebarMenu'; 
import CartSidebar from '../../../shared/components/CartSidebar';
import { useCart } from '../../../shared/context/CartContext';
import '../../../App.css';

// Utilidad para rutas de búsqueda
function toCategoryPath(value = '') {
  return value?.toLowerCase().replace(/\s+/g, '-') || '';
}

function Cuenta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  
  // Estados para búsqueda del Header
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const DEFAULT_AVATAR = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  
  const [profile, setProfile] = useState({
    nombre: '',
    apellido: '',
    bio: '',
    avatar_url: ''
  });

  const [dbValues, setDbValues] = useState({
    nombre: '',
    apellido: '',
    bio: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    getProfile();
  }, []);

  // Lógica de búsqueda (Live Search)
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

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data } = await supabase
        .from('perfiles')
        .select('nombre, apellido, bio, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data) {
        const savedData = {
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        };
        setDbValues(savedData);
        setProfile({ ...profile, avatar_url: savedData.avatar_url });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    try {
      setUpdating(true);
      const { data: { session } } = await supabase.auth.getSession();

      const updates = {
        id: session.user.id,
        nombre: profile.nombre.trim() !== '' ? profile.nombre : dbValues.nombre,
        apellido: profile.apellido.trim() !== '' ? profile.apellido : dbValues.apellido,
        bio: profile.bio.trim() !== '' ? profile.bio : dbValues.bio,
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('perfiles').upsert(updates);
      if (error) throw error;
      
      setDbValues(updates);
      setProfile({ nombre: '', apellido: '', bio: '', avatar_url: updates.avatar_url });
      alert('¡Perfil actualizado!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUpdating(false);
    }
  }

  const handleAvatarUpload = async (e) => {
    try {
      setUpdating(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile({ ...profile, avatar_url: publicUrl });
    } catch (error) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-state">Conectando...</div>;

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* --- HEADER PREMIUM COMPLETO --- */}
      <header className="app-header-premium insumos-header">
        {/* PARTE MÓVIL (Faltaba en tu código) */}
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

        {/* PARTE DESKTOP */}
        <div className="insumos-desktop-top">
          <div className="insumos-left-group">
            <button className="header-icon-btn" onClick={toggleSidebar} type="button" aria-label="Abrir menú">
              <Menu size={22} color="#B08968" />
            </button>
            <Link to="/" style={{ textDecoration: 'none' }}>
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
                      to={`/insumos/${toCategoryPath(res.categoria)}/${res.slug}`}
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

        {/* BUSCADOR MÓVIL (Faltaba en tu código) */}
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
                    to={`/insumos/${toCategoryPath(res.categoria)}/${res.slug}`}
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
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* --- CONTENIDO --- */}
      <main className="cuenta-main-content" style={{ flex: 1, paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '550px', margin: '0 auto', padding: '0 15px', boxSizing: 'border-box' }}>
          
          <nav className="breadcrumb" style={{ marginBottom: '20px' }}>
            <Link to="/">Inicio</Link>
            <ChevronRight size={14} />
            <span className="current">Mi Perfil</span>
          </nav>

          <div className="account-card-responsive">
            <div className="center-text">
              <p className="app-subtitle-final" style={{ fontSize: '28px', color: '#4A3F35' }}>Mi Perfil</p>
            </div>

            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={profile.avatar_url || DEFAULT_AVATAR} alt="Avatar" />
                <label htmlFor="avatar-input" className="avatar-edit-btn">
                  +
                  <input type="file" id="avatar-input" hidden onChange={handleAvatarUpload} accept="image/*" />
                </label>
              </div>
            </div>

            <form onSubmit={updateProfile} className="login-form">
              <div className="form-row-responsive">
                <div className="input-group-premium">
                  <label className="premium-label">Nombre</label>
                  <input 
                    className="premium-input-field" 
                    value={profile.nombre} 
                    placeholder={dbValues.nombre || "Tu nombre"}
                    onChange={(e) => setProfile({...profile, nombre: e.target.value})}
                  />
                </div>
                <div className="input-group-premium">
                  <label className="premium-label">Apellido</label>
                  <input 
                    className="premium-input-field" 
                    value={profile.apellido} 
                    placeholder={dbValues.apellido || "Tu apellido"}
                    onChange={(e) => setProfile({...profile, apellido: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-group-premium">
                <label className="premium-label">Tu historia alquimista...</label>
                <textarea 
                  className="premium-input-field bio-textarea" 
                  value={profile.bio} 
                  placeholder={dbValues.bio || ""}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                />
              </div>

              <button type="submit" className="premium-submit-btn" disabled={updating}>
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>

            <button 
              onClick={() => supabase.auth.signOut().then(() => navigate('/login'))} 
              className="logout-link-btn"
              style={{ marginTop: '20px' }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Cuenta;