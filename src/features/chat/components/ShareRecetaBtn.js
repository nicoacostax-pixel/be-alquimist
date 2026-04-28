import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabaseClient';
import { useElementos } from '../../../shared/context/ElementosContext';

function generarImagen(titulo, ingredientes, tipo) {
  return new Promise((resolve) => {
    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fondo
    ctx.fillStyle = '#F3EFE8';
    ctx.fillRect(0, 0, W, H);

    // Borde decorativo
    ctx.strokeStyle = '#D4B896';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Franja superior
    ctx.fillStyle = '#B08968';
    ctx.fillRect(0, 0, W, 90);

    // Brand en franja
    ctx.fillStyle = '#F4EFE8';
    ctx.font = 'bold 32px serif';
    ctx.fillText('Be Alquimist', 48, 58);

    // Tipo de producto (badge)
    if (tipo) {
      ctx.fillStyle = '#E8D5C0';
      roundRect(ctx, 48, 110, Math.min(tipo.length * 13 + 32, 400), 38, 8);
      ctx.fillStyle = '#4A3F35';
      ctx.font = '500 20px sans-serif';
      ctx.fillText(tipo, 64, 135);
    }

    // Título de la receta
    ctx.fillStyle = '#4A3F35';
    ctx.font = 'bold 54px serif';
    const lineas = wrapText(ctx, titulo, W - 96, 54);
    lineas.forEach((l, i) => ctx.fillText(l, 48, 210 + i * 68));

    // Separador
    const yLine = 220 + lineas.length * 68;
    ctx.strokeStyle = '#D4B896';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(48, yLine);
    ctx.lineTo(W - 48, yLine);
    ctx.stroke();

    // Ingredientes
    ctx.fillStyle = '#6B5D52';
    ctx.font = '24px sans-serif';
    const cols = Math.ceil(ingredientes.length / 2);
    ingredientes.slice(0, 6).forEach((ing, i) => {
      const col = Math.floor(i / cols);
      const row = i % cols;
      const x = 48 + col * 560;
      const y = yLine + 40 + row * 38;
      ctx.fillStyle = '#B08968';
      ctx.fillText('◆', x, y);
      ctx.fillStyle = '#4A3F35';
      ctx.fillText(ing.slice(0, 45), x + 24, y);
    });

    // Footer
    ctx.fillStyle = '#C8AA8A';
    ctx.font = '18px sans-serif';
    ctx.fillText('bealquimist.com  •  Cosmética natural con IA', 48, H - 30);

    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx, text, maxW, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
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

      // 2. Generar imagen en canvas
      const blob = await generarImagen(titulo, ingredientes || [], tipo || '');

      // 3. Subir imagen a Supabase Storage
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
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
