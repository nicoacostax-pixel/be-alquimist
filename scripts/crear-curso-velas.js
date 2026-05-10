require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.from('productos').insert({
    nombre: 'Curso de Velas de Soya',
    slug: 'curso-de-velas-de-soya',
    precio: 200,
    peso: 1,
    categoria: '',
    imagen_url: '/Velas2.jpg',
    descripcion: 'Aprende a formular velas de soya desde cero con el equipo de Be Alquimist.',
    variantes: [],
  }).select();

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Producto creado:', data[0]?.nombre);
  }
}

main();
