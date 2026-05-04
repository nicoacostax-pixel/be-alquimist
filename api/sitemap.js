const { createClient } = require('@supabase/supabase-js');

const DOMAIN = 'https://bealquimist.com';

const STATIC_PAGES = [
  { url: '/',           priority: '1.0', changefreq: 'weekly'  },
  { url: '/insumos',    priority: '0.9', changefreq: 'daily'   },
  { url: '/comunidad',  priority: '0.7', changefreq: 'daily'   },
  { url: '/biblioteca', priority: '0.7', changefreq: 'weekly'  },
  { url: '/pro',        priority: '0.8', changefreq: 'monthly' },
];

const CATEGORIAS = [
  'aceites','aceites-esenciales','aditamentos','hidrolatos-y-aguas-florales',
  'aromas','antioxidantes','bases-de-jabon','ceras-y-mantecas','conservantes',
  'colorantes','emulsionantes','extractos-y-activos','hierbas-secas','tensioactivos','polvos',
];

function toSlug(value = '') {
  return value.toLowerCase().replace(/\s+/g, '-');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const sbUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  let productos = [];
  if (sbUrl && sbKey) {
    try {
      const sb = createClient(sbUrl, sbKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const { data } = await sb.from('productos').select('slug, categoria, updated_at');
      productos = data || [];
    } catch (e) {
      console.error('Sitemap: error fetching products', e.message);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${DOMAIN}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
    <lastmod>${today}</lastmod>
  </url>`),
    ...CATEGORIAS.map(cat => `
  <url>
    <loc>${DOMAIN}/insumos/${cat}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${today}</lastmod>
  </url>`),
    ...productos.map(p => {
      const cat = toSlug((p.categoria || '').split(',')[0].trim());
      const lastmod = p.updated_at ? p.updated_at.split('T')[0] : today;
      return `
  <url>
    <loc>${DOMAIN}/insumos/${cat}/${p.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
