export const LEVELS = [
  { level: 1,  min: 0,    name: 'Semilla',            color: '#BDBDBD', unlocks: [] },
  { level: 2,  min: 5,    name: 'Brote',              color: '#8BC34A', unlocks: ['Biblioteca de Recetas Básicas', 'Guía de Ingredientes Naturales'] },
  { level: 3,  min: 25,   name: 'Aprendiz',           color: '#4CAF50', unlocks: ['Recetas Exclusivas de la Comunidad'] },
  { level: 4,  min: 75,   name: 'Practicante',        color: '#26A69A', unlocks: ['Taller Grabado: Jabones Artesanales', 'Guía de Proveedores MX'] },
  { level: 5,  min: 150,  name: 'Formulador',         color: '#B08968', unlocks: ['Fórmulas Avanzadas: Serums y Activos'] },
  { level: 6,  min: 300,  name: 'Alquimista',         color: '#8B7355', unlocks: ['Masterclass: Cosmética Sólida Zero Waste'] },
  { level: 7,  min: 500,  name: 'Maestro Alquimista', color: '#5D4037', unlocks: ['Mentorías en Grupo Mensuales'] },
  { level: 8,  min: 1000, name: 'Gran Maestro',       color: '#4A3F35', unlocks: ['Acceso Anticipado a Nuevos Talleres'] },
  { level: 9,  min: 1600, name: 'Sabio',              color: '#2D3461', unlocks: ['Badge Verificado de Experto'] },
  { level: 10, min: 2500, name: 'Leyenda Alquimista', color: '#1A237E', unlocks: ['Hall of Fame de la Comunidad 👑'] },
];

export function getLevel(pts) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}
