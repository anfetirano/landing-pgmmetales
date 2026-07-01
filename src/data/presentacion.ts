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
    title: "PMG Metales Panamá",
    summary:
      "Operación organizada para el abastecimiento de catalizadores usados y tarjetas electrónicas.",
    paragraphs: [
      "Combinamos trabajo de campo, tecnología y administración de datos para desarrollar una red confiable de abastecimiento en Panamá.",
    ],
    visual: "intro",
  },
  {
    id: "control",
    step: "02",
    title: "Área de Control",
    summary: "Cada compra queda registrada dentro de una estructura operativa por lote.",
    paragraphs: [
      "Esto nos permite controlar volumen, inversión, historial y evolución del abastecimiento.",
    ],
    visual: "control",
  },
  {
    id: "map",
    step: "03",
    title: "Red comercial en mapa",
    summary: "Cada punto representa una oportunidad comercial identificada.",
    paragraphs: [
      "La información geográfica nos permite planificar rutas, zonas de crecimiento y seguimiento comercial.",
    ],
    visual: "map",
  },
  {
    id: "database",
    step: "04",
    title: "Base de datos comercial",
    summary: "Nuestro fuerte está en la administración de base de datos.",
    paragraphs: [
      "No trabajamos con información dispersa.",
      "Cada contacto queda organizado para seguimiento, recompra y crecimiento comercial.",
    ],
    visual: "database",
  },
  {
    id: "catalysts",
    step: "05",
    title: "Compras y catalizadores usados",
    summary: "Cada compra registra proveedor, foto, material y lote.",
    paragraphs: [
      "La operación convierte relaciones informales en un proceso trazable y repetible.",
    ],
    visual: "catalysts",
  },
  {
    id: "buyers",
    step: "06",
    title: "Control de compradores",
    summary: "Saldo operativo, gasto aprobado y últimas compras en una sola vista.",
    paragraphs: [
      "La plataforma permite registrar movimientos, compras, gastos y saldos para evitar pérdida de control en campo.",
    ],
    visual: "buyers",
  },
  {
    id: "campaigns",
    step: "07",
    title: "Campañas WhatsApp",
    summary: "Segmentos por zona, plantillas y comunicación recurrente.",
    paragraphs: [
      "Podemos dar seguimiento por zona y mantener contacto constante con proveedores sin depender de mensajes aislados.",
    ],
    visual: "campaigns",
  },
  {
    id: "closing",
    step: "08",
    title: "Aliado estratégico",
    summary:
      "Una operación organizada para catalizadores usados y tarjetas electrónicas.",
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
];

export const demoPurchaseRows: DemoPurchaseRow[] = [
  {
    supplier: "Taller Vía Brasil",
    category: "Catalizador",
    item: "Toyota Hilux OEM",
    weight: "4.8 kg",
    price: "$420",
    lot: "PA-042",
  },
  {
    supplier: "Centro de Escape Chorrera",
    category: "Catalizador",
    item: "Ford Ranger",
    weight: "3.9 kg",
    price: "$330",
    lot: "PA-042",
  },
  {
    supplier: "Recicladora Arraiján",
    category: "Cerámica suelta",
    item: "Honeycomb mixto",
    weight: "18.6 kg",
    price: "$1,180",
    lot: "PA-042",
  },
  {
    supplier: "Chatarrería Colón Norte",
    category: "Catalizador",
    item: "Nissan Frontier",
    weight: "5.1 kg",
    price: "$390",
    lot: "PA-042",
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
