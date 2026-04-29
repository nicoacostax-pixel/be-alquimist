import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, ChevronRight } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useElementos } from '../../../shared/context/ElementosContext';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import CartSidebar from '../../../shared/components/CartSidebar';
import { useCart } from '../../../shared/context/CartContext';
import '../../../App.css';

function toCategoryPath(value = '') {
  return value?.toLowerCase().replace(/\s+/g, '-') || '';
}

const DEFAULT_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

async function callCuenta(action, extra = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Sin sesión');
  const res = await fetch('/api/cuenta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...extra }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
  return json;
}

function fmtMonto(amount, currency) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: (currency || 'mxn').toUpperCase(),
  }).format(amount / 100);
}

function fmtFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── SECCIÓN PERFIL ────────────────────────────────────────────────────────────
function PerfilSection({ userId }) {
  const [profile, setProfile] = useState({ nombre: '', apellido: '', bio: '', avatar_url: '' });
  const [dbValues, setDbValues] = useState({ nombre: '', apellido: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!userId) return;
    supabase.from('perfiles').select('nombre, apellido, bio, avatar_url').eq('id', userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDbValues({ nombre: data.nombre || '', apellido: data.apellido || '', bio: data.bio || '' });
          setProfile(p => ({ ...p, avatar_url: data.avatar_url || '' }));
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const filePath = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
    } catch (err) {
      setMsg('Error subiendo imagen: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const updates = {
        id: userId,
        nombre:    profile.nombre.trim()   || dbValues.nombre,
        apellido:  profile.apellido.trim() || dbValues.apellido,
        bio:       profile.bio.trim()      || dbValues.bio,
        avatar_url: profile.avatar_url,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('perfiles').upsert(updates);
      if (error) throw error;
      setDbValues(updates);
      setProfile({ nombre: '', apellido: '', bio: '', avatar_url: updates.avatar_url });
      setMsg('¡Perfil actualizado!');
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="cuenta-loading">Cargando perfil…</p>;

  return (
    <div className="cuenta-section">
      <div className="avatar-section">
        <div className="avatar-wrapper">
          <img src={profile.avatar_url || DEFAULT_AVATAR} alt="Avatar" />
          <label htmlFor="avatar-input" className="avatar-edit-btn">
            +
            <input type="file" id="avatar-input" hidden onChange={handleAvatarUpload} accept="image/*" />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave} className="login-form">
        <div className="form-row-responsive">
          <div className="input-group-premium">
            <label className="premium-label">Nombre</label>
            <input className="premium-input-field" value={profile.nombre}
              placeholder={dbValues.nombre || 'Tu nombre'}
              onChange={e => setProfile(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="input-group-premium">
            <label className="premium-label">Apellido</label>
            <input className="premium-input-field" value={profile.apellido}
              placeholder={dbValues.apellido || 'Tu apellido'}
              onChange={e => setProfile(p => ({ ...p, apellido: e.target.value }))} />
          </div>
        </div>
        <div className="input-group-premium">
          <label className="premium-label">Tu historia alquimista…</label>
          <textarea className="premium-input-field bio-textarea" value={profile.bio}
            placeholder={dbValues.bio || ''}
            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
        </div>
        {msg && <p className={msg.startsWith('Error') ? 'cuenta-error' : 'cuenta-success'}>{msg}</p>}
        <button type="submit" className="premium-submit-btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}

// ── SECCIÓN PEDIDOS ───────────────────────────────────────────────────────────
function PedidosSection() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    callCuenta('getPedidos')
      .then(d => setPedidos(d.pedidos || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="cuenta-loading">Cargando pedidos…</p>;
  if (error)   return <p className="cuenta-error">{error}</p>;
  if (pedidos.length === 0) return (
    <div className="cuenta-empty">
      <span className="cuenta-empty-icon">🧪</span>
      <p>Aún no tienes pedidos.</p>
      <Link to="/insumos" className="premium-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
        Ver tienda
      </Link>
    </div>
  );

  return (
    <div className="cuenta-section">
      <div className="pedidos-list">
        {pedidos.map(p => (
          <div key={p.id} className="pedido-row">
            <div className="pedido-info">
              <span className="pedido-desc">{p.descripcion}</span>
              <span className="pedido-fecha">{fmtFecha(p.created)}</span>
            </div>
            <div className="pedido-right">
              <span className="pedido-monto">{fmtMonto(p.amount, p.currency)}</span>
              <span className="pedido-status pedido-status--ok">Completado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SECCIÓN SEGURIDAD ─────────────────────────────────────────────────────────
function SeguridadSection() {
  const [form, setForm] = useState({ nueva: '', confirmar: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (form.nueva.length < 6) { setMsg('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (form.nueva !== form.confirmar) { setMsg('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.nueva });
      if (error) throw error;
      setForm({ nueva: '', confirmar: '' });
      setMsg('¡Contraseña actualizada correctamente!');
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cuenta-section">
      <h3 className="cuenta-section-title">Cambiar contraseña</h3>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group-premium">
          <label className="premium-label">Nueva contraseña</label>
          <input className="premium-input-field" type="password" name="nueva"
            value={form.nueva} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
        </div>
        <div className="input-group-premium">
          <label className="premium-label">Confirmar contraseña</label>
          <input className="premium-input-field" type="password" name="confirmar"
            value={form.confirmar} onChange={handleChange} placeholder="Repite la contraseña" />
        </div>
        {msg && <p className={msg.startsWith('Error') || msg.includes('no coinciden') || msg.includes('menos') ? 'cuenta-error' : 'cuenta-success'}>{msg}</p>}
        <button type="submit" className="premium-submit-btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}

// ── SECCIÓN PLAN ──────────────────────────────────────────────────────────────
function PlanSection({ userId, esPro }) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [cancelDate, setCancelDate] = useState('');
  const [msg, setMsg] = useState('');

  const handlePortal = async () => {
    setPortalLoading(true);
    setMsg('');
    try {
      const { url } = await callCuenta('getPortalUrl');
      window.location.href = url;
    } catch (err) {
      setMsg('Error al abrir el portal: ' + err.message);
      setPortalLoading(false);
    }
  };

  const handleCancelarPro = async () => {
    if (!window.confirm('¿Segura que quieres cancelar tu plan PRO? Seguirás con PRO hasta el fin del período actual.')) return;
    setCancelando(true);
    setMsg('');
    try {
      const { cancelDate: fecha } = await callCuenta('cancelSuscripcion');
      setCancelDate(fecha || '');
      setMsg(fecha
        ? `Suscripción cancelada. Conservas el acceso PRO hasta el ${fecha}.`
        : 'Suscripción cancelada correctamente.');
    } catch (err) {
      setMsg('Error: ' + err.message);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div className="cuenta-section">
      <div className="plan-status-card">
        {esPro ? (
          <>
            <span className="plan-badge plan-badge--pro">⚗️ Alquimista PRO</span>
            <p className="plan-desc">Tienes acceso ilimitado a todas las funciones de Be Alquimist, incluyendo la calculadora de costos y elementos ilimitados.</p>
          </>
        ) : (
          <>
            <span className="plan-badge plan-badge--free">Plan Gratuito</span>
            <p className="plan-desc">Estás en el plan gratuito. Obtén elementos ilimitados y la calculadora de costos con el plan PRO.</p>
            <Link to="/pro" className="premium-submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
              Ver planes PRO
            </Link>
          </>
        )}
      </div>

      <div className="plan-actions">
        <h3 className="cuenta-section-title" style={{ marginTop: '28px' }}>Métodos de pago</h3>
        <p className="plan-desc" style={{ marginBottom: '12px' }}>Administra tus tarjetas y ve el historial de pagos desde el portal de Stripe.</p>
        <button className="premium-submit-btn" onClick={handlePortal} disabled={portalLoading} style={{ background: '#635BFF' }}>
          {portalLoading ? 'Abriendo portal…' : '💳 Administra tus pagos'}
        </button>

        {esPro && (
          <>
            <h3 className="cuenta-section-title" style={{ marginTop: '28px', color: '#c0392b' }}>Cancelar suscripción</h3>
            <p className="plan-desc" style={{ marginBottom: '12px' }}>Al cancelar perderás acceso a las funciones PRO. Esta acción no genera reembolso automático.</p>
            <button className="cuenta-cancel-btn" onClick={handleCancelarPro} disabled={cancelando}>
              {cancelando ? 'Cancelando…' : 'Cancelar plan PRO'}
            </button>
          </>
        )}
      </div>

      {msg && <p className={msg.startsWith('Error') ? 'cuenta-error' : 'cuenta-success'} style={{ marginTop: '16px' }}>{msg}</p>}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
function Cuenta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [tab, setTab] = useState('Perfil');
  const { cartCount } = useCart();
  const { esPro } = useElementos();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }
      setUserId(session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        const { data } = await supabase.from('productos')
          .select('nombre, imagen_url, categoria, slug').ilike('nombre', `%${searchTerm}%`).limit(6);
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
    const fn = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  if (loading) return <div className="loading-state">Conectando…</div>;

  const TABS = ['Perfil', 'Pedidos', 'Seguridad', 'Plan'];

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <header className="app-header-premium insumos-header">
        <div className="insumos-mobile-top">
          <button className="header-icon-btn" onClick={() => setIsSidebarOpen(v => !v)} type="button">
            <Menu size={22} color="#B08968" />
          </button>
          <Link to="/" className="logo-link"><div className="app-logo-small">Be Alquimist</div></Link>
          <div className="cart-icon-wrapper">
            <button type="button" className="header-icon-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={23} color="#4A3F35" />
            </button>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
        </div>

        <div className="insumos-desktop-top">
          <div className="insumos-left-group">
            <button className="header-icon-btn" onClick={() => setIsSidebarOpen(v => !v)} type="button">
              <Menu size={22} color="#B08968" />
            </button>
            <Link to="/" style={{ textDecoration: 'none' }}><div className="app-logo-small">Be Alquimist</div></Link>
          </div>
          <div className="header-search-row insumos-search-wrap" ref={searchRef}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Buscar insumo…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="search-input-premium"
                onFocus={() => searchTerm.length > 2 && setShowResults(true)} />
              {showResults && (
                <div className="live-search-results">
                  {searchResults.map((r, i) => (
                    <Link key={i} to={`/insumos/${toCategoryPath(r.categoria)}/${r.slug}`}
                      className="search-result-item" onClick={() => { setShowResults(false); setSearchTerm(''); }}>
                      <img src={r.imagen_url} alt={r.nombre} />
                      <div className="result-info"><p className="result-name">{r.nombre}</p></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="header-top-row insumos-actions-wrap">
            <div className="cart-icon-wrapper">
              <button type="button" className="header-icon-btn" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart size={24} color="#4A3F35" />
              </button>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </div>
        </div>

        <div className="header-search-row insumos-search-wrap insumos-mobile-search" ref={searchRef}>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Buscar insumo…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="search-input-premium"
              onFocus={() => searchTerm.length > 2 && setShowResults(true)} />
            {showResults && (
              <div className="live-search-results">
                {searchResults.map((r, i) => (
                  <Link key={i} to={`/insumos/${toCategoryPath(r.categoria)}/${r.slug}`}
                    className="search-result-item" onClick={() => { setShowResults(false); setSearchTerm(''); }}>
                    <img src={r.imagen_url} alt={r.nombre} />
                    <div className="result-info"><p className="result-name">{r.nombre}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="cuenta-main-content" style={{ flex: 1, paddingTop: '40px' }}>
        <div style={{ width: '100%', maxWidth: '580px', margin: '0 auto', padding: '0 15px', boxSizing: 'border-box' }}>

          <nav className="breadcrumb" style={{ marginBottom: '20px' }}>
            <Link to="/">Inicio</Link>
            <ChevronRight size={14} />
            <span className="current">Mi Cuenta</span>
          </nav>

          <div className="account-card-responsive">
            <div className="center-text" style={{ marginBottom: '8px' }}>
              <p className="app-subtitle-final" style={{ fontSize: '26px', color: '#4A3F35' }}>Mi Cuenta</p>
            </div>

            {/* TABS */}
            <div className="cuenta-tabs">
              {TABS.map(t => (
                <button key={t} className={`cuenta-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            {tab === 'Perfil'   && <PerfilSection userId={userId} />}
            {tab === 'Pedidos'  && <PedidosSection />}
            {tab === 'Seguridad'&& <SeguridadSection />}
            {tab === 'Plan'     && <PlanSection userId={userId} esPro={esPro} />}
          </div>

          <button
            onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
            className="logout-link-btn"
            style={{ margin: '24px auto', display: 'block' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}

export default Cuenta;
