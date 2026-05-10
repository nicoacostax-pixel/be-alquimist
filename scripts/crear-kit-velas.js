require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('productos').insert({
    nombre: 'Kit de Velas de Soya',
    slug: 'kit-de-velas-de-soya',
    categoria: '',
    imagen_url: '/KIT.jpg',
    descripcion: 'Kit completo para aprender a hacer velas de soya desde cero con todos los materiales incluidos.',
    variantes: [{ nombre: 'Estándar', precio: 1499, peso: 1 }],
  }).select();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Producto creado:', data[0]?.nombre);
  }
}

main();
