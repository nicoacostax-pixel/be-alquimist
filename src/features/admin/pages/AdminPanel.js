import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const emptyVariante = { nombre: '', precio: '', peso: '' };
const generateSlug = t => t.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-').replace(/[^\w-]+/g,'');

async function callAdmin(action, extra = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: session?.access_token, ...extra }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error');
  return json;
}

/* ── DASHBOARD ──────────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Queries directas al cliente anon (sin necesitar service role)
        const [
          { count: totalUsers },
          { count: proUsers },
          { count: totalPosts },
          { count: recetasPosts },
          { count: totalProductos },
          { count: totalComentarios },
        ] = await Promise.all([
          supabase.from('perfiles').select('*', { count: 'exact', head: true }),
          supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('es_pro', true),
          supabase.from('posts').select('*', { count: 'exact', head: true }),
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('categoria', 'Recetas'),
          supabase.from('productos').select('*', { count: 'exact', head: true }),
          supabase.from('post_comentarios').select('*', { count: 'exact', head: true }),
        ]);
        const hace7dias = new Date(Date.now() - 7*24*60*60*1000).toISOString();
        const [{ count: recentUsers }, { count: recentPosts }] = await Promise.all([
          supabase.from('perfiles').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
          supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', hace7dias),
        ]);
        setStats({ totalUsers, proUsers, totalPosts, recetasPosts, totalProductos, totalComentarios, recentUsers, recentPosts });
      } catch (e) {
        setErr(e.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="adm-loading">Cargando estadísticas…</div>;
  if (err)     return <div className="adm-error">Error: {err}</div>;
  if (!stats)  return <div className="adm-error">No se pudieron cargar las estadísticas</div>;

  const cards = [
    { label: 'Usuarios totales',    value: stats.totalUsers,       icon: '👥', color: '#5B8DEF' },
    { label: 'Usuarios PRO',        value: stats.proUsers,         icon: '⭐', color: '#B08968' },
    { label: 'Recetas generadas',   value: stats.recetasPosts,     icon: '🧪', color: '#4CAF50' },
    { label: 'Posts en foro',       value: stats.totalPosts,       icon: '💬', color: '#9C6ADE' },
    { label: 'Productos en tienda', value: stats.totalProductos,   icon: '📦', color: '#E6B800' },
    { label: 'Comentarios',         value: stats.totalComentarios, icon: '🗨️', color: '#26A69A' },
    { label: 'Nuevos usuarios (7d)', value: stats.recentUsers,     icon: '📈', color: '#EF5350' },
    { label: 'Nuevos posts (7d)',    value: stats.recentPosts,     icon: '🔥', color: '#FF7043' },
  ];

  return (
    <div className="adm-stats-grid">
      {cards.map(c => (
        <div key={c.label} className="adm-stat-card" style={{ borderTopColor: c.color }}>
          <span className="adm-stat-icon">{c.icon}</span>
          <div className="adm-stat-value">{c.value ?? '—'}</div>
          <div className="adm-stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── USUARIOS ───────────────────────────────────────────── */
