const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function migrate() {
  // 1. Distribuidoras existentes
  const { data: distribuidoras } = await supabase
    .from('distribuidoras')
    .select('email, telefono');

  if (distribuidoras?.length) {
    const rows = distribuidoras.map(d => ({
      email: d.email,
      telefono: d.telefono || '',
      tipo: 'distribuidora',
    }));
    const { error } = await supabase.from('leads').insert(rows);
    console.log(`Distribuidoras migradas: ${rows.length}`, error?.message || 'OK');
  }

  // 2. Usuarios registrados (perfiles)
  const { data: perfiles } = await supabase
    .from('perfiles')
    .select('email');

  if (perfiles?.length) {
    const rows = perfiles.map(p => ({
      email: p.email,
      telefono: '',
      tipo: 'usuario_nuevo',
    }));
    const { error } = await supabase.from('leads').insert(rows);
    console.log(`Usuarios migrados: ${rows.length}`, error?.message || 'OK');
  }
}

migrate().catch(console.error);
