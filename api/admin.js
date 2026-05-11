const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

function adminClient() {
  const url  = process.env.REACT_APP_SUPABASE_URL  || process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas');
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const adminEmail = process.env.ADMIN_EMAIL || process.env.REACT_APP_ADMIN_EMAIL;
  const { action, token } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Falta action' });

  // Validar token decodificando el JWT localmente
  const claims = decodeJwt(token);
  if (!claims?.email) return res.status(401).json({ error: 'Token inválido o expirado' });
  if (adminEmail && claims.email !== adminEmail) return res.status(403).json({ error: 'Acceso denegado: ' + claims.email });

  const sb = adminClient();

  try {
    // ── STATS ──────────────────────────────────────────────────────
    if (action === 'getStats') {
      const [
        { count: totalUsers },
        { count: proUsers },
        { count: totalPosts },
        { count: recetasPosts },
        { count: totalProductos },
        { count: totalComentarios },
      ] = await Promise.all([
        sb.from('perfiles').select('*', { count: 'exact', head: true }),
        sb.from('perfiles').select('*', { count: 'exact', head: true }).eq('es_pro', true),
        sb.from('posts').select('*', { count: 'exact', head: true }),
        sb.from('posts').select('*', { count: 'exact', head: true }).eq('categoria', 'Recetas'),
        sb.from('productos').select('*', { count: 'exact', head: true }),
        sb.from('post_comentarios').select('*', { count: 'exact', head: true }),
      ]);

      const { data: recentPosts } = await sb.from('posts')
        .select('created_at').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());

      const { data: recentUsers } = await sb.from('perfiles')
        .select('created_at').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString());

      return res.json({ totalUsers, proUsers, totalPosts, recetasPosts, totalProductos, totalComentarios, recentPosts: recentPosts?.length || 0, recentUsers: recentUsers?.length || 0 });
    }

    // ── USUARIOS ───────────────────────────────────────────────────
    if (action === 'getUsers') {
      const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 200 });
      const { data: perfiles } = await sb.from('perfiles').select('id, nombre, elementos, es_pro, created_at');
      const perfilesMap = Object.fromEntries((perfiles || []).map(p => [p.id, p]));
      const users = (authUsers?.users || []).map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        nombre: perfilesMap[u.id]?.nombre || '',
        elementos: perfilesMap[u.id]?.elementos ?? 3,
        es_pro: perfilesMap[u.id]?.es_pro || false,
      }));
      return res.json({ users });
    }

    if (action === 'updateUser') {
      const { userId, elementos, es_pro } = req.body;
      await sb.from('perfiles').upsert({ id: userId, elementos: Number(elementos), es_pro: !!es_pro });
      return res.json({ ok: true });
    }

    if (action === 'resetPassword') {
      const { email } = req.body;
      const anonUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
      const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      const anonClient = createClient(anonUrl, anonKey);
      await anonClient.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.SITE_URL || 'https://be-alquimist.vercel.app'}/login` });
      return res.json({ ok: true });
    }

    if (action === 'deleteUser') {
      const { userId } = req.body;
      await sb.auth.admin.deleteUser(userId);
      return res.json({ ok: true });
    }

    // ── PRODUCTOS ──────────────────────────────────────────────────
    if (action === 'getProductos') {
      const { data } = await sb.from('productos').select('*').order('created_at', { ascending: false });
      return res.json({ productos: data || [] });
    }

    if (action === 'deleteProducto') {
      const { id } = req.body;
      await sb.from('productos').delete().eq('id', id);
      return res.json({ ok: true });
    }

    if (action === 'updateProducto') {
      const { id, nombre, descripcion, categoria, variantes, slug, imagen, imagen_url: existingUrl } = req.body;
      let imagen_url = existingUrl || null;

      if (imagen?.data) {
        const buffer   = Buffer.from(imagen.data, 'base64');
        const fileName = `${Date.now()}.jpg`;
        const { error: upErr } = await sb.storage
          .from('ingredientes')
          .upload(fileName, buffer, { contentType: imagen.mimeType || 'image/jpeg', upsert: false });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('ingredientes').getPublicUrl(fileName);
          imagen_url = publicUrl;
        }
      }

      await sb.from('productos').update({ nombre, descripcion, categoria, variantes, slug, imagen_url }).eq('id', id);
      return res.json({ ok: true });
    }

    // ── PEDIDOS (Stripe) ────────────────────────────────────────────
    if (action === 'getPedidos') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return res.json({ pedidos: [] });
      const stripe = Stripe(stripeKey);
      const intents = await stripe.paymentIntents.list({ limit: 100, expand: ['data.latest_charge'] });

      const ids = intents.data.map(pi => pi.id);
      const { data: estados } = await sb.from('pedidos_estado').select('id, estado').in('id', ids);
      const estadoMap = {};
      (estados || []).forEach(e => { estadoMap[e.id] = e.estado; });

      const pedidos = intents.data.map(pi => {
        const charge = pi.latest_charge || {};
        const billing = charge.billing_details || {};
        const addr = billing.address || {};
        return {
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          estado: estadoMap[pi.id] || 'procesando',
          created: new Date(pi.created * 1000).toISOString(),
          email: billing.email || pi.receipt_email || pi.metadata?.email || '',
          nombre: billing.name || pi.metadata?.nombre || '',
          telefono: billing.phone || '',
          direccion: addr.line1 || '',
          apartamento: addr.line2 || '',
          ciudad: addr.city || '',
          estado_envio_dir: addr.state || '',
          cp: addr.postal_code || '',
          metadata: pi.metadata,
        };
      });
      return res.json({ pedidos });
    }

    if (action === 'updatePedidoEstado') {
      const { id, estado } = req.body;
      const ESTADOS = ['procesando', 'enviado', 'completado'];
      if (!id || !ESTADOS.includes(estado)) return res.status(400).json({ error: 'Datos inválidos' });
      const { error } = await sb.from('pedidos_estado').upsert({ id, estado, updated_at: new Date().toISOString() });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ ok: true });
    }

    // ── COMUNIDAD ──────────────────────────────────────────────────
    if (action === 'getPosts') {
      const { data } = await sb.from('posts')
        .select('id, titulo, contenido, categoria, created_at, usuario_id, perfiles(nombre)')
        .order('created_at', { ascending: false }).limit(50);
      return res.json({ posts: data || [] });
    }

    if (action === 'deletePost') {
      const { id } = req.body;
      await sb.from('post_comentarios').delete().eq('post_id', id);
      await sb.from('post_likes').delete().eq('post_id', id);
      await sb.from('posts').delete().eq('id', id);
      return res.json({ ok: true });
    }

    // ── BIBLIOTECA DE INGREDIENTES ────────────────────────────────
    if (action === 'getIngredientes') {
      const { data } = await sb.from('ingredientes').select('*').order('created_at', { ascending: false });
      return res.json({ ingredientes: data || [] });
    }

    if (action === 'createIngrediente') {
      const { nombre, descripcion, categoria, imagen } = req.body;
      let imagen_url = null;

      if (imagen?.data) {
        const buffer   = Buffer.from(imagen.data, 'base64');
        const fileName = `${Date.now()}.jpg`;
        const { error: upErr } = await sb.storage
          .from('ingredientes')
          .upload(fileName, buffer, { contentType: imagen.mimeType || 'image/jpeg', upsert: false });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('ingredientes').getPublicUrl(fileName);
          imagen_url = publicUrl;
        }
      }

      const { error } = await sb.from('ingredientes').insert({
        nombre, descripcion, categoria: categoria || 'General', imagen_url,
      });
      if (error) throw new Error(error.message);
      return res.json({ ok: true });
    }

    if (action === 'updateIngrediente') {
      const { id, nombre, descripcion, categoria, imagen, imagen_url: existingUrl } = req.body;
      let imagen_url = existingUrl || null;

      if (imagen?.data) {
        const buffer   = Buffer.from(imagen.data, 'base64');
        const fileName = `${Date.now()}.jpg`;
        const { error: upErr } = await sb.storage
          .from('ingredientes')
          .upload(fileName, buffer, { contentType: imagen.mimeType || 'image/jpeg', upsert: false });
        if (!upErr) {
          const { data: { publicUrl } } = sb.storage.from('ingredientes').getPublicUrl(fileName);
          imagen_url = publicUrl;
        }
      }

      await sb.from('ingredientes').update({ nombre, descripcion, categoria, imagen_url }).eq('id', id);
      return res.json({ ok: true });
    }

    if (action === 'deleteIngrediente') {
      const { id } = req.body;
      await sb.from('ingredientes').delete().eq('id', id);
      return res.json({ ok: true });
    }

    // ── LEADS ──────────────────────────────────────────────────────
    if (action === 'getLeads') {
      const { data } = await sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500);
      return res.json({ leads: data || [] });
    }

    // ── RECETAS IA ─────────────────────────────────────────────────
    if (action === 'getRecetas') {
      const { data: recetasData } = await sb.from('recetas').select('*').order('created_at', { ascending: false }).limit(200);
      const userIds = [...new Set((recetasData || []).map(r => r.user_id).filter(Boolean))];

      let perfilMap = {};
      let phoneMap  = {};

      if (userIds.length > 0) {
        // Nombres y teléfonos desde perfiles
        const { data: perfiles } = await sb.from('perfiles').select('id, nombre, telefono').in('id', userIds);
        perfilMap = Object.fromEntries((perfiles || []).map(p => [p.id, p.nombre]));
        phoneMap  = Object.fromEntries((perfiles || []).map(p => [p.id, p.telefono]));
      }

      const recetas = (recetasData || []).map(r => ({
        ...r,
        nombre_usuario: perfilMap[r.user_id] || '—',
        telefono:       phoneMap[r.user_id]  || '—',
      }));
      return res.json({ recetas });
    }

    if (action === 'getDistribuidoras') {
      const { data } = await sb.from('distribuidoras').select('*').order('created_at', { ascending: false }).limit(500);
      return res.json({ distribuidoras: data || [] });
    }

    if (action === 'getCarritosAbandonados') {
      const { data } = await sb.from('carritos_abandonados').select('*').order('created_at', { ascending: false }).limit(500);
      return res.json({ carritos: data || [] });
    }

    if (action === 'deleteCarritoAbandonado') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Falta id' });
      await sb.from('carritos_abandonados').delete().eq('id', id);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
