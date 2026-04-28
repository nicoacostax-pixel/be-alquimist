import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const NOMBRES_POOL = [
  'Carmen',
  'Ximena',
  'Sofia',
  'Lucia',
  'Valeria',
  'Mariana',
  'Fernanda',
  'Beatriz',
  'Elena',
  'Raquel',
  'Monica',
];

const CIUDADES_POOL = [
  'Monterrey',
  'Guadalajara',
  'CDMX',
  'Puebla',
  'Queretaro',
  'Merida',
  'Tijuana',
  'Cancun',
  'Saltillo',
  'Veracruz',
];

const FALLBACK_PRODUCTOS = [
  'aceite esencial',
  'hidrolato de rosas',
  'mica cosmetica',
  'cera de soya',
  'activo botanico',
];

function randomItem(items) {
  if (!items || items.length === 0) return '';
  return items[Math.floor(Math.random() * items.length)];
}

function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [productosPool, setProductosPool] = useState(FALLBACK_PRODUCTOS);
  const [data, setData] = useState({ nombre: '', ciudad: '', producto: '', tiempo: 1 });

  useEffect(() => {
    let cancelled = false;

    async function loadProductos() {
      const { data: productos } = await supabase.from('productos').select('nombre').limit(300);
      if (cancelled) return;

      const nombres = (productos || [])
        .map((item) => item?.nombre?.trim())
        .filter(Boolean);

      if (nombres.length > 0) {
        setProductosPool(nombres);
      }
    }

    loadProductos();
    return () => {
      cancelled = true;
    };
  }, []);

  const showRandomPopup = useMemo(
    () => () => {
      setData({
        nombre: randomItem(NOMBRES_POOL),
        ciudad: randomItem(CIUDADES_POOL),
        producto: randomItem(productosPool),
        tiempo: Math.floor(Math.random() * 10) + 1,
      });

      setVisible(true);
      window.setTimeout(() => setVisible(false), 5000);
    },
    [productosPool]
  );

  useEffect(() => {
    const initialTimer = window.setTimeout(showRandomPopup, 5000);
    const repeatInterval = window.setInterval(showRandomPopup, 25000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(repeatInterval);
    };
  }, [showRandomPopup]);

  return (
    <div
      className={`global-social-proof-popup ${visible ? 'is-visible' : 'is-hidden'}`}
      role={visible ? 'status' : undefined}
      aria-live={visible ? 'polite' : undefined}
      aria-hidden={!visible}
    >
      <div className="gsp-badge">Actividad reciente</div>
      <p className="gsp-message">
        <strong>{data.nombre}</strong> de <strong>{data.ciudad}</strong> compro{' '}
        <strong>{data.producto}</strong>
      </p>
      <p className="gsp-time">hace {data.tiempo} min</p>
    </div>
  );
}

export default SocialProofPopup;
