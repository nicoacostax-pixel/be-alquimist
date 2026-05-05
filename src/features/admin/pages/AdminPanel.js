import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import '../../../App.css';

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;
const emptyVariante = { nombre: '', precio: '', peso: '' };

function buildWARecetaMsg(receta) {
  const texto = receta.contenido || '';

  // Extraer sección Fórmula
  const formulaMatch = texto.match(/## Fórmula[^\n]*\n([\s\S]*?)(?=\n## |$)/i);
  // Extraer sección Dónde comprar
  const compraMatch  = texto.match(/## Dónde comprar[^\n]*\n([\s\S]*?)(?=\n## |$)/i);

  let msg = `🌿 *Receta: ${receta.nombre || 'Tu receta'}*\n\n`;

  if (formulaMatch) {
    msg += '📋 *Ingredientes:*\n';
    formulaMatch[1].split('\n').forEach(line => {
      const m = line.match(/[-*]\s*\*{0,2}([^:*\n]+)\*{0,2}\s*[:\-–]\s*(\d[\d.,]*\s*%)/);
      if (m) msg += `• ${m[1].trim()} — ${m[2].trim()}\n`;
    });
    msg += '\n';
  }

  if (compraMatch) {
    msg += '🛒 *Dónde comprar en Be Alquimist:*\n';
    compraMatch[1].split('\n').forEach(line => {
      const clean = line.replace(/\*\*/g, '').replace(/^[-*]\s*/, '').trim();
      if (clean) msg += `• ${clean}\n`;
    });
    msg += '\n';
  }

  msg += '_Formulado con Be Alquimist IA_ ⚗️\nhttps://bealquimist.com';
  return msg;
}

function waRecetaUrl(receta) {
  // Normalizar teléfono: quitar todo excepto dígitos, agregar 52 si empieza con 10 dígitos
  let tel = (receta.telefono || '').replace(/\D/g, '');
  if (tel.length === 10) tel = '52' + tel;
  if (!tel) return null;
  return `https://wa.me/${tel}?text=${encodeURIComponent(buildWARecetaMsg(receta))}`;
}

const CATEGORIAS = [
  'Aceites','Aceites Esenciales','Aditamentos','Hidrolatos y Aguas florales',
  'Aromas','Antioxidantes','Bases de Jabón','Ceras y mantecas','Conservantes',
  'Colorantes','Emulsionantes','Extractos y Activos','Hierbas secas','Tensioactivos','Polvos',
];
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
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [tab,       setTab]       = useState('list');
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState({ nombre:'', descripcion:'', categoria:'', imagen_url:'' });
  const [variantes, setVariantes] = useState([{ ...emptyVariante }]);
  const [imagen,    setImagen]    = useState(null); // { data, mimeType, previewUrl }
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');
  const [catFiltro, setCatFiltro] = useState('');

  const load = useCallback(() => {
    supabase.from('productos').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setMsg('Error: ' + error.message);
        else setProductos(data || []);
        setLoading(false);
      });
  }, []);

  const filtrados = useMemo(() => productos.filter(p => {
    const matchSearch = !search || p.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFiltro || (p.categoria || '').split(',').map(c => c.trim()).includes(catFiltro);
    return matchSearch && matchCat;
  }), [productos, search, catFiltro]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ nombre:'', descripcion:'', categoria:'', imagen_url:'' });
    setVariantes([{ ...emptyVariante }]);
    setImagen(null);
    setEditId(null);
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre || '', descripcion: p.descripcion || '', categoria: p.categoria || '', imagen_url: p.imagen_url || '' });
    setVariantes(p.variantes?.length ? p.variantes.map(v => ({ nombre: v.nombre||'', precio: v.precio||'', peso: v.peso||'' })) : [{ ...emptyVariante }]);
    setImagen(null);
    setTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImagen(compressed);
    e.target.value = '';
  };

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
    try {
      if (editId) {
        await callAdmin('updateProducto', {
          id: editId, ...form, slug: generateSlug(form.nombre),
          variantes: cleanV,
          imagen: imagen || undefined,
        });
        setMsg('Producto actualizado ✓');
      } else {
        const { error } = await supabase.from('productos').insert({ ...form, slug: generateSlug(form.nombre), variantes: cleanV });
        if (error) throw new Error(error.message);
        setMsg('Producto guardado ✓');
      }
      resetForm(); setTab('list'); load();
    } catch (err) { setMsg('Error: ' + err.message); }
    setSaving(false);
  };

  const varSet = (i, field, val) => setVariantes(p => { const c=[...p]; c[i]={...c[i],[field]:val}; return c; });

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar" style={{ flexWrap:'wrap', gap:8 }}>
        <div className="adm-tabs-mini">
          <button className={tab === 'list' ? 'active' : ''} onClick={() => { resetForm(); setTab('list'); }}>
            Lista ({filtrados.length}/{productos.length})
          </button>
          <button className={tab === 'form' && !editId ? 'active' : ''} onClick={() => { resetForm(); setTab('form'); }}>
            + Nuevo producto
          </button>
        </div>
        {tab === 'list' && (
          <>
            <input
              className="adm-search"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth:160 }}
            />
            <select
              className="adm-input"
              value={catFiltro}
              onChange={e => setCatFiltro(e.target.value)}
              style={{ minWidth:140, padding:'6px 10px', fontSize:13 }}
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
        {editId && <span style={{ fontSize:13, color:'#B08968', fontWeight:600 }}>✏️ Editando producto</span>}
      </div>

      {tab === 'list' && (
        loading ? <div className="adm-loading">Cargando…</div> :
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Variantes</th><th></th></tr></thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'#999', padding:24 }}>Sin resultados</td></tr>
              )}
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td><img src={p.imagen_url} alt={p.nombre} className="adm-product-thumb" /></td>
                  <td><strong>{p.nombre}</strong><br/><span className="adm-email">{p.slug}</span></td>
                  <td>{p.categoria}</td>
                  <td>
                    {(p.variantes || []).map((v,i) => (
                      <div key={i} style={{ fontSize:12, color:'#666' }}>{v.nombre} — ${v.precio} / {v.peso}g</div>
                    ))}
                  </td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                      <button className="adm-btn-del"  onClick={() => del(p.id, p.nombre)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'form' && (
        <form className="adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-group">
            <label className="adm-label">Nombre</label>
            <input className="adm-input" value={form.nombre} onChange={e => setForm(p=>({...p,nombre:e.target.value}))} required />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Descripción</label>
            <textarea className="adm-input adm-textarea" value={form.descripcion} onChange={e => setForm(p=>({...p,descripcion:e.target.value}))} />
          </div>
          <div className="adm-form-group">
            <label className="adm-label">Categorías</label>
            <div className="adm-cat-grid">
              {CATEGORIAS.map(cat => {
                const sel = (form.categoria || '').split(',').map(c => c.trim()).includes(cat);
                return (
                  <label key={cat} className={`adm-cat-tag${sel ? ' selected' : ''}`}>
                    <input type="checkbox" hidden checked={sel} onChange={() =>
                      setForm(prev => {
                        const cur = prev.categoria ? prev.categoria.split(',').map(c => c.trim()).filter(Boolean) : [];
                        const next = sel ? cur.filter(c => c !== cat) : [...cur, cat];
                        return { ...prev, categoria: next.join(',') };
                      })
                    } />
                    {cat}
                  </label>
                );
              })}
            </div>
            {!form.categoria && <span style={{ fontSize:11, color:'#999' }}>Selecciona al menos una categoría</span>}
          </div>

          {/* Imagen */}
          <div className="adm-form-group">
            <label className="adm-label">Imagen</label>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              {(imagen?.previewUrl || form.imagen_url) && (
                <img src={imagen?.previewUrl || form.imagen_url} alt=""
                  style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border:'2px solid #EDE8E1' }} />
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                <input className="adm-input" type="url" placeholder="URL de imagen"
                  value={imagen ? '' : form.imagen_url}
                  onChange={e => { setImagen(null); setForm(p=>({...p,imagen_url:e.target.value})); }}
                  disabled={!!imagen} />
                <label className="adm-upload-btn" style={{ width:'fit-content' }}>
                  📷 {imagen ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/*" hidden onChange={handleImagen} />
                </label>
                {imagen && (
                  <button type="button" className="adm-btn-sec" style={{ fontSize:12, padding:'4px 10px', width:'fit-content' }}
                    onClick={() => setImagen(null)}>
                    Usar URL en su lugar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Variantes */}
          <label className="adm-label">Variantes</label>
          {variantes.map((v, i) => (
            <div key={i} className="adm-variante-row">
              <input className="adm-input" placeholder="Nombre (ej: 250g)" value={v.nombre}
                onChange={e => varSet(i,'nombre',e.target.value)} />
              <input className="adm-input" placeholder="Precio (MXN)" type="number" value={v.precio}
                onChange={e => varSet(i,'precio',e.target.value)} />
              <input className="adm-input" placeholder="Peso (g)" type="number" value={v.peso}
                onChange={e => varSet(i,'peso',e.target.value)} />
              {variantes.length > 1 &&
                <button type="button" className="adm-btn-del" onClick={() => setVariantes(p=>p.filter((_,j)=>j!==i))}>×</button>}
            </div>
          ))}
          <button type="button" className="adm-btn-sec" style={{ marginTop:8 }}
            onClick={() => setVariantes(p=>[...p,{...emptyVariante}])}>+ Variante</button>

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button type="submit" className="adm-btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button type="button" className="adm-btn-sec" onClick={() => { resetForm(); setTab('list'); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── PEDIDOS ────────────────────────────────────────────── */
const ESTADOS_ENVIO = [
  { value: 'procesando', label: 'Procesando', color: '#EF5350', bg: '#FFEBEE' },
  { value: 'enviado',    label: 'Enviado',    color: '#E6A800', bg: '#FFF8E1' },
  { value: 'completado', label: 'Completado', color: '#43A047', bg: '#E8F5E9' },
];

function Pedidos() {
  const [pedidos,  setPedidos]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [msg,      setMsg]      = useState('');

  const load = useCallback(() => {
    setLoading(true);
    callAdmin('getPedidos')
      .then(d => { setPedidos(d.pedidos || []); setLoading(false); })
      .catch(e => { setMsg('Error: ' + e.message); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setUpdating(pedidoId);
    try {
      await callAdmin('updatePedidoEstado', { id: pedidoId, estado: nuevoEstado });
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
    } catch (e) { setMsg('Error: ' + e.message); }
    setUpdating(null);
  };

  const pagoColor = s => ({ succeeded:'#43A047', requires_payment_method:'#EF5350', processing:'#E6A800', canceled:'#9E9E9E' }[s] || '#9E9E9E');
  const fmt = (amount, currency) => `$${(amount/100).toFixed(2)} ${(currency||'mxn').toUpperCase()}`;

  const soloTienda = pedidos.filter(p => !p.metadata?.paquete);

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      {loading ? <div className="adm-loading">Cargando pedidos…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Monto</th>
                <th>Pago</th>
                <th>Envío</th>
                <th>Tipo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#999', padding:24 }}>Sin pedidos aún</td></tr>
              )}
              {pedidos.map(p => {
                const estadoEnvio = ESTADOS_ENVIO.find(e => e.value === (p.estado || 'procesando')) || ESTADOS_ENVIO[0];
                const esTienda = !p.metadata?.paquete;
                return (
                  <tr key={p.id}>
                    <td><span className="adm-email">{p.id.slice(-10)}</span></td>
                    <td><span className="adm-email">{p.email || '—'}</span></td>
                    <td><strong>{fmt(p.amount, p.currency)}</strong></td>
                    <td>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background: pagoColor(p.status), display:'inline-block' }} />
                        {p.status === 'succeeded' ? 'Pagado' : p.status}
                      </span>
                    </td>
                    <td>
                      {esTienda ? (
                        <div style={{ display:'flex', gap:4 }}>
                          {ESTADOS_ENVIO.map(e => (
                            <button
                              key={e.value}
                              onClick={() => cambiarEstado(p.id, e.value)}
                              disabled={updating === p.id}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                border: 'none',
                                borderRadius: 20,
                                cursor: updating === p.id ? 'wait' : 'pointer',
                                fontFamily: 'inherit',
                                background: p.estado === e.value ? e.color : '#F0EBE5',
                                color:      p.estado === e.value ? '#fff'   : '#999',
                                transition: 'all .15s',
                              }}
                            >
                              {e.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize:12, color:'#aaa' }}>N/A</span>
                      )}
                    </td>
                    <td>{p.metadata?.paquete ? `Elementos ×${p.metadata.elementos === '-1' ? '∞ PRO' : p.metadata.elementos}` : 'Tienda'}</td>
                    <td className="adm-date">{new Date(p.created).toLocaleDateString('es-MX')}</td>
                  </tr>
                );
              })}
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
      .select('id, titulo, contenido, categoria, created_at, usuario_id')
      .order('created_at', { ascending: false }).limit(50)
      .then(async ({ data, error }) => {
        if (error) { setMsg('Error: ' + error.message); setLoading(false); return; }
        const posts = data || [];
        // Fetch author names separately
        const ids = [...new Set(posts.map(p => p.usuario_id).filter(Boolean))];
        let nombresMap = {};
        if (ids.length > 0) {
          const { data: perfiles } = await supabase.from('perfiles').select('id, nombre').in('id', ids);
          (perfiles || []).forEach(p => { nombresMap[p.id] = p.nombre; });
        }
        setPosts(posts.map(p => ({ ...p, autor: nombresMap[p.usuario_id] || '—' })));
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
                  <td>{p.autor || '—'}</td>
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

const EMPTY_FORM  = { nombre: '', categoria: 'General' };
const EMPTY_BLOCK = { type: 'text', content: '' };

function parseBlocks(desc) {
  if (!desc) return [{ ...EMPTY_BLOCK }];
  try {
    const parsed = JSON.parse(desc);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return [{ type: 'text', content: desc }]; // compatibilidad con texto plano
}

function isHeaderLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && /[A-ZÁÉÍÓÚÑ]/.test(trimmed)) return true;
  if (
    trimmed.length <= 60 &&
    !trimmed.endsWith('.') &&
    !trimmed.includes(':') &&
    !trimmed.startsWith('•') &&
    !trimmed.startsWith('-') &&
    !/^\d+\./.test(trimmed)
  ) return true;
  return false;
}

function parseTextToBlocks(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    result.push({ type: 'text', content: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    if (isHeaderLine(line)) {
      flushBuffer();
      result.push({ type: 'h1', content: line });
    } else {
      buffer.push(line);
    }
  }
  flushBuffer();
  return result.length > 0 ? result : [{ type: 'text', content: text }];
}

function BlockEditor({ blocks, onChange }) {
  const update = (i, field, value) => {
    const next = blocks.map((b, idx) => idx === i ? { ...b, [field]: value } : b);
    onChange(next);
  };
  const add    = (type) => onChange([...blocks, { type, content: '' }]);
  const remove = (i)    => onChange(blocks.filter((_, idx) => idx !== i));
  const move   = (i, dir) => {
    const next = [...blocks];
    const to   = i + dir;
    if (to < 0 || to >= next.length) return;
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };

  const handlePaste = (e, i) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text.includes('\n')) return; // single line — let default paste happen
    e.preventDefault();
    const parsed = parseTextToBlocks(text);
    const before = blocks.slice(0, i);
    const after  = blocks.slice(i + 1);
    const merged = [
      ...before,
      ...parsed,
      ...after,
    ].filter(b => b.content.trim() || after.length === 0);
    onChange(merged.length > 0 ? merged : [{ type: 'text', content: '' }]);
  };

  return (
    <div className="block-editor">
      {blocks.map((block, i) => (
        <div key={i} className={`block-row block-row--${block.type}`}>
          {/* Tipo */}
          <select
            className="block-type-select"
            value={block.type}
            onChange={e => update(i, 'type', e.target.value)}
          >
            <option value="h1">H1 — Título</option>
            <option value="text">Texto</option>
            <option value="image">Imagen (URL)</option>
          </select>

          {/* Contenido */}
          {block.type === 'h1' ? (
            <input
              className="block-input block-input--h1"
              placeholder="Título de sección…"
              value={block.content}
              onChange={e => update(i, 'content', e.target.value)}
              onPaste={e => handlePaste(e, i)}
            />
          ) : block.type === 'image' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                className="block-input block-input--h1"
                placeholder="URL de la imagen…"
                value={block.content}
                onChange={e => update(i, 'content', e.target.value)}
              />
              <input
                className="block-input block-input--h1"
                placeholder="Descripción / caption (opcional)"
                value={block.caption || ''}
                onChange={e => update(i, 'caption', e.target.value)}
                style={{ fontSize: 12, color: '#888' }}
              />
              {block.content && (
                <img
                  src={block.content}
                  alt={block.caption || 'preview'}
                  style={{ maxWidth: 220, maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #EDE0D4' }}
                />
              )}
            </div>
          ) : (
            <textarea
              className="block-input block-input--text"
              placeholder="Párrafo de texto… (pega texto largo para auto-detectar títulos)"
              rows={3}
              value={block.content}
              onChange={e => update(i, 'content', e.target.value)}
              onPaste={e => handlePaste(e, i)}
            />
          )}

          {/* Acciones */}
          <div className="block-actions">
            <button type="button" className="block-btn" onClick={() => move(i, -1)} title="Subir">↑</button>
            <button type="button" className="block-btn" onClick={() => move(i,  1)} title="Bajar">↓</button>
            <button type="button" className="block-btn block-btn--del" onClick={() => remove(i)} title="Eliminar">✕</button>
          </div>
        </div>
      ))}

      <div className="block-add-row">
        <button type="button" className="block-add-btn" onClick={() => add('h1')}>+ Título H1</button>
        <button type="button" className="block-add-btn" onClick={() => add('text')}>+ Texto</button>
        <button type="button" className="block-add-btn" onClick={() => add('image')}>+ Imagen</button>
      </div>
    </div>
  );
}

function BibliotecaAdmin() {
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [blocks,  setBlocks]  = useState([{ ...EMPTY_BLOCK }]);
  const [imagen,  setImagen]  = useState(null);
  const [editId,  setEditId]  = useState(null);

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
    const descripcion = JSON.stringify(blocks.filter(b => b.content.trim()));
    try {
      if (editId) {
        const ing = ingredientes.find(i => i.id === editId);
        await callAdmin('updateIngrediente', {
          id: editId, ...form, descripcion,
          imagen: imagen || undefined,
          imagen_url: ing?.imagen_url,
        });
      } else {
        await callAdmin('createIngrediente', { ...form, descripcion, imagen: imagen || undefined });
      }
      setForm(EMPTY_FORM);
      setBlocks([{ ...EMPTY_BLOCK }]);
      setImagen(null);
      setEditId(null);
      await cargar();
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  const handleEdit = (ing) => {
    setEditId(ing.id);
    setForm({ nombre: ing.nombre || '', categoria: ing.categoria || 'General' });
    setBlocks(parseBlocks(ing.descripcion));
    setImagen(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingrediente?')) return;
    try { await callAdmin('deleteIngrediente', { id }); await cargar(); }
    catch (e) { setErr(e.message); }
  };

  const handleCancel = () => {
    setEditId(null); setForm(EMPTY_FORM);
    setBlocks([{ ...EMPTY_BLOCK }]); setImagen(null); setErr('');
  };

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

          {/* Editor de bloques */}
          <div>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px' }}>Contenido (bloques)</p>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>

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

/* ── CONTACTOS ──────────────────────────────────────────────── */
function exportCSV(users) {
  const header = ['Nombre', 'Email', 'PRO', 'Elementos', 'Registro'];
  const rows = users.map(u => [
    u.nombre || '',
    u.email || '',
    u.es_pro ? 'Sí' : 'No',
    u.es_pro ? '∞' : (u.elementos ?? ''),
    u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'contactos_bealquimist.csv'; a.click();
  URL.revokeObjectURL(url);
}

function Contactos() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    callAdmin('getUsers')
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(e => { setMsg('Error: ' + e.message); setLoading(false); });
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar">
        <input
          className="adm-search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="adm-count">{filtered.length} de {users.length} contactos</span>
        <button
          className="adm-btn-sec"
          style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
          onClick={() => exportCSV(filtered)}
          disabled={loading || filtered.length === 0}
        >
          ⬇ Exportar CSV
        </button>
      </div>
      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>PRO</th><th>Elementos</th><th>Registro</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: 24 }}>Sin resultados</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.nombre || '—'}</strong></td>
                  <td><span className="adm-email">{u.email}</span></td>
                  <td>{u.es_pro ? <span className="adm-pro-tag">PRO</span> : '—'}</td>
                  <td><span className="adm-badge">{u.es_pro ? '∞' : u.elementos}</span></td>
                  <td className="adm-date">{u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── LEADS ──────────────────────────────────────────────────── */
const TIPO_LABELS = {
  'usuario_nuevo':   '🙋 Usuario nuevo',
  'aceite_de_regalo':'🎁 Aceite de regalo',
};

function Leads() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro,  setFiltro]  = useState('todos');
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    callAdmin('getLeads')
      .then(d => { setLeads(d.leads); setLoading(false); })
      .catch(e => { setMsg('Error: ' + e.message); setLoading(false); });
  }, []);

  const filtrados = filtro === 'todos' ? leads : leads.filter(l => l.tipo === filtro);
  const tiposExtra = useMemo(() => {
    const enDatos = new Set(leads.map(l => l.tipo).filter(Boolean));
    const predefinidos = Object.keys(TIPO_LABELS);
    return [...new Set([...predefinidos, ...enDatos])];
  }, [leads]);

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar">
        <div className="adm-tabs-mini">
          <button className={filtro === 'todos' ? 'active' : ''} onClick={() => setFiltro('todos')}>
            Todos ({leads.length})
          </button>
          {tiposExtra.map(t => (
            <button key={t} className={filtro === t ? 'active' : ''} onClick={() => setFiltro(t)}>
              {TIPO_LABELS[t] || t} ({leads.filter(l => l.tipo === t).length})
            </button>
          ))}
        </div>
        <span className="adm-count">{filtrados.length} leads</span>
      </div>
      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Email</th><th>Teléfono</th><th>Formulario</th><th>Fecha</th></tr></thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: 24 }}>Sin leads aún</td></tr>
              )}
              {filtrados.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.email}</strong></td>
                  <td>{l.telefono || '—'}</td>
                  <td><span className="adm-badge">{TIPO_LABELS[l.tipo] || l.tipo || '—'}</span></td>
                  <td className="adm-date">{new Date(l.created_at).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── RECETAS IA ─────────────────────────────────────────────── */
function RecetasAdmin() {
  const [recetas,       setRecetas]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expandedUser,  setExpandedUser]  = useState(null); // user_id con desglose abierto
  const [vistaReceta,   setVistaReceta]   = useState(null); // receta individual
  const [msg,           setMsg]           = useState('');

  useEffect(() => {
    callAdmin('getRecetas')
      .then(d => { setRecetas(d.recetas); setLoading(false); })
      .catch(e => { setMsg('Error: ' + e.message); setLoading(false); });
  }, []);

  // Agrupar por usuario
  const grupos = useMemo(() => {
    const map = new Map();
    for (const r of recetas) {
      const key = r.user_id || '__anonimo__';
      if (!map.has(key)) map.set(key, { user_id: key, nombre_usuario: r.nombre_usuario || 'Anónimo', recetas: [] });
      map.get(key).recetas.push(r);
    }
    return [...map.values()].sort((a, b) => b.recetas.length - a.recetas.length);
  }, [recetas]);

  const toggleUser = (uid) => setExpandedUser(prev => prev === uid ? null : uid);

  return (
    <div className="adm-section">
      {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}
      <div className="adm-toolbar">
        <span className="adm-count">{grupos.length} usuarios · {recetas.length} recetas generadas</span>
      </div>

      {loading ? <div className="adm-loading">Cargando…</div> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Usuario</th><th>Teléfono</th><th>Recetas</th><th>Última actividad</th><th></th></tr>
            </thead>
            <tbody>
              {grupos.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: 24 }}>Sin recetas aún</td></tr>
              )}
              {grupos.map(g => (
                <React.Fragment key={g.user_id}>
                  {/* Fila de usuario */}
                  <tr style={{ background: expandedUser === g.user_id ? '#FDF8F4' : undefined }}>
                    <td>
                      <strong>{g.nombre_usuario}</strong>
                      {g.user_id === '__anonimo__' && <span className="adm-badge" style={{ marginLeft: 6 }}>sin cuenta</span>}
                    </td>
                    <td className="adm-email">{g.recetas[0]?.telefono || '—'}</td>
                    <td><span className="adm-badge">{g.recetas.length} receta{g.recetas.length !== 1 ? 's' : ''}</span></td>
                    <td className="adm-date">
                      {new Date(g.recetas[0].created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td>
                      <button className="adm-btn-edit" onClick={() => toggleUser(g.user_id)}>
                        {expandedUser === g.user_id ? '▲ Ocultar' : '▼ Ver recetas'}
                      </button>
                    </td>
                  </tr>

                  {/* Desglose de recetas del usuario */}
                  {expandedUser === g.user_id && g.recetas.map(r => (
                    <tr key={r.id} style={{ background: '#FFFDF9' }}>
                      <td colSpan={3} style={{ paddingLeft: 32 }}>
                        <span style={{ fontSize: 13, color: '#4A3F35' }}>
                          🧪 {r.nombre?.slice(0, 80) || '—'}
                        </span>
                        <span className="adm-date" style={{ marginLeft: 12 }}>
                          {new Date(r.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </td>
                      <td>
                        <div className="adm-actions">
                          <button className="adm-btn-sec" style={{ fontSize: 12, padding: '3px 10px' }}
                            onClick={() => setVistaReceta(r)}>
                            Leer
                          </button>
                          {waRecetaUrl(r) && (
                            <a
                              href={waRecetaUrl(r)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="adm-btn-wa"
                              title={`Enviar ingredientes a ${r.nombre_usuario} por WhatsApp`}
                            >
                              WA
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle de receta */}
      {vistaReceta && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setVistaReceta(null)}>
          <div className="adm-modal" style={{ maxWidth: 640, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 4 }}>{vistaReceta.nombre}</h3>
            <p style={{ fontSize: 12, color: '#9E9188', marginBottom: 16 }}>
              {vistaReceta.nombre_usuario} · {new Date(vistaReceta.created_at).toLocaleDateString('es-MX')}
            </p>
            <pre style={{ fontSize: 13, color: '#4A3F35', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
              {vistaReceta.contenido}
            </pre>
            <div className="adm-modal-btns" style={{ marginTop: 20 }}>
              <button className="adm-btn-sec" onClick={() => setVistaReceta(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── RECETAS DESTACADAS ADMIN ───────────────────────────────── */
const EMPTY_DEST_FORM = { titulo: '', categoria: '', imagen_url: '', orden: 0, activa: true };

function destParseBlocks(desc) {
  if (!desc) return [{ type: 'text', content: '' }];
  try {
    const p = JSON.parse(desc);
    if (Array.isArray(p) && p.length > 0) return p;
  } catch {}
  return [{ type: 'text', content: desc }];
}

function RecetasDestacadasAdmin() {
  const [lista,   setLista]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [form,    setForm]    = useState(EMPTY_DEST_FORM);
  const [blocks,  setBlocks]  = useState([{ type: 'text', content: '' }]);
  const [editId,  setEditId]  = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recetas_destacadas')
      .select('*')
      .order('orden', { ascending: true });
    if (error) {
      if (error.code === '42P01') {
        setErr('TABLA_FALTANTE');
      } else {
        setErr(error.message);
      }
    }
    else setLista(data || []);
    setLoading(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async e => {
    e.preventDefault();
    if (!form.titulo.trim()) { setErr('El título es obligatorio.'); return; }
    setSaving(true);
    setErr('');
    const descripcion = JSON.stringify(blocks.filter(b => b.content?.trim()));
    const payload = { ...form, descripcion, orden: Number(form.orden) || 0 };
    const { error } = editId
      ? await supabase.from('recetas_destacadas').update(payload).eq('id', editId)
      : await supabase.from('recetas_destacadas').insert(payload);
    if (error) { setErr(error.message); setSaving(false); return; }
    setErr(editId ? 'Receta actualizada ✓' : 'Receta agregada ✓');
    setForm(EMPTY_DEST_FORM);
    setBlocks([{ type: 'text', content: '' }]);
    setEditId(null);
    await cargar();
    setSaving(false);
  };

  const handleEdit = r => {
    setEditId(r.id);
    setForm({ titulo: r.titulo || '', categoria: r.categoria || '', imagen_url: r.imagen_url || '', orden: r.orden ?? 0, activa: r.activa ?? true });
    setBlocks(destParseBlocks(r.descripcion));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta receta?')) return;
    const { error } = await supabase.from('recetas_destacadas').delete().eq('id', id);
    if (error) { setErr(error.message); return; }
    await cargar();
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(EMPTY_DEST_FORM);
    setBlocks([{ type: 'text', content: '' }]);
    setErr('');
  };

  const toggleActiva = async r => {
    await supabase.from('recetas_destacadas').update({ activa: !r.activa }).eq('id', r.id);
    cargar();
  };

  // preview text for list
  const previewText = r => {
    try {
      const b = JSON.parse(r.descripcion);
      const first = Array.isArray(b) ? b.find(x => x.type === 'text')?.content : null;
      return (first || r.descripcion || '').slice(0, 70);
    } catch { return (r.descripcion || '').slice(0, 70); }
  };

  const SQL_TABLA = `create table if not exists recetas_destacadas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  categoria   text,
  descripcion text,
  imagen_url  text,
  orden       int default 0,
  activa      boolean default true,
  created_at  timestamptz default now()
);
alter table recetas_destacadas enable row level security;
create policy "lectura publica" on recetas_destacadas for select using (true);
create policy "admin escritura" on recetas_destacadas for all using (auth.role() = 'authenticated');`;

  if (err === 'TABLA_FALTANTE') {
    return (
      <div className="adm-card" style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ fontSize: 28, marginBottom: 12 }}>🗄️</p>
        <h3 style={{ marginBottom: 8 }}>La tabla aún no existe en Supabase</h3>
        <p style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>
          Copia este SQL y ejecútalo en el{' '}
          <a href={`https://supabase.com/dashboard/project/pxreruyfjpacnvhxmhlk/sql/new`}
            target="_blank" rel="noopener noreferrer" style={{ color: '#B08968' }}>
            SQL Editor de tu proyecto
          </a>.
        </p>
        <pre style={{ background: '#F5F0EB', borderRadius: 10, padding: 16, fontSize: 12, textAlign: 'left', overflowX: 'auto', marginBottom: 16 }}>
          {SQL_TABLA}
        </pre>
        <button className="adm-btn-primary"
          onClick={() => { navigator.clipboard.writeText(SQL_TABLA); alert('SQL copiado ✓'); }}>
          Copiar SQL
        </button>
        <button className="adm-btn-sec" onClick={() => { setErr(''); cargar(); }} style={{ marginLeft: 10 }}>
          Ya lo ejecuté — Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* FORMULARIO */}
      <div className="adm-card" style={{ marginBottom: 24 }}>
        <h3 className="adm-section-title">{editId ? '✏️ Editar receta destacada' : '✨ Nueva receta destacada'}</h3>
        {err && <div className="adm-msg" onClick={() => setErr('')}>{err} ×</div>}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="adm-input" placeholder="Título *"
            value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <input className="adm-input" placeholder="Categoría (ej: Facial, Corporal, Capilar…)"
            value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
          <input className="adm-input" placeholder="URL de imagen de portada (https://…)"
            value={form.imagen_url} onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))} />
          {form.imagen_url && (
            <img src={form.imagen_url} alt="portada"
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '2px solid #B08968', marginTop: -6 }} />
          )}

          {/* Editor de bloques */}
          <div>
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 8px' }}>Contenido (bloques de texto, títulos e imágenes)</p>
            <BlockEditor blocks={blocks} onChange={setBlocks} />
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#888' }}>Orden</label>
              <input className="adm-input" type="number" min={0} style={{ width: 80 }}
                value={form.orden} onChange={e => setForm(f => ({ ...f, orden: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <input type="checkbox" id="dest-activa" checked={form.activa}
                onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
                style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="dest-activa" style={{ fontSize: 14, cursor: 'pointer' }}>Visible en página principal</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" className="adm-btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Publicar receta'}
            </button>
            {editId && (
              <button type="button" className="adm-btn-sec" onClick={handleCancel}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      {/* LISTA */}
      <div className="adm-card">
        <h3 className="adm-section-title">Recetas publicadas ({lista.length})</h3>
        {loading ? <div className="adm-loading">Cargando…</div> : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Orden</th><th>Portada</th><th>Título</th><th>Categoría</th><th>Vista previa</th><th>Visible</th><th></th></tr>
              </thead>
              <tbody>
                {lista.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: 24 }}>Sin recetas aún.</td></tr>
                )}
                {lista.map(r => (
                  <tr key={r.id} style={{ background: editId === r.id ? '#FDF8F4' : undefined }}>
                    <td style={{ textAlign: 'center', width: 50 }}>{r.orden}</td>
                    <td style={{ width: 64 }}>
                      {r.imagen_url
                        ? <img src={r.imagen_url} alt={r.titulo} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #EDE0D4' }} />
                        : <div style={{ width: 52, height: 52, background: '#F5EDE3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌿</div>
                      }
                    </td>
                    <td><strong>{r.titulo}</strong></td>
                    <td><span className="adm-badge">{r.categoria || '—'}</span></td>
                    <td className="adm-email" style={{ maxWidth: 200 }}>{previewText(r)}…</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleActiva(r)}
                        style={{ cursor: 'pointer', border: 'none', background: r.activa ? '#E8F5E9' : '#FFF3E0', color: r.activa ? '#388E3C' : '#E65100', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'inherit' }}
                      >
                        {r.activa ? 'Visible' : 'Oculta'}
                      </button>
                    </td>
                    <td>
                      <button className="adm-btn-edit" onClick={() => handleEdit(r)}>Editar</button>
                      <button className="adm-btn-del" onClick={() => handleDelete(r.id)} style={{ marginLeft: 6 }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── EMAIL MARKETING ────────────────────────────────────────── */
const FONTS = [
  { label: 'Georgia (clásica)',   value: 'Georgia, serif' },
  { label: 'Arial (moderna)',     value: 'Arial, sans-serif' },
  { label: 'Helvetica (limpia)',  value: 'Helvetica Neue, Helvetica, Arial, sans-serif' },
  { label: 'Palatino (elegante)', value: 'Palatino Linotype, Palatino, serif' },
  { label: 'Trebuchet (amigable)',value: 'Trebuchet MS, sans-serif' },
];

const EMPTY_EMAIL = {
  id: '', nombre: '', asunto: '', fuente: 'Georgia, serif',
  bloques: [{ type: 'h1', content: '' }, { type: 'text', content: '' }],
};

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildPreviewHtml(bloques, fuente) {
  const blocks = bloques.map(b => {
    switch (b.type) {
      case 'h1':    return `<h1 style="font-family:${fuente};color:#4A3F35;font-size:26px;line-height:1.3;margin:20px 0 10px;">${esc(b.content)}</h1>`;
      case 'h2':    return `<h2 style="font-family:${fuente};color:#6B5B4E;font-size:18px;margin:16px 0 6px;">${esc(b.content)}</h2>`;
      case 'text':  return `<p style="font-family:${fuente};color:#4A3F35;font-size:14px;line-height:1.7;margin:0 0 14px;">${esc(b.content).replace(/\n/g,'<br/>')}</p>`;
      case 'image': return `<img src="${esc(b.content)}" alt="${esc(b.caption||'')}" style="max-width:100%;border-radius:8px;display:block;margin:12px auto;"/>` + (b.caption ? `<p style="text-align:center;color:#9E9188;font-size:11px;margin:-4px 0 12px;">${esc(b.caption)}</p>` : '');
      case 'button':return `<div style="text-align:center;margin:20px 0;"><a href="#" style="display:inline-block;background:${esc(b.color||'#B08968')};color:#fff;padding:11px 30px;border-radius:8px;text-decoration:none;font-family:${fuente};font-size:14px;font-weight:bold;">${esc(b.content||'Botón')}</a></div>`;
      case 'divider':return `<hr style="border:none;border-top:1px solid #EDE0D4;margin:22px 0;"/>`;
      default: return '';
    }
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#F9F5F0;font-family:${fuente};">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px;">
<table width="560" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden;" cellpadding="0" cellspacing="0">
<tr><td style="background:#4A3F35;padding:22px 32px;text-align:center;"><p style="color:#F5EDE3;margin:0;font-family:Georgia,serif;font-size:18px;letter-spacing:3px;">⚗️ BE ALQUIMIST</p></td></tr>
<tr><td style="padding:32px;">${blocks}</td></tr>
<tr><td style="background:#F5EDE3;padding:16px 32px;text-align:center;"><p style="color:#9E9188;font-size:11px;font-family:Arial,sans-serif;margin:0;">© ${new Date().getFullYear()} Be Alquimist</p></td></tr>
</table></td></tr></table></body></html>`;
}

function EmailBlockEditor({ bloques, onChange }) {
  const update = (i, field, val) => onChange(bloques.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  const add    = (type) => onChange([...bloques, type === 'button' ? { type, content: 'Visítanos', url: '', color: '#B08968' } : type === 'divider' ? { type, content: '' } : { type, content: '' }]);
  const remove = (i)    => onChange(bloques.filter((_, idx) => idx !== i));
  const move   = (i, d) => {
    const next = [...bloques]; const to = i + d;
    if (to < 0 || to >= next.length) return;
    [next[i], next[to]] = [next[to], next[i]]; onChange(next);
  };

  return (
    <div className="block-editor">
      {bloques.map((b, i) => (
        <div key={i} className={`block-row block-row--${b.type}`}>
          <select className="block-type-select" value={b.type} onChange={e => update(i, 'type', e.target.value)}>
            <option value="h1">H1 — Título grande</option>
            <option value="h2">H2 — Subtítulo</option>
            <option value="text">Párrafo</option>
            <option value="image">Imagen (URL)</option>
            <option value="button">Botón</option>
            <option value="divider">Separador</option>
          </select>

          {b.type === 'divider' ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', padding:'0 8px' }}>
              <hr style={{ flex:1, border:'none', borderTop:'2px dashed #EDE0D4' }} />
            </div>
          ) : b.type === 'image' ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
              <input className="block-input block-input--h1" placeholder="URL de la imagen (https://…)" value={b.content} onChange={e => update(i,'content',e.target.value)} />
              <input className="block-input block-input--h1" placeholder="Caption / descripción (opcional)" style={{ fontSize:12 }} value={b.caption||''} onChange={e => update(i,'caption',e.target.value)} />
              {b.content && <img src={b.content} alt="" style={{ maxWidth:200, maxHeight:140, objectFit:'cover', borderRadius:8, border:'1px solid #EDE0D4' }} />}
            </div>
          ) : b.type === 'button' ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
              <input className="block-input block-input--h1" placeholder="Texto del botón" value={b.content} onChange={e => update(i,'content',e.target.value)} />
              <input className="block-input block-input--h1" placeholder="URL destino (https://…)" value={b.url||''} onChange={e => update(i,'url',e.target.value)} />
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ fontSize:12, color:'#888', flexShrink:0 }}>Color:</label>
                <input type="color" value={b.color||'#B08968'} onChange={e => update(i,'color',e.target.value)} style={{ width:40, height:30, border:'none', borderRadius:6, cursor:'pointer', padding:2 }} />
                <span style={{ fontSize:12, color:'#888' }}>{b.color||'#B08968'}</span>
              </div>
            </div>
          ) : b.type === 'text' ? (
            <textarea className="block-input block-input--text" placeholder="Párrafo de texto…" rows={3} value={b.content} onChange={e => update(i,'content',e.target.value)} />
          ) : (
            <input className="block-input block-input--h1" placeholder={b.type === 'h2' ? 'Subtítulo…' : 'Título principal…'} value={b.content} onChange={e => update(i,'content',e.target.value)} />
          )}

          <div className="block-actions">
            <button type="button" className="block-btn" onClick={() => move(i,-1)} title="Subir">↑</button>
            <button type="button" className="block-btn" onClick={() => move(i, 1)} title="Bajar">↓</button>
            <button type="button" className="block-btn block-btn--del" onClick={() => remove(i)} title="Eliminar">✕</button>
          </div>
        </div>
      ))}
      <div className="block-add-row">
        {['h1','h2','text','image','button','divider'].map(t => (
          <button key={t} type="button" className="block-add-btn" onClick={() => add(t)}>
            + {t === 'h1' ? 'Título' : t === 'h2' ? 'Subtítulo' : t === 'text' ? 'Párrafo' : t === 'image' ? 'Imagen' : t === 'button' ? 'Botón' : 'Separador'}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmailMarketing() {
  const [templates, setTemplates] = useState([]);
  const [form,      setForm]      = useState({ ...EMPTY_EMAIL, id: 'bienvenida', nombre: 'Bienvenida' });
  const [msg,       setMsg]       = useState('');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [preview,   setPreview]   = useState(false);
  const [tablaMissing, setTablaMissing] = useState(false);

  const callEmail = useCallback(async (action, extra = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token: session?.access_token, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error');
    return json;
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { templates: list } = await callEmail('listTemplates');
      setTemplates(list || []);
      if (list?.length > 0) {
        const { template } = await callEmail('getTemplate', { id: list[0].id });
        if (template) setForm({ ...template, bloques: template.bloques || EMPTY_EMAIL.bloques });
      }
    } catch (e) {
      if (e.message?.includes('42P01') || e.message?.includes('does not exist')) setTablaMissing(true);
      else setMsg('Error cargando: ' + e.message);
    }
    setLoading(false);
  }, [callEmail]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selectTemplate = async (id) => {
    try {
      const { template } = await callEmail('getTemplate', { id });
      if (template) setForm({ ...template, bloques: template.bloques || EMPTY_EMAIL.bloques });
    } catch (e) { setMsg('Error: ' + e.message); }
  };

  const save = async () => {
    if (!form.id.trim()) { setMsg('El ID de la plantilla es requerido'); return; }
    setSaving(true);
    try {
      await callEmail('saveTemplate', form);
      setMsg('Plantilla guardada ✓');
      await loadTemplates();
    } catch (e) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const sendTest = async () => {
    if (!testEmail) { setMsg('Ingresa un email para la prueba'); return; }
    setSaving(true);
    try {
      await callEmail('sendTest', { ...form, to: testEmail });
      setMsg(`Email de prueba enviado a ${testEmail} ✓`);
    } catch (e) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const sendCampaign = async () => {
    if (!window.confirm('¿Enviar este email a TODOS los leads? Esta acción no se puede deshacer.')) return;
    setSaving(true);
    try {
      const { total, failed } = await callEmail('sendCampaign', form);
      setMsg(`Campaña enviada: ${total - failed} exitosos, ${failed} fallidos`);
    } catch (e) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const SQL_TABLA = `create table if not exists email_plantillas (
  id         text primary key,
  nombre     text,
  asunto     text,
  fuente     text default 'Georgia, serif',
  bloques    jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table email_plantillas enable row level security;
create policy "solo autenticado" on email_plantillas for all using (auth.role() = 'authenticated');`;

  if (tablaMissing) return (
    <div className="adm-card" style={{ textAlign:'center', padding:32 }}>
      <p style={{ fontSize:28, marginBottom:12 }}>📧</p>
      <h3 style={{ marginBottom:8 }}>Falta la tabla en Supabase</h3>
      <p style={{ color:'#888', marginBottom:20, fontSize:14 }}>
        Ejecuta este SQL en el{' '}
        <a href="https://supabase.com/dashboard/project/pxreruyfjpacnvhxmhlk/sql/new" target="_blank" rel="noopener noreferrer" style={{ color:'#B08968' }}>
          SQL Editor
        </a>.
      </p>
      <pre style={{ background:'#F5F0EB', borderRadius:10, padding:16, fontSize:12, textAlign:'left', overflowX:'auto', marginBottom:16 }}>{SQL_TABLA}</pre>
      <button className="adm-btn-primary" onClick={() => { navigator.clipboard.writeText(SQL_TABLA); alert('SQL copiado ✓'); }}>Copiar SQL</button>
      <button className="adm-btn-sec" onClick={() => { setTablaMissing(false); loadTemplates(); }} style={{ marginLeft:10 }}>Ya lo ejecuté — Reintentar</button>
    </div>
  );

  if (loading) return <div className="adm-loading">Cargando…</div>;

  return (
    <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>

      {/* ── PANEL IZQUIERDO: EDITOR ── */}
      <div style={{ flex:'1 1 380px', minWidth:320 }}>
        {msg && <div className="adm-msg" onClick={() => setMsg('')}>{msg} ×</div>}

        {/* Selector de plantillas */}
        {templates.length > 0 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {templates.map(t => (
              <button key={t.id}
                className={form.id === t.id ? 'adm-btn-primary' : 'adm-btn-sec'}
                style={{ fontSize:13, padding:'5px 14px' }}
                onClick={() => selectTemplate(t.id)}>
                {t.nombre || t.id}
              </button>
            ))}
            <button className="adm-btn-sec" style={{ fontSize:13, padding:'5px 14px' }}
              onClick={() => setForm({ ...EMPTY_EMAIL, id: '', nombre: 'Nueva plantilla' })}>
              + Nueva
            </button>
          </div>
        )}

        <div className="adm-card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <h3 className="adm-section-title" style={{ marginBottom:4 }}>✏️ Editor de email</h3>

          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label className="adm-label">ID de plantilla</label>
              <input className="adm-input" placeholder="ej: bienvenida" value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s+/g,'-') }))} />
            </div>
            <div style={{ flex:1 }}>
              <label className="adm-label">Nombre</label>
              <input className="adm-input" placeholder="Nombre descriptivo" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="adm-label">Asunto del email</label>
            <input className="adm-input" placeholder="Ej: Bienvenida a Be Alquimist 🌿" value={form.asunto}
              onChange={e => setForm(f => ({ ...f, asunto: e.target.value }))} />
          </div>

          <div>
            <label className="adm-label">Tipo de letra</label>
            <select className="adm-input" value={form.fuente} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}>
              {FONTS.map(fn => <option key={fn.value} value={fn.value}>{fn.label}</option>)}
            </select>
          </div>

          <div>
            <label className="adm-label" style={{ marginBottom:8, display:'block' }}>Contenido del email</label>
            <EmailBlockEditor bloques={form.bloques} onChange={bloques => setForm(f => ({ ...f, bloques }))} />
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
            <button className="adm-btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar plantilla'}</button>
            <button className="adm-btn-sec" onClick={() => setPreview(p => !p)}>{preview ? 'Ocultar vista previa' : 'Vista previa'}</button>
          </div>
        </div>

        {/* Envíos */}
        <div className="adm-card" style={{ marginTop:16 }}>
          <h3 className="adm-section-title" style={{ marginBottom:12 }}>📤 Envíos</h3>

          <div>
            <label className="adm-label">Email de prueba</label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="adm-input" type="email" placeholder="tu@email.com" style={{ flex:1 }}
                value={testEmail} onChange={e => setTestEmail(e.target.value)} />
              <button className="adm-btn-sec" onClick={sendTest} disabled={saving} style={{ whiteSpace:'nowrap' }}>Enviar prueba</button>
            </div>
          </div>

          <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #EDE0D4' }}>
            <p style={{ fontSize:13, color:'#888', margin:'0 0 10px' }}>
              Envía este email a <strong>todos los leads</strong> registrados.
            </p>
            <button onClick={sendCampaign} disabled={saving}
              style={{ background:'#4A3F35', color:'#F5EDE3', border:'none', borderRadius:8, padding:'10px 24px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enviando…' : 'Enviar campaña a todos los leads'}
            </button>
          </div>

          <p style={{ fontSize:11, color:'#aaa', marginTop:12, marginBottom:0 }}>
            La plantilla con ID <code>bienvenida</code> se envía automáticamente cuando un usuario se registra.
            Usa <code>{"{{nombre}}"}</code> en el texto para personalizar con el nombre del usuario.
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO: VISTA PREVIA ── */}
      {preview && (
        <div style={{ flex:'1 1 360px', minWidth:300 }}>
          <div className="adm-card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ background:'#E8E0D8', padding:'10px 16px', fontSize:13, color:'#6B5B4E', fontWeight:600 }}>
              Vista previa del email
            </div>
            <iframe
              key={JSON.stringify(form)}
              srcDoc={buildPreviewHtml(form.bloques, form.fuente)}
              style={{ width:'100%', height:600, border:'none', display:'block' }}
              title="Vista previa"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'dashboard',  label: '📊 Dashboard' },
  { id: 'contactos',  label: '📋 Contactos' },
  { id: 'usuarios',   label: '👥 Usuarios' },
  { id: 'productos',  label: '📦 Productos' },
  { id: 'pedidos',    label: '🛒 Pedidos' },
  { id: 'comunidad',  label: '💬 Comunidad' },
  { id: 'biblioteca', label: '🌿 Biblioteca' },
  { id: 'leads',      label: '📧 Leads' },
  { id: 'recetas',    label: '🧪 Recetas IA' },
  { id: 'destacadas', label: '✨ Destacadas' },
  { id: 'email',      label: '📨 Email Marketing' },
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
          {tab === 'contactos'  && <Contactos />}
          {tab === 'usuarios'   && <Usuarios />}
          {tab === 'productos'  && <Productos />}
          {tab === 'pedidos'    && <Pedidos />}
          {tab === 'comunidad'  && <Comunidad />}
          {tab === 'biblioteca' && <BibliotecaAdmin />}
          {tab === 'leads'      && <Leads />}
          {tab === 'recetas'    && <RecetasAdmin />}
          {tab === 'destacadas' && <RecetasDestacadasAdmin />}
          {tab === 'email'      && <EmailMarketing />}
        </div>
      </main>
    </div>
  );
}