function Usuarios() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const load = useCallback(() => {
    setLoading(true);
    callAdmin('getUsers')
      .then(d => { setUsers(d.users); setLoading(false); })
      .catch(e => { setMsg('Error cargando usuarios: ' + e.message); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    setSaving(true);
    try {
      await callAdmin('updateUser', { userId: editing.id, elementos: editing.elementos, es_pro: editing.es_pro });
      setMsg('Guardado ✓'); setEditing(null); load();
    } catch (e) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const resetPwd = async (email) => {
    if (!window.confirm(`¿Enviar email de restablecimiento a ${email}?`)) return;
    try { await callAdmin('resetPassword', { email }); setMsg('Email enviado ✓'); }
    catch (e) { setMsg('Error: ' + e.message); }
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`¿Eliminar usuario ${email}? Esta acción no se puede deshacer.`)) return;
    try { await callAdmin('deleteUser', { userId: id }); setMsg('Usuario eliminado'); load(); }
    catch (e) { setMsg('Error: ' + e.message); }
  };

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Buscar por email o nombre…" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="adm-count">{filtered.length} usuarios</span>
      </div>
      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Usuario</th><th>Elementos</th><th>PRO</th><th>Registro</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="adm-user-cell">
                      <strong>{u.nombre || '—'}</strong>
                      <span className="adm-email">{u.email}</span>
                    </div>
                  </td>
                  <td><span className="adm-badge">{u.es_pro ? '∞' : u.elementos}</span></td>
                  <td>{u.es_pro ? <span className="adm-pro-tag">PRO</span> : '—'}</td>
                  <td className="adm-date">{new Date(u.created_at).toLocaleDateString('es-MX')}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn-edit" onClick={() => setEditing({ ...u })}>Editar</button>
                      <button className="adm-btn-sec" onClick={() => resetPwd(u.email)}>Reset pwd</button>
                      <button className="adm-btn-del" onClick={() => deleteUser(u.id, u.email)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="adm-modal">
            <h3>Editar usuario</h3>
            <p className="adm-modal-email">{editing.email}</p>
            <label className="adm-label">Elementos</label>
            <input className="adm-input" type="number" value={editing.elementos}
              onChange={e => setEditing(p => ({ ...p, elementos: e.target.value }))} />
            <label className="adm-label" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={editing.es_pro}
                onChange={e => setEditing(p => ({ ...p, es_pro: e.target.checked }))} />
              Alquimista PRO
            </label>
            <div className="adm-modal-btns">
              <button className="adm-btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button className="adm-btn-sec" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PRODUCTOS ──────────────────────────────────────────── */
function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState('');
  const [tab, setTab]             = useState('list');
  const [form, setForm]           = useState({ nombre:'', descripcion:'', categoria:'', imagen_url:'' });
  const [variantes, setVariantes] = useState([{ ...emptyVariante }]);
  const [saving, setSaving]       = useState(false);

  const load = useCallback(() => {
    // Productos no necesita service role — query directa
    supabase.from('productos').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setMsg('Error: ' + error.message);
        else setProductos(data || []);
        setLoading(false);
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try { await callAdmin('deleteProducto', { id }); setMsg('Eliminado ✓'); load(); }
    catch (e) { setMsg('Error: ' + e.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    const cleanV = variantes
      .map(v => ({ nombre: v.nombre.trim(), precio: Number(v.precio), peso: Number(v.peso) }))
      .filter(v => v.nombre && v.precio);
    const { error } = await supabase.from('productos').insert({ ...form, slug: generateSlug(form.nombre), variantes: cleanV });
    if (error) { setMsg('Error: ' + error.message); }
    else { setMsg('Producto guardado ✓'); setForm({ nombre:'', descripcion:'', categoria:'', imagen_url:'' }); setVariantes([{ ...emptyVariante }]); setTab('list'); load(); }
    setSaving(false);
  };

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar">
        <div className="adm-tabs-mini">
          <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>Lista ({productos.length})</button>
          <button className={tab === 'new'  ? 'active' : ''} onClick={() => setTab('new')}>+ Nuevo producto</button>
        </div>
      </div>
      {tab === 'list' && (
        loading ? <div className="adm-loading">Cargando…</div> :
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Variantes</th><th></th></tr></thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td><img src={p.imagen_url} alt={p.nombre} className="adm-product-thumb" /></td>
                  <td><strong>{p.nombre}</strong><br/><span className="adm-email">{p.slug}</span></td>
                  <td>{p.categoria}</td>
                  <td>{p.variantes?.length || 0} variantes</td>
                  <td><button className="adm-btn-del" onClick={() => del(p.id, p.nombre)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === 'new' && (
        <form className="adm-form" onSubmit={handleSubmit}>
          {['nombre','descripcion','categoria','imagen_url'].map(f => (
            <div key={f} className="adm-form-group">
              <label className="adm-label">{f === 'imagen_url' ? 'Imagen (URL)' : f.charAt(0).toUpperCase()+f.slice(1)}</label>
              {f === 'descripcion'
                ? <textarea className="adm-input adm-textarea" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} required />
                : <input className="adm-input" type={f==='imagen_url'?'url':'text'} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} required />
              }
            </div>
          ))}
          <label className="adm-label">Variantes</label>
          {variantes.map((v, i) => (
            <div key={i} className="adm-variante-row">
              <input className="adm-input" placeholder="Nombre" value={v.nombre} onChange={e => setVariantes(p => { const c=[...p]; c[i]={...c[i],nombre:e.target.value}; return c; })} />
              <input className="adm-input" placeholder="Precio" type="number" value={v.precio} onChange={e => setVariantes(p => { const c=[...p]; c[i]={...c[i],precio:e.target.value}; return c; })} />
              <input className="adm-input" placeholder="Peso (g)" type="number" value={v.peso} onChange={e => setVariantes(p => { const c=[...p]; c[i]={...c[i],peso:e.target.value}; return c; })} />
              {variantes.length > 1 && <button type="button" className="adm-btn-del" onClick={() => setVariantes(p => p.filter((_,j)=>j!==i))}>×</button>}
            </div>
          ))}
          <button type="button" className="adm-btn-sec" style={{ marginTop:8 }} onClick={() => setVariantes(p => [...p, { ...emptyVariante }])}>+ Variante</button>
          <button type="submit" className="adm-btn-primary" style={{ marginTop: 16 }} disabled={saving}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
        </form>
      )}
    </div>
  );
}

/* ── PEDIDOS ────────────────────────────────────────────── */
function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin('getPedidos').then(d => { setPedidos(d.pedidos); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusColor = s => ({ succeeded:'#4CAF50', requires_payment_method:'#EF5350', processing:'#E6B800', canceled:'#9E9E9E' }[s] || '#9E9E9E');
  const fmt = (amount, currency) => `$${(amount/100).toFixed(2)} ${(currency||'mxn').toUpperCase()}`;

  return (
    <div className="adm-section">
      {loading ? <div className="adm-loading">Cargando pedidos…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>ID</th><th>Monto</th><th>Estado</th><th>Tipo</th><th>Fecha</th></tr></thead>
            <tbody>
              {pedidos.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', color:'#999', padding:24 }}>Sin pedidos aún</td></tr>}
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td><span className="adm-email">{p.id.slice(-10)}</span></td>
                  <td><strong>{fmt(p.amount, p.currency)}</strong></td>
                  <td><span className="adm-status-dot" style={{ background: statusColor(p.status) }} />{p.status}</td>
                  <td>{p.metadata?.paquete ? `Elementos ×${p.metadata.elementos === '-1' ? '∞ PRO' : p.metadata.elementos}` : 'Tienda'}</td>
                  <td className="adm-date">{new Date(p.created).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── COMUNIDAD ──────────────────────────────────────────── */
function Comunidad() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');

  const load = useCallback(() => {
    supabase.from('posts')
      .select('id, titulo, contenido, categoria, created_at, usuario_id, perfiles(nombre)')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => {
        if (error) setMsg('Error: ' + error.message);
        else setPosts(data || []);
        setLoading(false);
      });
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm('¿Eliminar este post y sus comentarios?')) return;
    try { await callAdmin('deletePost', { id }); setMsg('Post eliminado ✓'); load(); }
    catch (e) { setMsg('Error: ' + e.message); }
  };

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Título</th><th>Autor</th><th>Categoría</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.titulo}</strong><br/><span className="adm-email">{p.contenido?.slice(0,70)}…</span></td>
                  <td>{p.perfiles?.nombre || '—'}</td>
                  <td><span className="adm-badge">{p.categoria}</span></td>
                  <td className="adm-date">{new Date(p.created_at).toLocaleDateString('es-MX')}</td>
                  <td><button className="adm-btn-del" onClick={() => del(p.id)}>Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── MAIN ───────────────────────────────────────────────── */
/* ── BIBLIOTECA ADMIN ───────────────────────────────────────── */
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ data: compressed.split(',')[1], mimeType: 'image/jpeg', previewUrl: compressed });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = { nombre: '', descripcion: '', categoria: 'General' };

function BibliotecaAdmin() {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [err,     setErr]       = useState('');
  const [form,    setForm]      = useState(EMPTY_FORM);
  const [imagen,  setImagen]    = useState(null); // { data, mimeType, previewUrl }
  const [editId,  setEditId]    = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { ingredientes: data } = await callAdmin('getIngredientes');
      setIngredientes(data);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImagen(compressed);
    e.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio'); return; }
    setSaving(true);
    setErr('');
    try {
      if (editId) {
        const ing = ingredientes.find(i => i.id === editId);
        await callAdmin('updateIngrediente', {
          id: editId, ...form,
          imagen: imagen || undefined,
          imagen_url: ing?.imagen_url,
        });
      } else {
        await callAdmin('createIngrediente', { ...form, imagen: imagen || undefined });
      }
      setForm(EMPTY_FORM);
      setImagen(null);
      setEditId(null);
      await cargar();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const handleEdit = (ing) => {
    setEditId(ing.id);
    setForm({ nombre: ing.nombre || '', descripcion: ing.descripcion || '', categoria: ing.categoria || 'General' });
    setImagen(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingrediente?')) return;
    try { await callAdmin('deleteIngrediente', { id }); await cargar(); }
    catch (e) { setErr(e.message); }
  };

  const handleCancel = () => { setEditId(null); setForm(EMPTY_FORM); setImagen(null); setErr(''); };

  return (
    <div>
      {/* FORMULARIO */}
      <div className="adm-card" style={{ marginBottom: 24 }}>
        <h3 className="adm-section-title">{editId ? '✏️ Editar ingrediente' : '➕ Nuevo ingrediente'}</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="adm-input" placeholder="Nombre del ingrediente *"
            value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <input className="adm-input" placeholder="Categoría (ej: Aceite vegetal, Activo, Conservador…)"
            value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          <textarea className="adm-input" placeholder="Descripción, propiedades y usos cosméticos…"
            rows={4} value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />

          {/* Imagen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {imagen ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imagen.previewUrl} alt="preview"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #B08968' }} />
                <button type="button" onClick={() => setImagen(null)}
                  style={{ position: 'absolute', top: -6, right: -6, background: '#B08968', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12 }}>×</button>
              </div>
            ) : (
              <label className="adm-upload-btn">
                📷 {editId ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" hidden onChange={handleImagen} />
              </label>
            )}
          </div>

          {err && <p style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="adm-btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar ingrediente'}
            </button>
            {editId && <button type="button" className="adm-btn-secondary" onClick={handleCancel}>Cancelar</button>}
          </div>
        </form>
      </div>

      {/* LISTA */}
      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ingredientes.length === 0 && <p style={{ color: '#888', fontSize: 14 }}>No hay ingredientes aún.</p>}
          {ingredientes.map(ing => (
            <div key={ing.id} className="adm-card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px' }}>
              {ing.imagen_url && (
                <img src={ing.imagen_url} alt={ing.nombre}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: 14 }}>{ing.nombre}</strong>
                  {ing.categoria && <span style={{ fontSize: 11, background: '#F3EFE8', color: '#B08968', padding: '1px 7px', borderRadius: 10 }}>{ing.categoria}</span>}
                </div>
                <p style={{ fontSize: 12, color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ing.descripcion || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="adm-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleEdit(ing)}>Editar</button>
                <button className="adm-btn-danger"    style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(ing.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'dashboard',  label: '📊 Dashboard' },
  { id: 'usuarios',   label: '👥 Usuarios' },
  { id: 'productos',  label: '📦 Productos' },
  { id: 'pedidos',    label: '🛒 Pedidos' },
  { id: 'comunidad',  label: '💬 Comunidad' },
  { id: 'biblioteca', label: '🌿 Biblioteca' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tab, setTab]     = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }
      if (ADMIN_EMAIL && session.user.email !== ADMIN_EMAIL) { navigate('/'); return; }
      setReady(true);
    });
  }, [navigate]);

  if (!ready) return <div className="adm-loading" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Verificando acceso…</div>;

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-brand">⚗️ Be Alquimist<span>Admin</span></div>
        <nav className="adm-nav">
          {TABS.map(t => (
            <button key={t.id} className={`adm-nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <button className="adm-nav-btn adm-logout" onClick={() => navigate('/')}>← Salir</button>
      </aside>
      <main className="adm-main">
        <header className="adm-header">
          <h1 className="adm-title">{TABS.find(t => t.id === tab)?.label}</h1>
        </header>
        <div className="adm-content">
          {tab === 'dashboard'  && <Dashboard />}
          {tab === 'usuarios'   && <Usuarios />}
          {tab === 'productos'  && <Productos />}
          {tab === 'pedidos'    && <Pedidos />}
          {tab === 'comunidad'  && <Comunidad />}
          {tab === 'biblioteca' && <BibliotecaAdmin />}
        </div>
      </main>
    </div>
  );
}
