const { createClient } = require('@supabase/supabase-js');

function sb() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const claims = JSON.parse(json);
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch { return null; }
}

const LEVEL_MINS = [0, 5, 25, 75, 150, 300, 500, 1000, 1600, 2500];
function getLevelNum(pts) {
  for (let i = LEVEL_MINS.length - 1; i >= 0; i--) {
    if (pts >= LEVEL_MINS[i]) return i + 1;
  }
  return 1;
}

async function getUserLevel(db, userId) {
  const { data } = await db.from('perfiles').select('puntos').eq('id', userId).single();
  return getLevelNum(data?.puntos || 0);
}

async function getCursoBySlugOrId(db, { slug, cursoId }) {
  if (cursoId) {
    const { data } = await db.from('cursos').select('*').eq('id', cursoId).single();
    return data;
  }
  if (slug) {
    const { data } = await db.from('cursos').select('*').eq('slug', slug).single();
    return data;
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, token, ...data } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Falta action' });

  const claims = decodeJwt(token);
  if (!claims?.email) return res.status(401).json({ error: 'No autenticado' });

  const adminEmail = process.env.ADMIN_EMAIL || process.env.REACT_APP_ADMIN_EMAIL;
  const isAdmin = claims.email === adminEmail;
  const userId = claims.sub;
  const db = sb();

  // ── ADMIN ACTIONS ─────────────────────────────────────────────────────────────
  if (action.startsWith('admin_')) {
    if (!isAdmin) return res.status(403).json({ error: 'Acceso denegado' });

    if (action === 'admin_listCursos') {
      const { data: cursos, error } = await db.from('cursos').select('*').order('orden').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ cursos });
    }

    if (action === 'admin_reorderCursos') {
      const { orden } = data; // array of { id, orden }
      const updates = orden.map(({ id, orden: o }) =>
        db.from('cursos').update({ orden: o }).eq('id', id)
      );
      await Promise.all(updates);
      return res.json({ ok: true });
    }

    if (action === 'admin_getCurso') {
      const { cursoId } = data;
      const { data: curso, error } = await db.from('cursos').select('*').eq('id', cursoId).single();
      if (error) return res.status(404).json({ error: 'Curso no encontrado' });
      const { data: modulos } = await db.from('modulos')
        .select('*, lecciones(*)')
        .eq('curso_id', cursoId)
        .order('orden');
      (modulos || []).forEach(m => m.lecciones?.sort((a, b) => a.orden - b.orden));
      return res.json({ curso, modulos: modulos || [] });
    }

    if (action === 'admin_createCurso') {
      const { titulo, slug, descripcion, imagen_url, nivel_requerido } = data;
      const { data: curso, error } = await db.from('cursos')
        .insert({ titulo, slug, descripcion, imagen_url, publicado: false, nivel_requerido: nivel_requerido ?? 1 })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ curso });
    }

    if (action === 'admin_updateCurso') {
      const { cursoId, titulo, slug, descripcion, imagen_url, publicado, nivel_requerido } = data;
      const { data: curso, error } = await db.from('cursos')
        .update({ titulo, slug, descripcion, imagen_url, publicado, nivel_requerido })
        .eq('id', cursoId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ curso });
    }

    if (action === 'admin_deleteCurso') {
      const { error } = await db.from('cursos').delete().eq('id', data.cursoId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    if (action === 'admin_createModulo') {
      const { cursoId, titulo, orden } = data;
      const { data: modulo, error } = await db.from('modulos')
        .insert({ curso_id: cursoId, titulo, orden: orden ?? 0 })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ modulo });
    }

    if (action === 'admin_updateModulo') {
      const { moduloId, titulo, orden } = data;
      const updates = {};
      if (titulo !== undefined) updates.titulo = titulo;
      if (orden  !== undefined) updates.orden  = orden;
      const { data: modulo, error } = await db.from('modulos')
        .update(updates).eq('id', moduloId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ modulo });
    }

    if (action === 'admin_deleteModulo') {
      const { error } = await db.from('modulos').delete().eq('id', data.moduloId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    if (action === 'admin_createLeccion') {
      const { moduloId, titulo, orden } = data;
      const { data: leccion, error } = await db.from('lecciones')
        .insert({ modulo_id: moduloId, titulo, orden: orden ?? 0, bloques: [] })
        .select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ leccion });
    }

    if (action === 'admin_updateLeccion') {
      const { leccionId, titulo, orden, bloques } = data;
      const updates = {};
      if (titulo  !== undefined) updates.titulo  = titulo;
      if (orden   !== undefined) updates.orden   = orden;
      if (bloques !== undefined) updates.bloques = bloques;
      const { data: leccion, error } = await db.from('lecciones')
        .update(updates).eq('id', leccionId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ leccion });
    }

    if (action === 'admin_deleteLeccion') {
      const { error } = await db.from('lecciones').delete().eq('id', data.leccionId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    if (action === 'admin_listInscripciones') {
      const { cursoId } = data;
      const { data: inscripciones, error } = await db.from('inscripciones')
        .select('*').eq('curso_id', cursoId).order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ inscripciones });
    }
  }

  // ── STUDENT ACTIONS ───────────────────────────────────────────────────────────

  if (action === 'checkAcceso') {
    const curso = await getCursoBySlugOrId(db, data);
    if (!curso) return res.json({ tieneAcceso: false });
    const nivelRequerido = curso.nivel_requerido || 1;
    const nivelUsuario   = await getUserLevel(db, userId);
    if (nivelUsuario < nivelRequerido) {
      return res.json({ tieneAcceso: false, nivelSuficiente: false, nivelRequerido, nivelUsuario });
    }
    const { data: insc } = await db.from('inscripciones')
      .select('id').eq('user_id', userId).eq('curso_id', curso.id)
      .gt('expira_at', new Date().toISOString()).maybeSingle();
    return res.json({ tieneAcceso: !!insc, nivelSuficiente: true, nivelRequerido, nivelUsuario });
  }

  if (action === 'getPlayerData') {
    const curso = await getCursoBySlugOrId(db, data);
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const nivelRequerido = curso.nivel_requerido || 1;
    const nivelUsuario   = await getUserLevel(db, userId);
    if (nivelUsuario < nivelRequerido) {
      return res.status(403).json({ error: 'Nivel insuficiente', needsLevel: true, nivelRequerido, nivelUsuario, curso });
    }

    const { data: inscripcion } = await db.from('inscripciones')
      .select('*')
      .eq('user_id', userId)
      .eq('curso_id', curso.id)
      .gt('expira_at', new Date().toISOString())
      .maybeSingle();

    if (!inscripcion) {
      return res.status(403).json({ error: 'Sin acceso', needsEnrollment: true, curso });
    }

    const { data: modulos } = await db.from('modulos')
      .select('*, lecciones(*)')
      .eq('curso_id', curso.id)
      .order('orden');
    (modulos || []).forEach(m => m.lecciones?.sort((a, b) => a.orden - b.orden));

    const allIds = (modulos || []).flatMap(m => (m.lecciones || []).map(l => l.id));
    const { data: progreso } = allIds.length
      ? await db.from('progreso_lecciones').select('leccion_id').eq('user_id', userId).in('leccion_id', allIds)
      : { data: [] };

    return res.json({
      curso,
      modulos: modulos || [],
      inscripcion,
      completadas: (progreso || []).map(p => p.leccion_id),
    });
  }

  if (action === 'inscribirse') {
    const { nombre, telefono, slug, cursoId } = data;
    const curso = await getCursoBySlugOrId(db, { slug, cursoId });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const expira_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inscripcion, error } = await db.from('inscripciones')
      .upsert(
        { user_id: userId, curso_id: curso.id, nombre, telefono, expira_at },
        { onConflict: 'user_id,curso_id' }
      )
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ inscripcion });
  }

  if (action === 'marcarCompleta') {
    const { leccionId } = data;
    const { error } = await db.from('progreso_lecciones')
      .upsert({ user_id: userId, leccion_id: leccionId }, { onConflict: 'user_id,leccion_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  if (action === 'desmarcarCompleta') {
    const { leccionId } = data;
    const { error } = await db.from('progreso_lecciones')
      .delete().eq('user_id', userId).eq('leccion_id', leccionId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: 'Action desconocida: ' + action });
};
