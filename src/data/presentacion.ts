export type PresentationVisualKey =
  | "intro"
  | "control"
  | "map"
  | "database"
  | "catalysts"
  | "buyers"
  | "campaigns"
  | "electronics"
  | "technology"
  | "closing";

export type PresentationSlide = {
  id: string;
  step: string;
  title: string;
  summary: string;
  paragraphs?: string[];
  bullets?: string[];
  visual: PresentationVisualKey;
};

export type DemoMapClient = {
  _id: string;
  name: string;
  contactName?: string;
  buyerName?: string;
  phone?: string;
  lat: number;
  lng: number;
  address?: string;
  cedula?: string;
};

export type DemoCommercialRow = {
  name: string;
  zone: string;
  contact: string;
  type: string;
  buyer: string;
  status: string;
  history: string;
};

export type DemoPurchaseRow = {
  supplier: string;
  category: string;
  item: string;
  weight: string;
  price: string;
  lot: string;
  photoTone: "steel" | "graphite" | "amber" | "ceramic" | "oxide";
  photoNote: string;
};

export type DemoBuyerRow = {
  buyer: string;
  balance: string;
  approved: string;
  pending: string;
  lastPurchase: string;
};

export type DemoCampaignRow = {
  zone: string;
  audience: string;
  message: string;
};

export type DemoElectronicsRow = {
  company: string;
  area: string;
  material: string;
  status: string;
};

export const presentacionSlides: PresentationSlide[] = [
  {
    id: "intro",
    step: "01",
    title: "Cada catalizador tiene una historia.",
    summary:
      "El objetivo de PMG Metales es construir un historial completo y verificable de cada catalizador, desde su compra hasta su venta.",
    paragraphs: [
      "Cada compra queda registrada para conectar proveedor, pieza, lote, comprador y continuidad comercial dentro de una sola operación.",
    ],
    visual: "intro",
  },
  {
    id: "catalysts",
    step: "02",
    title: "La compra se registra en campo.",
    summary: "Cada pieza queda documentada con fotografía, peso, proveedor, valor y lote dentro del mismo registro.",
    paragraphs: [
      "La sensación debe ser la de una compra real entrando al sistema con evidencia física y trazabilidad inmediata.",
    ],
    visual: "catalysts",
  },
  {
    id: "control",
    step: "03",
    title: "El lote empieza a vivir.",
    summary: "La compra cambia el área de control: volumen, kilos, inversión e historial.",
    paragraphs: [
      "Cada pieza ya altera una operación completa, no solo un registro aislado.",
    ],
    visual: "control",
  },
  {
    id: "map",
    step: "04",
    title: "La red comercial se enciende.",
    summary: "El proveedor queda visible en base de datos y el mapa muestra dónde ocurre el abastecimiento.",
    paragraphs: [
      "La geografía, la base de datos y el seguimiento comercial trabajan juntos.",
    ],
    visual: "map",
  },
  {
    id: "buyers",
    step: "05",
    title: "El comprador recibe la asignación.",
    summary: "Saldo operativo, pendiente por aprobar y últimas compras cambian con el lote.",
    paragraphs: [
      "La compra ya tiene responsable, dinero asignado y trazabilidad completa.",
    ],
    visual: "buyers",
  },
  {
    id: "campaigns",
    step: "06",
    title: "La comunicación sostiene el abastecimiento.",
    summary: "La campaña sale por zona, activa respuestas y mantiene la red comercial en movimiento.",
    paragraphs: [
      "No son mensajes sueltos: es continuidad comercial administrada.",
    ],
    visual: "campaigns",
  },
  {
    id: "database",
    step: "07",
    title: "La empresa recuerda todo.",
    summary: "Cliente, zona, comprador, historial y recompra quedan conectados dentro del mismo sistema.",
    paragraphs: [
      "La memoria operativa permite crecer sin perder contexto ni relaciones.",
    ],
    visual: "database",
  },
  {
    id: "closing",
    step: "08",
    title: "La operación está viva.",
    summary:
      "Lo importante no es la interfaz: es la empresa trabajando detrás de ella.",
    paragraphs: [
      "No competimos por comprar una pieza más. Construimos una red de abastecimiento basada en información, relaciones comerciales y procesos.",
    ],
    visual: "closing",
  },
];

