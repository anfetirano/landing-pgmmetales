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
  measurement: string;
  price: string;
  lot: string;
  photoUrl: string;
  note: string;
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
  {
    _id: "cli-11",
    name: "Auto Center Pacora",
    contactName: "Yadira González",
    buyerName: "Richard",
    phone: "+507 6554 9012",
    lat: 9.0846,
    lng: -79.2865,
    address: "Pacora, Panamá Este",
    cedula: "8-932-441",
  },
  {
    _id: "cli-12",
    name: "Autoservicio Cruce",
    contactName: "Manuel Ríos",
    buyerName: "Richard",
    phone: "+507 6328 1550",
    lat: 9.0118,
    lng: -79.4511,
    address: "Cerro Viento, Panamá",
    cedula: "8-721-390",
  },
  {
    _id: "cli-13",
    name: "Taller Central",
    contactName: "Marco Cedeño",
    buyerName: "Kenny",
    phone: "+507 6432 1099",
    lat: 9.0418,
    lng: -79.5004,
    address: "Pueblo Nuevo, Panamá",
    cedula: "8-654-208",
  },
  {
    _id: "cli-14",
    name: "Servicentro El Gigante",
    contactName: "Álvaro Batista",
    buyerName: "Richard",
    phone: "+507 6678 4401",
    lat: 9.0036,
    lng: -79.4806,
    address: "Río Abajo, Panamá",
    cedula: "8-603-774",
  },
  {
    _id: "cli-15",
    name: "Nueva Era",
    contactName: "Nicolás Rodríguez",
    buyerName: "Richard",
    phone: "+507 6548 2207",
    lat: 8.9971,
    lng: -79.5482,
    address: "Bethania, Panamá",
    cedula: "8-711-520",
  },
  {
    _id: "cli-16",
    name: "Sparks Motors",
    contactName: "Osvaldo Gómez",
    buyerName: "Richard",
    phone: "+507 6389 7440",
    lat: 9.0706,
    lng: -79.3748,
    address: "Tocumen, Panamá",
    cedula: "8-843-111",
  },
  {
    _id: "cli-17",
    name: "Rastro Autopartes",
    contactName: "Kevin Arosemena",
    buyerName: "Kenny",
    phone: "+507 6619 9033",
    lat: 9.0384,
    lng: -79.5272,
    address: "Vía España, Panamá",
    cedula: "8-574-920",
  },
  {
    _id: "cli-18",
    name: "Mechanical Workshop",
    contactName: "David Price",
    buyerName: "Richard",
    phone: "+507 6225 1147",
    lat: 9.0675,
    lng: -79.4203,
    address: "Parque Lefevre, Panamá",
    cedula: "PE-441-90",
  },
  {
    _id: "cli-19",
    name: "Luis Pueblo Nuevo",
    contactName: "Luis Moreno",
    buyerName: "Richard",
    phone: "+507 6451 8870",
    lat: 9.0412,
    lng: -79.4872,
    address: "Pueblo Nuevo, Panamá",
    cedula: "8-517-226",
  },
  {
    _id: "cli-20",
    name: "5 Hermanos",
    contactName: "Orlando Vega",
    buyerName: "Kenny",
    phone: "+507 6640 3328",
    lat: 8.9671,
    lng: -79.6718,
    address: "Arraiján, Panamá Oeste",
    cedula: "8-689-510",
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
  {
    name: "Auto Center Pacora",
    zone: "Pacora",
    contact: "Yadira González",
    type: "Taller / Hyundai",
    buyer: "Richard",
    status: "Compra reciente",
    history: "2 compras registradas",
  },
  {
    name: "Autoservicio Cruce",
    zone: "Cerro Viento",
    contact: "Manuel Ríos",
    type: "Taller / Toyota",
    buyer: "Richard",
    status: "Ruta activa",
    history: "1 compra registrada",
  },
  {
    name: "Servicentro El Gigante",
    zone: "Río Abajo",
    contact: "Álvaro Batista",
    type: "Centro de servicio",
    buyer: "Richard",
    status: "Seguimiento operativo",
    history: "1 compra registrada",
  },
  {
    name: "Nueva Era",
    zone: "Bethania",
    contact: "Nicolás Rodríguez",
    type: "Recompra / material suelto",
    buyer: "Richard",
    status: "Proveedor recurrente",
    history: "3 compras registradas",
  },
  {
    name: "Rastro Autopartes",
    zone: "Panamá Metro",
    contact: "Kevin Arosemena",
    type: "Autopartes / piezas",
    buyer: "Kenny",
    status: "Múltiples referencias",
    history: "5 compras registradas",
  },
  {
    name: "5 Hermanos",
    zone: "Arraiján",
    contact: "Orlando Vega",
    type: "Material suelto",
    buyer: "Kenny",
    status: "Volumen alto",
    history: "2 compras registradas",
  },
];

export const demoPurchaseRows: DemoPurchaseRow[] = [
  {
    supplier: "Servicentro El Gigante",
    category: "Material suelto",
    item: "Hyundai Accent",
    measurement: "130 g",
    price: "$62",
    lot: "PA-01",
    photoUrl:
      "https://reminiscent-dolphin-481.convex.cloud/api/storage/d028bd62-118f-4210-81fc-b2fa9bd4a760",
    note: "Compra real registrada como material suelto dentro del lote.",
  },
  {
    supplier: "Autoservicio Cruce",
    category: "Catalizador completo",
    item: "Toyota 2000",
    measurement: "Pieza completa",
    price: "$60",
    lot: "PA-01",
    photoUrl:
      "https://reminiscent-dolphin-481.convex.cloud/api/storage/c6725bcd-1116-4dcb-979d-4f1803500bfb",
    note: "Catalizador completo fotografiado en la compra real.",
  },
  {
    supplier: "5 Hermanos",
    category: "Material suelto",
    item: "Nissan",
    measurement: "3,500 g",
    price: "$65",
    lot: "PA-01",
    photoUrl:
      "https://reminiscent-dolphin-481.convex.cloud/api/storage/b0d52097-f4bd-4076-bf58-bd8b16446433",
    note: "Material suelto con volumen alto y foto real de base de datos.",
  },
  {
    supplier: "Mechanical Workshop",
    category: "Catalizador completo",
    item: "Nissan X3",
    measurement: "Pieza completa",
    price: "$80",
    lot: "PA-01",
    photoUrl:
      "https://reminiscent-dolphin-481.convex.cloud/api/storage/41a92375-f5f5-427a-87e7-91901559f4ea",
    note: "Pieza completa con referencia visible dentro del registro real.",
  },
  {
    supplier: "Luis Pueblo Nuevo",
    category: "Material suelto",
    item: "Honda CRV",
    measurement: "113 g",
    price: "$62",
    lot: "PA-01",
    photoUrl:
      "https://reminiscent-dolphin-481.convex.cloud/api/storage/13d0c2fc-c836-498e-9802-53994da90438",
    note: "Registro real con gramos, valor y lote asociados a la foto.",
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
