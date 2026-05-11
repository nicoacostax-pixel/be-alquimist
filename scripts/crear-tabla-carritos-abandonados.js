require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Insertar un registro de prueba para forzar la creación si usamos upsert,
  // pero lo correcto es crear la tabla en Supabase SQL Editor con:
  console.log(`
  ── Ejecuta esto en el SQL Editor de Supabase ──

  create table if not exists carritos_abandonados (
    id          uuid primary key default gen_random_uuid(),
    email       text not null,
    telefono    text,
    origen      text,        -- 'checkout' | 'curso_velas'
    created_at  timestamptz default now()
  );

  alter table carritos_abandonados enable row level security;

  -- Solo service role puede leer/escribir
  create policy "service role full access"
    on carritos_abandonados
    using (false)
    with check (false);
  `);
}

main();
