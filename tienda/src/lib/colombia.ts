/**
 * Departamentos y municipios para los dos selectores dependientes del checkout
 * (SPEC §4.5: "lista desplegable, no texto libre").
 *
 * LISTA CURADA, NO EXHAUSTIVA. Colombia tiene 1.104 municipios; aqui estan los 32
 * departamentos y Bogotá D.C., cada uno con su capital y los municipios donde se
 * concentran las compras y la cobertura de las transportadoras. El Valle de
 * Aburrá va completo (sus diez municipios definen la tarifa metropolitana, ver
 * `CONFIG_POR_DEFECTO.ciudadesMetro`). Si una clienta no encuentra su municipio,
 * se agrega aqui — no se abre un campo de texto libre, que es lo que rompe la
 * tarifa y la guía.
 *
 * Los nombres van como los escribe la gente y la transportadora ("Cartagena",
 * "Mompox"), con tildes: `envioPara` compara sin tildes ni mayúsculas.
 * Pura data, sin dependencias: se usa igual en servidor y en cliente.
 */

export type Departamento = { nombre: string; municipios: readonly string[] }

export const DEPARTAMENTOS: readonly Departamento[] = [
  { nombre: 'Amazonas', municipios: ['Leticia', 'Puerto Nariño'] },
  {
    nombre: 'Antioquia',
    municipios: [
      // Valle de Aburrá, completo
      'Medellín',
      'Barbosa',
      'Bello',
      'Caldas',
      'Copacabana',
      'Envigado',
      'Girardota',
      'Itagüí',
      'La Estrella',
      'Sabaneta',
      // Resto del departamento
      'Amagá',
      'Andes',
      'Apartadó',
      'Carepa',
      'Caucasia',
      'Chigorodó',
      'Ciudad Bolívar',
      'Don Matías',
      'El Carmen de Viboral',
      'El Retiro',
      'El Santuario',
      'Fredonia',
      'Guarne',
      'Guatapé',
      'Jardín',
      'Jericó',
      'La Ceja',
      'La Unión',
      'Marinilla',
      'Necoclí',
      'Puerto Berrío',
      'Rionegro',
      'San Jerónimo',
      'San Pedro de los Milagros',
      'Santa Fe de Antioquia',
      'Santa Rosa de Osos',
      'Segovia',
      'Sonsón',
      'Sopetrán',
      'Turbo',
      'Urrao',
      'Yarumal',
    ],
  },
  { nombre: 'Arauca', municipios: ['Arauca', 'Arauquita', 'Fortul', 'Saravena', 'Tame'] },
  {
    nombre: 'Atlántico',
    municipios: [
      'Barranquilla',
      'Baranoa',
      'Galapa',
      'Malambo',
      'Puerto Colombia',
      'Sabanagrande',
      'Sabanalarga',
      'Santo Tomás',
      'Soledad',
    ],
  },
  { nombre: 'Bogotá D.C.', municipios: ['Bogotá'] },
  {
    nombre: 'Bolívar',
    municipios: [
      'Cartagena',
      'Arjona',
      'El Carmen de Bolívar',
      'Magangué',
      'María La Baja',
      'Mompox',
      'San Juan Nepomuceno',
      'Turbaco',
    ],
  },
  {
    nombre: 'Boyacá',
    municipios: [
      'Tunja',
      'Chiquinquirá',
      'Duitama',
      'Garagoa',
      'Moniquirá',
      'Nobsa',
      'Paipa',
      'Puerto Boyacá',
      'Samacá',
      'Sogamoso',
      'Villa de Leyva',
    ],
  },
  {
    nombre: 'Caldas',
    municipios: [
      'Manizales',
      'Aguadas',
      'Anserma',
      'Chinchiná',
      'La Dorada',
      'Neira',
      'Riosucio',
      'Salamina',
      'Supía',
      'Villamaría',
    ],
  },
  {
    nombre: 'Caquetá',
    municipios: ['Florencia', 'Belén de los Andaquíes', 'El Doncello', 'Puerto Rico', 'San Vicente del Caguán'],
  },
  {
    nombre: 'Casanare',
    municipios: ['Yopal', 'Aguazul', 'Monterrey', 'Paz de Ariporo', 'Tauramena', 'Villanueva'],
  },
  {
    nombre: 'Cauca',
    municipios: [
      'Popayán',
      'El Bordo',
      'El Tambo',
      'Guapi',
      'Piendamó',
      'Puerto Tejada',
      'Santander de Quilichao',
      'Silvia',
    ],
  },
  {
    nombre: 'Cesar',
    municipios: [
      'Valledupar',
      'Agustín Codazzi',
      'Aguachica',
      'Bosconia',
      'Chimichagua',
      'Curumaní',
      'La Jagua de Ibirico',
    ],
  },
  {
    nombre: 'Chocó',
    municipios: ['Quibdó', 'Acandí', 'Bahía Solano', 'Condoto', 'Istmina', 'Nuquí', 'Tadó'],
  },
  {
    nombre: 'Córdoba',
    municipios: [
      'Montería',
      'Cereté',
      'Ciénaga de Oro',
      'Lorica',
      'Montelíbano',
      'Planeta Rica',
      'Sahagún',
      'Tierralta',
    ],
  },
  {
    nombre: 'Cundinamarca',
    municipios: [
      'Anapoima',
      'Cajicá',
      'Chía',
      'Cota',
      'Facatativá',
      'Funza',
      'Fusagasugá',
      'Gachancipá',
      'Girardot',
      'Guaduas',
      'La Calera',
      'La Mesa',
      'Madrid',
      'Mosquera',
      'Sibaté',
      'Soacha',
      'Sopó',
      'Tabio',
      'Tenjo',
      'Tocancipá',
      'Ubaté',
      'Villeta',
      'Zipaquirá',
    ],
  },
  { nombre: 'Guainía', municipios: ['Inírida'] },
  { nombre: 'Guaviare', municipios: ['San José del Guaviare', 'Calamar', 'El Retorno'] },
  {
    nombre: 'Huila',
    municipios: ['Neiva', 'Campoalegre', 'Garzón', 'Gigante', 'La Plata', 'Pitalito', 'Rivera', 'San Agustín'],
  },
  {
    nombre: 'La Guajira',
    municipios: [
      'Riohacha',
      'Albania',
      'Fonseca',
      'Maicao',
      'Manaure',
      'San Juan del Cesar',
      'Uribia',
      'Villanueva',
    ],
  },
  {
    nombre: 'Magdalena',
    municipios: ['Santa Marta', 'Aracataca', 'Ciénaga', 'El Banco', 'Fundación', 'Plato', 'Zona Bananera'],
  },
  {
    nombre: 'Meta',
    municipios: [
      'Villavicencio',
      'Acacías',
      'Cumaral',
      'Granada',
      'Puerto Gaitán',
      'Puerto López',
      'Restrepo',
      'San Martín',
    ],
  },
  {
    nombre: 'Nariño',
    municipios: ['Pasto', 'Ipiales', 'La Unión', 'Samaniego', 'Sandoná', 'Tumaco', 'Túquerres'],
  },
  {
    nombre: 'Norte de Santander',
    municipios: [
      'Cúcuta',
      'Chinácota',
      'El Zulia',
      'Los Patios',
      'Ocaña',
      'Pamplona',
      'Tibú',
      'Villa del Rosario',
    ],
  },
  {
    nombre: 'Putumayo',
    municipios: ['Mocoa', 'Orito', 'Puerto Asís', 'Sibundoy', 'Valle del Guamuez', 'Villagarzón'],
  },
  {
    nombre: 'Quindío',
    municipios: ['Armenia', 'Calarcá', 'Circasia', 'Filandia', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Salento'],
  },
  {
    nombre: 'Risaralda',
    municipios: [
      'Pereira',
      'Belén de Umbría',
      'Dosquebradas',
      'La Virginia',
      'Marsella',
      'Quinchía',
      'Santa Rosa de Cabal',
    ],
  },
  { nombre: 'San Andrés y Providencia', municipios: ['San Andrés', 'Providencia'] },
  {
    nombre: 'Santander',
    municipios: [
      'Bucaramanga',
      'Barbosa',
      'Barrancabermeja',
      'Floridablanca',
      'Girón',
      'Lebrija',
      'Málaga',
      'Piedecuesta',
      'Sabana de Torres',
      'San Gil',
      'Socorro',
      'Vélez',
    ],
  },
  {
    nombre: 'Sucre',
    municipios: ['Sincelejo', 'Corozal', 'Coveñas', 'Sampués', 'San Marcos', 'San Onofre', 'Sincé', 'Tolú'],
  },
  {
    nombre: 'Tolima',
    municipios: [
      'Ibagué',
      'Chaparral',
      'Espinal',
      'Flandes',
      'Guamo',
      'Honda',
      'Lérida',
      'Líbano',
      'Mariquita',
      'Melgar',
    ],
  },
  {
    nombre: 'Valle del Cauca',
    municipios: [
      'Cali',
      'Buenaventura',
      'Buga',
      'Candelaria',
      'Cartago',
      'Dagua',
      'El Cerrito',
      'Florida',
      'Ginebra',
      'Jamundí',
      'Palmira',
      'Pradera',
      'Roldanillo',
      'Sevilla',
      'Tuluá',
      'Yumbo',
      'Zarzal',
    ],
  },
  { nombre: 'Vaupés', municipios: ['Mitú'] },
  { nombre: 'Vichada', municipios: ['Puerto Carreño', 'Cumaribo', 'La Primavera'] },
]

export function municipiosDe(departamento: string): readonly string[] {
  return DEPARTAMENTOS.find((d) => d.nombre === departamento)?.municipios ?? []
}

/** El servidor nunca confía en el select: la pareja tiene que existir en la lista. */
export function esMunicipioDe(departamento: string, ciudad: string): boolean {
  return municipiosDe(departamento).includes(ciudad)
}

/** Todos los nombres de municipio, sin repetir (hay homónimos: Barbosa, La Unión, Villanueva). */
export function todosLosMunicipios(): string[] {
  return [...new Set(DEPARTAMENTOS.flatMap((d) => d.municipios))]
}
