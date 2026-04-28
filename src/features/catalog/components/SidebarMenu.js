import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';

const insumosCategorias = [
  'Todos',
  'Aceites',
  'Aceites Esenciales',
  'Aditamentos',
  'Hidrolatos y Aguas florales',
  'Aromas',
  'Antioxidantes',
  'Bases de Jabón',
  'Ceras y mantecas',
  'Conservantes',
  'Colorantes',
  'Emulsionantes',
  'Extractos y Activos',
  'Hierbas secas',
  'Tensioactivos',
  'Polvos',
];

function toSlug(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function SidebarMenu({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isInsumosOpen, setIsInsumosOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setIsLoggedIn(!!data?.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setIsInsumosOpen(false);
  }, [isOpen]);

  const closeAll = () => {
    setIsInsumosOpen(false);
    onClose();
  };

  const goTo = (path) => {
    closeAll();
    navigate(path);
  };

  const handleCuentaClick = () => {
    goTo(isLoggedIn ? '/cuenta' : '/login');
  };

  return (
    <>
      {isOpen && <div className="overlay" onClick={closeAll}></div>}

      <aside className={`menu-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="menu-sidebar-header">
          <button className="menu-close-btn" onClick={closeAll} aria-label="Cerrar menú">
            ×
          </button>
        </div>

        <nav className="menu-list">
          <button className="menu-item" onClick={() => goTo('/')}>Laboratorio</button>
          <button className="menu-item" onClick={closeAll}>Envío a domicilio</button>
          <button className="menu-item has-arrow" onClick={() => setIsInsumosOpen(true)}>
            <span>Insumos</span>
            <span className="menu-arrow">›</span>
          </button>
          <button className="menu-item" onClick={closeAll}>Biblioteca de ingredientes</button>
          <button className="menu-item" onClick={handleCuentaClick}>Cuenta</button>
        </nav>
      </aside>

      <aside className={`menu-sidebar menu-sidebar-nested ${isOpen && isInsumosOpen ? 'open' : ''}`}>
        <div className="menu-sidebar-header nested">
          <button className="menu-back-btn" onClick={() => setIsInsumosOpen(false)}>‹ Atrás</button>
          <button className="menu-close-btn" onClick={closeAll} aria-label="Cerrar submenú">
            ×
          </button>
        </div>

        <nav className="menu-list">
          {insumosCategorias.map((categoria) => (
            <button
              key={categoria}
              className="menu-item"
              onClick={() => goTo(`/insumos/${toSlug(categoria)}`)}
            >
              {categoria}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default SidebarMenu;

