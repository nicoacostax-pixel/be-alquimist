import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useElementos } from '../../../shared/context/ElementosContext';
import SidebarMenu from '../../catalog/components/SidebarMenu';
import '../../../App.css';

const DEFAULT_IMG = 'https://via.placeholder.com/400x300/F3EFE8/B08968?text=🌿';

export default function Biblioteca() {
  const { esPro, isLoggedIn } = useElementos();
  const [ingredientes, setIngredientes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!esPro) return;
    supabase.from('ingredientes').select('*').order('nombre')
      .then(({ data }) => setIngredientes(data || []))
      .finally(() => setLoading(false));
  }, [esPro]);

  const filtered = ingredientes.filter(i =>
    i.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Estado bloqueado (no logueado o no PRO) ──
  if (!isLoggedIn || !esPro) {
    return (
      <div className="biblioteca-locked">
        <nav className="pro-nav">
          <Link to="/" className="pro-nav-logo">Be Alquimist</Link>
        </nav>
        <div className="biblioteca-locked-body">
          <span className="biblioteca-locked-icon">🔒</span>
          <h2>Biblioteca de Ingredientes</h2>
          <p>Accede a la base de datos completa de ingredientes naturales con descripciones, propiedades y usos cosméticos.</p>
          <p className="biblioteca-locked-sub">Exclusivo para <strong>Alquimistas PRO</strong>.</p>
          <Link to="/pro" className="pro-cta-btn" style={{ display: 'inline-block', textDecoration: 'none', maxWidth: 280 }}>
            {isLoggedIn ? 'Obtener plan PRO' : 'Ver plan PRO'}
          </Link>
          <Link to="/" style={{ display: 'block', marginTop: 16, fontSize: 14, color: '#B08968' }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`insumos-container ${isSidebarOpen ? 'menu-visible' : ''}`}>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* HEADER */}
      <header className="biblioteca-header">
        <button className="header-icon-btn" onClick={() => setIsSidebarOpen(true)}>
          <span style={{ fontSize: 22 }}>☰</span>
        </button>
        <Link to="/" className="pro-nav-logo">Be Alquimist</Link>
        <span className="pro-already-badge" style={{ fontSize: 12 }}>⚗️ PRO</span>
      </header>

      {/* HERO */}
      <section className="biblioteca-hero">
        <h1 className="biblioteca-title">Biblioteca de Ingredientes</h1>
        <p className="biblioteca-sub">Conoce a fondo cada activo de tu formulación</p>
        <div className="biblioteca-search-wrap">
          <input
            className="biblioteca-search"
            type="text"
            placeholder="Buscar ingrediente o categoría…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* GRID */}
      <main className="biblioteca-main">
        {loading ? (
          <p className="biblioteca-empty">Cargando ingredientes…</p>
        ) : filtered.length === 0 ? (
          <p className="biblioteca-empty">
            {search ? `Sin resultados para "${search}"` : 'Aún no hay ingredientes en la biblioteca.'}
          </p>
        ) : (
          <div className="biblioteca-grid">
            {filtered.map(ing => (
              <button key={ing.id} className="bib-card" onClick={() => setSelected(ing)}>
                <div className="bib-card-img-wrap">
                  <img
                    src={ing.imagen_url || DEFAULT_IMG}
                    alt={ing.nombre}
                    className="bib-card-img"
                    onError={e => { e.target.src = DEFAULT_IMG; }}
                  />
                </div>
                <div className="bib-card-body">
                  {ing.categoria && <span className="bib-card-cat">{ing.categoria}</span>}
                  <h3 className="bib-card-name">{ing.nombre}</h3>
                  <p className="bib-card-desc">{ing.descripcion?.slice(0, 90)}{ing.descripcion?.length > 90 ? '…' : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALLE */}
      {selected && (
        <div className="bib-modal-overlay" onClick={() => setSelected(null)}>
          <div className="bib-modal" onClick={e => e.stopPropagation()}>
            <button className="bib-modal-close" onClick={() => setSelected(null)}>✕</button>
            {selected.imagen_url && (
              <img src={selected.imagen_url} alt={selected.nombre} className="bib-modal-img"
                onError={e => { e.target.src = DEFAULT_IMG; }} />
            )}
            <div className="bib-modal-body">
              {selected.categoria && <span className="bib-card-cat">{selected.categoria}</span>}
              <h2 className="bib-modal-name">{selected.nombre}</h2>
              <p className="bib-modal-desc">{selected.descripcion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