export const demoMapClients: DemoMapClient[] = [
  {
    _id: "cli-01",
    name: "Taller Vía Brasil",
    contactName: "Carlos Mena",
    buyerName: "Richard",
    phone: "+507 6721 9834",
    lat: 8.9829,
    lng: -79.5197,
    address: "Vía Brasil, Panamá",
    cedula: "8-912-144",
  },
  {
    _id: "cli-02",
    name: "Soldaduras Pacífico",
    contactName: "Joel Ramos",
    buyerName: "Richard",
    phone: "+507 6673 1091",
    lat: 8.9898,
    lng: -79.5342,
    address: "Pueblo Nuevo, Panamá",
    cedula: "8-881-552",
  },
  {
    _id: "cli-03",
    name: "Recicladora Arraiján",
    contactName: "Marta López",
    buyerName: "Kenny",
    phone: "+507 6502 6120",
    lat: 8.9512,
    lng: -79.6614,
    address: "Arraiján Cabecera",
    cedula: "8-744-281",
  },
  {
    _id: "cli-04",
    name: "Chatarrería Colón Norte",
    contactName: "Raúl Pitti",
    buyerName: "Kenny",
    phone: "+507 6962 3314",
    lat: 9.3579,
    lng: -79.901,
    address: "Colón",
    cedula: "3-155-990",
  },
  {
    _id: "cli-05",
    name: "Centro de Escape Chorrera",
    contactName: "Javier Díaz",
    buyerName: "Richard",
    phone: "+507 6229 5531",
    lat: 8.8802,
    lng: -79.7842,
    address: "La Chorrera",
    cedula: "8-778-310",
  },
  {
    _id: "cli-06",
    name: "Taller Tocumen Diesel",
    contactName: "Luis Paredes",
    buyerName: "Richard",
    phone: "+507 6466 2012",
    lat: 9.0789,
    lng: -79.3847,
    address: "Tocumen, Panamá",
    cedula: "8-801-102",
  },
  {
    _id: "cli-07",
    name: "Repuestos San Miguelito",
    contactName: "Diana Castillo",
    buyerName: "Richard",
    phone: "+507 6542 7710",
    lat: 9.0315,
    lng: -79.5034,
    address: "San Miguelito, Panamá",
    cedula: "8-623-511",
  },
  {
    _id: "cli-08",
    name: "Centro de Escape Juan Díaz",
    contactName: "Pedro Ortega",
    buyerName: "Richard",
    phone: "+507 6611 8920",
    lat: 9.0164,
    lng: -79.4492,
    address: "Juan Díaz, Panamá",
    cedula: "8-709-902",
  },
  {
    _id: "cli-09",
    name: "Metalúrgica Vista Alegre",
    contactName: "Nadia Gómez",
    buyerName: "Kenny",
    phone: "+507 6264 4418",
    lat: 8.8876,
    lng: -79.7327,
    address: "Vista Alegre, Panamá Oeste",
    cedula: "8-588-337",
  },
  {
    _id: "cli-10",
    name: "Patio Industrial Chilibre",
    contactName: "Efraín Arosemena",
    buyerName: "Kenny",
    phone: "+507 6688 1027",
    lat: 9.1564,
    lng: -79.6178,
    address: "Chilibre, Panamá Norte",
    cedula: "8-431-775",
  },
];

export const demoCommercialRows: DemoCommercialRow[] = [
  {
    name: "Taller Vía Brasil",
    zone: "Panamá Metro",
    contact: "Carlos Mena",
    type: "Taller / catalizadores",
    buyer: "Richard",
    status: "Seguimiento activo",
    history: "4 compras registradas",
  },
  {
    name: "Soldaduras Pacífico",
    zone: "Panamá Metro",
    contact: "Joel Ramos",
    type: "Soldador",
    buyer: "Richard",
    status: "Visita programada",
    history: "2 compras registradas",
  },
  {
    name: "Recicladora Arraiján",
    zone: "Arraiján + Chorrera",
    contact: "Marta López",
    type: "Reciclador",
    buyer: "Kenny",
    status: "Contacto estable",
    history: "7 compras registradas",
  },
  {
    name: "Chatarrería Colón Norte",
    zone: "Colón",
    contact: "Raúl Pitti",
    type: "Chatarrero",
    buyer: "Kenny",
    status: "Prospecto calificado",
    history: "1 visita de campo",
  },
  {
    name: "Empresa Técnica del Istmo",
    zone: "Panamá Metro",
    contact: "Andrea Batista",
    type: "Empresa / electrónicos",
    buyer: "Richard",
    status: "Revisión interna",
    history: "Área de activos identificada",
  },
  {
    name: "Taller Tocumen Diesel",
    zone: "Tocumen",
    contact: "Luis Paredes",
    type: "Taller / diésel",
    buyer: "Richard",
    status: "Ruta activa",
    history: "3 compras registradas",
  },
  {
    name: "Repuestos San Miguelito",
    zone: "San Miguelito",
    contact: "Diana Castillo",
    type: "Repuestos / catalizadores",
    buyer: "Richard",
    status: "Seguimiento semanal",
    history: "5 compras registradas",
  },
  {
    name: "Centro de Escape Juan Díaz",
    zone: "Juan Díaz",
    contact: "Pedro Ortega",
    type: "Centro de escape",
    buyer: "Richard",
    status: "Proveedor recurrente",
    history: "6 compras registradas",
  },
  {
    name: "Metalúrgica Vista Alegre",
    zone: "Vista Alegre",
    contact: "Nadia Gómez",
    type: "Reciclador",
    buyer: "Kenny",
    status: "Visita cerrada",
    history: "2 compras registradas",
  },
  {
    name: "Patio Industrial Chilibre",
    zone: "Panamá Norte",
    contact: "Efraín Arosemena",
    type: "Patio industrial",
    buyer: "Kenny",
    status: "Nuevo frente activo",
    history: "1 compra registrada",
  },
];

