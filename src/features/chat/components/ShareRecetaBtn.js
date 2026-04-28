import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useElementos } from '../../../shared/context/ElementosContext';

export default function ShareRecetaBtn({ recetaCompleta }) {
  const { userId, isLoggedIn } = useElementos();
  const [estado, setEstado]   = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLoggedIn) return null;

  const compartir = async () => {
    setEstado('loading');
    setErrorMsg('');
    try {
      // 1. Obtener título y tipo con Gemini (solo campos cortos)
      const res = await fetch('/api/resumir-receta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receta: recetaCompleta }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al procesar la receta');
      const { titulo, descripcion, ingredientes } = resData;

      const listaIngredientes = (ingredientes || [])
        .map(i => `• ${i}`)
        .join('\n');

      const contenido =
`${descripcion || ''}

Ingredientes principales:
${listaIngredientes}

*Receta generada con Be Alquimist IA*`;

      // 2. Crear post en el foro
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          titulo: titulo || 'Receta natural',
          contenido,
          categoria: 'Recetas',
          usuario_id: userId,
        });

      if (postError) throw new Error(postError.message);
      setEstado('done');
    } catch (err) {
      setErrorMsg(err.message);
      setEstado('error');
    }
  };

  if (estado === 'done') {
    return (
      <div className="share-receta-success">
        <span>✓ Receta compartida en el foro</span>
        <Link to="/comunidad" className="share-receta-link">Ver en comunidad →</Link>
      </div>
    );
  }

  return (
    <div className="share-receta-wrap">
      {estado === 'error' && <p className="share-receta-error">{errorMsg}</p>}
      <button
        className="share-receta-btn"
        onClick={compartir}
        disabled={estado === 'loading'}
      >
        {estado === 'loading'
          ? <><span className="share-receta-spinner" />Compartiendo…</>
          : <><span>🌿</span> Compartir en el foro</>
        }
      </button>
    </div>
  );
}
