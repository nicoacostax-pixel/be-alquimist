import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

async function api(action, data, token) {
  const res = await fetch('/api/cursos-lms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, ...data }),
  });
  return res.json();
}

// ── Portada uploader ──────────────────────────────────────────────────────────

function PortadaUploader({ value, onChange }) {
  const fileRef    = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `portadas/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('recursos').upload(path, file, { upsert: true });
    if (!error) {
      onChange(`${SUPABASE_URL}/storage/v1/object/public/recursos/${path}`);
    }
    setUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      {value ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
          <img
            src={value}
            alt="Portada"
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
            }}
          >
            {uploading ? 'Subiendo…' : '📷 Cambiar imagen'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', border: '2px dashed #D0C8BF', borderRadius: 12,
            padding: '32px 16px', background: '#FAFAFA', cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif', color: '#9E8E80', fontSize: 14,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>🖼️</span>
          <span>{uploading ? 'Subiendo…' : 'Subir imagen de portada'}</span>
          <span style={{ fontSize: 12 }}>JPG, PNG, WebP — recomendado 1280×720</span>
        </button>
      )}
    </div>
  );
}

const BLOCK_TYPES = [
  { value: 'video',  label: '🎬 Video Vimeo' },
  { value: 'text',   label: '📝 Texto' },
  { value: 'button', label: '🔗 Botón' },
  { value: 'pdf',    label: '📄 PDF / Recurso' },
];

function defaultBlock(type) {
  if (type === 'video')  return { type, vimeo_url: '' };
  if (type === 'text')   return { type, content: '' };
  if (type === 'button') return { type, label: '', url: '' };
  if (type === 'pdf')    return { type, nombre: '', url: '' };
  return { type };
}

// ── Shared styles ────────────────────────────────────────────────────────────

const S = {
  input: {
    display: 'block', width: '100%', padding: '12px 14px',
    border: '1.5px solid #D0C8BF', borderRadius: 8, fontSize: 14,
    color: '#1A1A1A', background: '#FAFAFA', boxSizing: 'border-box',
    fontFamily: 'Poppins, sans-serif', outline: 'none',
  },
  btnPrimary: {
    background: '#B08968', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap',
  },
  btnGhost: {
    background: 'none', border: '1.5px solid #D0C8BF', borderRadius: 8,
    padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#4A3F35',
    cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
  },
  btnSm: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, padding: '4px 8px', color: '#7A6A5A',
    fontFamily: 'Poppins, sans-serif',
  },
};

// ── Block editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, idx, onChange, onRemove, onMove, uploading, onUpload }) {
  const fileRef = useRef();

  return (
    <div style={{ background: '#FAF7F2', border: '1.5px solid #EDE0D4', borderRadius: 12, padding: '16px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#B08968', flex: 1 }}>
          {BLOCK_TYPES.find(t => t.value === block.type)?.label}
        </span>
        <button onClick={() => onMove(idx, -1)} style={S.btnSm} title="Subir">↑</button>
        <button onClick={() => onMove(idx,  1)} style={S.btnSm} title="Bajar">↓</button>
        <button onClick={() => onRemove(idx)} style={{ ...S.btnSm, color: '#c0392b' }} title="Eliminar">✕</button>
      </div>

      {block.type === 'video' && (
        <input
          value={block.vimeo_url || ''}
          onChange={e => onChange(idx, { vimeo_url: e.target.value })}
          placeholder="URL de Vimeo (ej: https://vimeo.com/123456789)"
          style={S.input}
        />
      )}

      {block.type === 'text' && (
        <textarea
          value={block.content || ''}
          onChange={e => onChange(idx, { content: e.target.value })}
          placeholder="Escribe el texto de esta sección..."
          rows={6}
          style={{ ...S.input, resize: 'vertical' }}
        />
      )}

      {block.type === 'button' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={block.label || ''}
            onChange={e => onChange(idx, { label: e.target.value })}
            placeholder="Texto del botón"
            style={{ ...S.input, flex: '1 1 160px' }}
          />
          <input
            value={block.url || ''}
            onChange={e => onChange(idx, { url: e.target.value })}
            placeholder="URL de destino"
            style={{ ...S.input, flex: '2 1 200px' }}
          />
        </div>
      )}

      {block.type === 'pdf' && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <input
              value={block.nombre || ''}
              onChange={e => onChange(idx, { nombre: e.target.value })}
              placeholder="Nombre del recurso"
              style={{ ...S.input, flex: '1 1 160px' }}
            />
            <input
              value={block.url || ''}
              onChange={e => onChange(idx, { url: e.target.value })}
              placeholder="URL del archivo (o sube uno)"
              style={{ ...S.input, flex: '2 1 200px' }}
            />
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xlsx,.pptx,.zip"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && onUpload(e.target.files[0], idx)}
          />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ ...S.btnGhost, fontSize: 13 }}>
            {uploading ? 'Subiendo…' : '📤 Subir archivo'}
          </button>
          {block.url && <span style={{ fontSize: 12, color: '#43A047', marginLeft: 10 }}>✓ Archivo listo</span>}
        </>
      )}
    </div>
  );
}

// ── Lesson editor ─────────────────────────────────────────────────────────────

function LeccionEditor({ leccion, token, onBack }) {
  const [titulo,    setTitulo]    = useState(leccion.titulo);
  const [bloques,   setBloques]   = useState(leccion.bloques || []);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newType,   setNewType]   = useState('video');

  const save = async () => {
    setSaving(true); setSaved(false);
    await api('admin_updateLeccion', { leccionId: leccion.id, titulo, bloques }, token);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addBlock    = () => setBloques(p => [...p, defaultBlock(newType)]);
  const removeBlock = i  => setBloques(p => p.filter((_, j) => j !== i));
  const updateBlock = (i, upd) => setBloques(p => p.map((b, j) => j === i ? { ...b, ...upd } : b));
  const moveBlock   = (i, dir) => setBloques(p => {
    const a = [...p], j = i + dir;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  });

  const uploadFile = async (file, idx) => {
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `cursos/${leccion.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('recursos').upload(path, file);
    if (!error) {
      const url = `${SUPABASE_URL}/storage/v1/object/public/recursos/${path}`;
      updateBlock(idx, { url, nombre: block => block.nombre || file.name.replace(`.${ext}`, '') });
      // nombre may need explicit set
      setBloques(p => p.map((b, j) => j === idx ? { ...b, url, nombre: b.nombre || file.name.replace(`.${ext}`, '') } : b));
    }
    setUploading(false);
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 780, margin: '0 auto', padding: '24px 0 80px' }}>
      <button onClick={onBack} style={S.btnGhost}>← Volver al curso</button>

      <div style={{ background: '#fff', borderRadius: 14, padding: '28px', border: '1px solid #EDE0D4', marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#4A3F35', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>
          Editor de Lección
        </h2>

        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Título de la lección"
          style={{ ...S.input, marginBottom: 24, fontSize: 16, fontWeight: 700 }}
        />

        <p style={{ fontSize: 12, fontWeight: 700, color: '#B08968', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>
          Bloques de contenido
        </p>

        {bloques.length === 0 && (
          <div style={{ background: '#F9F6F2', borderRadius: 10, padding: '24px', textAlign: 'center', marginBottom: 16, border: '1.5px dashed #D0C8BF' }}>
            <p style={{ color: '#9E8E80', fontSize: 14, margin: 0 }}>Sin bloques. Agrega uno abajo.</p>
          </div>
        )}

        {bloques.map((block, i) => (
          <BlockEditor
            key={i} idx={i} block={block}
            onChange={updateBlock} onRemove={removeBlock} onMove={moveBlock}
            uploading={uploading} onUpload={uploadFile}
          />
        ))}

        {/* Add block row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            style={{ ...S.input, flex: '1 1 160px', marginBottom: 0 }}
          >
            {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={addBlock} style={S.btnPrimary}>+ Agregar bloque</button>
        </div>

        <button onClick={save} disabled={saving} style={{ ...S.btnPrimary, width: '100%', padding: '15px', fontSize: 15 }}>
          {saving ? 'Guardando…' : saved ? '✓ Guardado' : '💾 Guardar lección'}
        </button>
      </div>
    </div>
  );
}

// ── Course editor (modules + lessons) ────────────────────────────────────────

function CursoEditor({ cursoId, token, onBack }) {
  const [curso,          setCurso]          = useState(null);
  const [modulos,        setModulos]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [editingLeccion, setEditingLeccion] = useState(null);
  const [editingCurso,   setEditingCurso]   = useState(false);
  const [cursoForm,      setCursoForm]      = useState({});
  const [newModulo,      setNewModulo]      = useState('');
  const [newLecciones,   setNewLecciones]   = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api('admin_getCurso', { cursoId }, token);
    setCurso(res.curso);
    setCursoForm({
      titulo: res.curso.titulo, slug: res.curso.slug,
      descripcion: res.curso.descripcion || '',
      imagen_url: res.curso.imagen_url || '',
      publicado: res.curso.publicado,
    });
    setModulos(res.modulos || []);
    setLoading(false);
  }, [cursoId, token]);

  useEffect(() => { load(); }, [load]);

  if (editingLeccion) {
    return <LeccionEditor leccion={editingLeccion} token={token} onBack={() => { setEditingLeccion(null); load(); }} />;
  }

  const saveCurso = async () => {
    await api('admin_updateCurso', { cursoId, ...cursoForm }, token);
    setCurso(c => ({ ...c, ...cursoForm }));
    setEditingCurso(false);
  };

  const addModulo = async () => {
    if (!newModulo.trim()) return;
    await api('admin_createModulo', { cursoId, titulo: newModulo.trim(), orden: modulos.length }, token);
    setNewModulo(''); load();
  };

  const deleteModulo = async (moduloId) => {
    if (!window.confirm('¿Eliminar módulo y todas sus lecciones?')) return;
    await api('admin_deleteModulo', { moduloId }, token); load();
  };

  const addLeccion = async (moduloId) => {
    const titulo = (newLecciones[moduloId] || '').trim();
    if (!titulo) return;
    const orden = modulos.find(m => m.id === moduloId)?.lecciones?.length || 0;
    await api('admin_createLeccion', { moduloId, titulo, orden }, token);
    setNewLecciones(p => ({ ...p, [moduloId]: '' })); load();
  };

  const deleteLeccion = async (leccionId) => {
    if (!window.confirm('¿Eliminar lección?')) return;
    await api('admin_deleteLeccion', { leccionId }, token); load();
  };

  if (loading) return <div style={{ padding: 48, color: '#7A6A5A', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}>Cargando…</div>;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 780, margin: '0 auto', padding: '24px 0 80px' }}>
      <button onClick={onBack} style={S.btnGhost}>← Mis cursos</button>

      {/* Course header card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #EDE0D4', marginTop: 16, marginBottom: 20 }}>
        {editingCurso ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={cursoForm.titulo}      onChange={e => setCursoForm(p => ({ ...p, titulo:      e.target.value }))} placeholder="Título"      style={S.input} />
            <input value={cursoForm.slug}        onChange={e => setCursoForm(p => ({ ...p, slug:        e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="Slug (ej: velas-avanzadas)" style={S.input} />
            <textarea value={cursoForm.descripcion} onChange={e => setCursoForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción" rows={3} style={{ ...S.input, resize: 'vertical' }} />
            <PortadaUploader value={cursoForm.imagen_url} onChange={url => setCursoForm(p => ({ ...p, imagen_url: url }))} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#4A3F35', cursor: 'pointer' }}>
              <input type="checkbox" checked={cursoForm.publicado} onChange={e => setCursoForm(p => ({ ...p, publicado: e.target.checked }))} />
              Publicado (visible para usuarios)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveCurso}               style={S.btnPrimary}>Guardar</button>
              <button onClick={() => setEditingCurso(false)} style={S.btnGhost}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              {curso.imagen_url && (
                <img
                  src={curso.imagen_url}
                  alt="Portada"
                  style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#4A3F35', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
                  {curso.titulo}
                </h2>
                <span style={{ fontSize: 12, color: '#9E8E80' }}>/cursos/{curso.slug}/aprender</span>
                <span style={{
                  marginLeft: 10, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: curso.publicado ? '#E8F5E9' : '#FFF3E0',
                  color: curso.publicado ? '#2E7D32' : '#E65100',
                }}>
                  {curso.publicado ? 'Publicado' : 'Borrador'}
                </span>
              </div>
            </div>
            <button onClick={() => setEditingCurso(true)} style={S.btnGhost}>✏️ Editar</button>
          </div>
        )}
      </div>

      {/* Modules */}
      {modulos.map((modulo, mi) => (
        <div key={modulo.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #EDE0D4', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ background: '#FAF7F2', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#B08968', flex: 1 }}>
              Módulo {mi + 1}: {modulo.titulo}
            </span>
            <button onClick={() => deleteModulo(modulo.id)} style={{ ...S.btnSm, color: '#c0392b' }}>Eliminar módulo</button>
          </div>

          <div>
            {(modulo.lecciones || []).map((lec, li) => (
              <div key={lec.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F5EDE3', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#7A6A5A', flex: 1 }}>
                  {li + 1}. {lec.titulo}
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#B08968', background: '#FAF7F2', padding: '2px 8px', borderRadius: 20 }}>
                    {lec.bloques?.length || 0} bloques
                  </span>
                </span>
                <button onClick={() => setEditingLeccion(lec)} style={{ ...S.btnSm, color: '#B08968', fontWeight: 700 }}>✏️ Editar</button>
                <button onClick={() => deleteLeccion(lec.id)} style={{ ...S.btnSm, color: '#c0392b' }}>✕</button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, padding: '12px 20px' }}>
              <input
                value={newLecciones[modulo.id] || ''}
                onChange={e => setNewLecciones(p => ({ ...p, [modulo.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addLeccion(modulo.id)}
                placeholder="Nombre de la nueva lección"
                style={{ ...S.input, flex: 1, marginBottom: 0 }}
              />
              <button onClick={() => addLeccion(modulo.id)} style={S.btnPrimary}>+ Lección</button>
            </div>
          </div>
        </div>
      ))}

      {/* Add module */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed #D0C8BF', padding: '20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={newModulo}
          onChange={e => setNewModulo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addModulo()}
          placeholder="Nombre del nuevo módulo"
          style={{ ...S.input, flex: 1, minWidth: 200, marginBottom: 0 }}
        />
        <button onClick={addModulo} style={S.btnPrimary}>+ Agregar módulo</button>
      </div>
    </div>
  );
}

// ── Main page (course list) ───────────────────────────────────────────────────

export default function AdminCursosBuilder() {
  const [token,          setToken]          = useState(null);
  const [cursos,         setCursos]         = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selectedId,     setSelectedId]     = useState(null);
  const [showNewForm,    setShowNewForm]    = useState(false);
  const [newForm,        setNewForm]        = useState({ titulo: '', slug: '', descripcion: '', imagen_url: '' });
  const [creating,       setCreating]       = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const tok = session.access_token;
      setToken(tok);
      api('admin_listCursos', {}, tok).then(d => {
        setCursos(d.cursos || []);
        setLoading(false);
      });
    });
  }, []);

  const createCurso = async () => {
    if (!newForm.titulo || !newForm.slug) return;
    setCreating(true);
    const res = await api('admin_createCurso', newForm, token);
    if (res.curso) {
      setCursos(p => [res.curso, ...p]);
      setSelectedId(res.curso.id);
    }
    setCreating(false);
    setShowNewForm(false);
    setNewForm({ titulo: '', slug: '', descripcion: '' });
  };

  const deleteCurso = async (id) => {
    if (!window.confirm('¿Eliminar este curso y todo su contenido?')) return;
    await api('admin_deleteCurso', { cursoId: id }, token);
    setCursos(p => p.filter(c => c.id !== id));
  };

  if (selectedId) {
    return (
      <div style={{ background: '#F3EFE8', minHeight: '100vh', padding: '0 20px' }}>
        <CursoEditor cursoId={selectedId} token={token} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div style={{ background: '#F3EFE8', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', padding: '0 20px 80px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', paddingTop: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Link to="/admin" style={{ fontSize: 13, color: '#B08968', fontWeight: 600, textDecoration: 'none' }}>← Admin</Link>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#4A3F35', margin: '8px 0 0', fontFamily: 'Georgia, serif' }}>
              Constructor de Cursos
            </h1>
          </div>
          <button onClick={() => setShowNewForm(true)} style={S.btnPrimary}>+ Nuevo curso</button>
        </div>

        {/* New course form */}
        {showNewForm && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #EDE0D4', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#4A3F35', margin: '0 0 18px' }}>Nuevo curso</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={newForm.titulo}
                onChange={e => setNewForm(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Título del curso"
                style={S.input}
              />
              <input
                value={newForm.slug}
                onChange={e => setNewForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
                placeholder="Slug URL (ej: velas-avanzadas)"
                style={S.input}
              />
              <textarea
                value={newForm.descripcion}
                onChange={e => setNewForm(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción del curso (opcional)"
                rows={3}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <PortadaUploader
                value={newForm.imagen_url}
                onChange={url => setNewForm(p => ({ ...p, imagen_url: url }))}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={createCurso} disabled={creating} style={S.btnPrimary}>
                  {creating ? 'Creando…' : 'Crear y editar →'}
                </button>
                <button onClick={() => setShowNewForm(false)} style={S.btnGhost}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Course list */}
        {loading ? (
          <div style={{ color: '#7A6A5A', textAlign: 'center', padding: 48 }}>Cargando…</div>
        ) : cursos.length === 0 && !showNewForm ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '56px 32px', textAlign: 'center', border: '1.5px dashed #D0C8BF' }}>
            <p style={{ fontSize: 48, margin: '0 0 14px' }}>📚</p>
            <p style={{ color: '#7A6A5A', fontSize: 15, margin: '0 0 20px' }}>No hay cursos todavía.</p>
            <button onClick={() => setShowNewForm(true)} style={S.btnPrimary}>+ Crear primer curso</button>
          </div>
        ) : cursos.map(c => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 24px', border: '1px solid #EDE0D4', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {c.imagen_url && (
              <img src={c.imagen_url} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#4A3F35', fontSize: 15, marginBottom: 2 }}>{c.titulo}</div>
              <div style={{ fontSize: 12, color: '#9E8E80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                /cursos/{c.slug}/aprender
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, flexShrink: 0,
              background: c.publicado ? '#E8F5E9' : '#FFF3E0',
              color: c.publicado ? '#2E7D32' : '#E65100',
            }}>
              {c.publicado ? 'Publicado' : 'Borrador'}
            </span>
            <button onClick={() => setSelectedId(c.id)} style={S.btnPrimary}>Editar →</button>
            <button onClick={() => deleteCurso(c.id)} style={{ ...S.btnSm, color: '#c0392b', fontSize: 18 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
