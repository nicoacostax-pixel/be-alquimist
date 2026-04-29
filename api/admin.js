const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

function adminClient() {
  const url  = process.env.REACT_APP_SUPABASE_URL  || process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verificar que viene del admin (email en sesión)
  const adminEmail = process.env.ADMIN_EMAIL || process.env.REACT_APP_ADMIN_EMAIL;
  const { action, token } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Falta action' });

  // Validar que el token pertenece a un admin
  try {
    const anonUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const anonClient = createClient(anonUrl, anonKey);
    const { data: { user }, error } = await anonClient.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'No autorizado' });
    if (adminEmail && user.email !== adminEmail) return res.status(403).json({ error: 'Acceso denegado' });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }

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
      const { id, ...fields } = req.body.producto;
      await sb.from('productos').update(fields).eq('id', id);
      return res.json({ ok: true });
    }

    // ── PEDIDOS (Stripe) ────────────────────────────────────────────
    if (action === 'getPedidos') {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return res.json({ pedidos: [] });
      const stripe = Stripe(stripeKey);
      const intents = await stripe.paymentIntents.list({ limit: 50 });
      const pedidos = intents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000).toISOString(),
        email: pi.receipt_email || '',
        metadata: pi.metadata,
      }));
      return res.json({ pedidos });
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

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
