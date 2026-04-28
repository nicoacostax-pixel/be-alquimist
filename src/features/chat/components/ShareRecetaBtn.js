import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useElementos } from '../../../shared/context/ElementosContext';

async function generarImagenIA(titulo, ingredientes, tipo) {
  const res = await fetch('/api/generar-imagen-receta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, ingredientes, tipo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error generando imagen');

  // Convertir base64 a Blob
  const byteChars = atob(data.imageBase64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: 'image/png' });
}

export default function ShareRecetaBtn({ recetaCompleta }) {
  const { userId, isLoggedIn } = useElementos();
  const [estado, setEstado] = useState('idle'); // idle | loading | done | error
  const [postId, setPostId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLoggedIn) return null;

  const compartir = async () => {
    setEstado('loading');
    setErrorMsg('');
    try {
      // 1. Resumir con Gemini
      const res = await fetch('/api/resumir-receta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receta: recetaCompleta }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al resumir la receta');
      const { titulo, descripcion, ingredientes, tipo } = resData;

      // 2. Generar imagen con Gemini Imagen
      const blob = await generarImagenIA(titulo, ingredientes || [], tipo || '');

      // 3. Subir imagen a Supabase Storage
      const path = `${userId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path);
      const imagenUrl = urlData.publicUrl;

      // 4. Crear post en el foro
      const contenidoPost = `${descripcion}\n\n**Ingredientes principales:**\n${(ingredientes || []).map(i => `• ${i}`).join('\n')}\n\n*Receta generada con Be Alquimist IA*`;

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          titulo,
          contenido: contenidoPost,
          categoria: 'Recetas',
          usuario_id: userId,
          imagen_url: imagenUrl,
        })
        .select('id')
        .single();

      if (postError) throw new Error(postError.message);
      setPostId(post.id);
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
        {estado === 'loading' ? (
          <><span className="share-receta-spinner" />Generando y compartiendo…</>
        ) : (
          <>
            <span>🌿</span> Compartir en el foro
          </>
        )}
      </button>
    </div>
  );
}