export const demoPurchaseRows: DemoPurchaseRow[] = [
  {
    supplier: "Taller Vía Brasil",
    category: "Catalizador",
    item: "Toyota Hilux OEM",
    weight: "4.8 kg",
    price: "$420",
    lot: "PA-042",
    photoTone: "steel",
    photoNote: "Pieza completa con carcasa OEM",
  },
  {
    supplier: "Centro de Escape Chorrera",
    category: "Catalizador",
    item: "Ford Ranger",
    weight: "3.9 kg",
    price: "$330",
    lot: "PA-042",
    photoTone: "graphite",
    photoNote: "Entrada lateral y cuerpo usado",
  },
  {
    supplier: "Recicladora Arraiján",
    category: "Cerámica suelta",
    item: "Honeycomb mixto",
    weight: "18.6 kg",
    price: "$1,180",
    lot: "PA-042",
    photoTone: "ceramic",
    photoNote: "Material recuperado por lote",
  },
  {
    supplier: "Chatarrería Colón Norte",
    category: "Catalizador",
    item: "Nissan Frontier",
    weight: "5.1 kg",
    price: "$390",
    lot: "PA-042",
    photoTone: "amber",
    photoNote: "Pieza completa con desgaste visible",
  },
  {
    supplier: "Taller Tocumen Diesel",
    category: "Catalizador",
    item: "Isuzu NPR",
    weight: "4.2 kg",
    price: "$360",
    lot: "PA-042",
    photoTone: "oxide",
    photoNote: "Catalizador comercial de ruta",
  },
];

export const demoBuyerRows: DemoBuyerRow[] = [
  {
    buyer: "Richard",
    balance: "$6,450",
    approved: "$1,800",
    pending: "$320",
    lastPurchase: "Toyota Hilux OEM",
  },
  {
    buyer: "Kenny",
    balance: "$4,980",
    approved: "$1,200",
    pending: "$150",
    lastPurchase: "Honeycomb mixto",
  },
];

export const demoCampaignRows: DemoCampaignRow[] = [
  {
    zone: "Panamá Metro",
    audience: "42 contactos válidos",
    message: "Seguimos activos en compras de catalizadores y cerámica. Si tienes material disponible, coordinamos revisión o visita.",
  },
  {
    zone: "Colón",
    audience: "18 contactos válidos",
    message: "Estamos organizando ruta comercial en Colón para compras y seguimiento de materiales disponibles.",
  },
  {
    zone: "Arraiján + La Chorrera",
    audience: "26 contactos válidos",
    message: "Reforzamos contacto con talleres y centros de escape para continuidad de abastecimiento en la zona oeste.",
  },
  {
    zone: "David",
    audience: "12 contactos válidos",
    message: "Mantenemos monitoreo comercial para ampliar cobertura en el occidente del país.",
  },
  {
    zone: "Interior",
    audience: "21 contactos válidos",
    message: "Seguimiento por región para mantener activa la red comercial fuera de Panamá Metro.",
  },
  {
    zone: "Todos Panamá",
    audience: "119 contactos válidos",
    message: "Campaña general para continuidad comercial, recordación y abastecimiento organizado.",
  },
];

export const demoElectronicsRows: DemoElectronicsRow[] = [
  {
    company: "Empresa Técnica del Istmo",
    area: "Activos fijos",
    material: "Tarjetas industriales",
    status: "Contacto identificado",
  },
  {
    company: "Grupo Logístico Panamá",
    area: "Compras",
    material: "Tarjetas de control",
    status: "Seguimiento en curso",
  },
  {
    company: "Zona Franca Pacífico",
    area: "Gestión ambiental",
    material: "Residuos electrónicos mixtos",
    status: "Ruta de entrada definida",
  },
  {
    company: "Planta Técnica Colón",
    area: "Mantenimiento",
    material: "Boards de equipos fuera de servicio",
    status: "Primera visita pendiente",
  },
];
