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
  zone?: string;
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

const panamaProviderNames = [
  "5 hermano",
  "5 hermanos",
  "Aaron",
  "AJ service",
  "Alberto mecanico",
  "Almacar",
  "Alvaro",
  "Amilcar",
  "Ancon cars",
  "Anthony taller",
  "Asia center",
  "Aurelio",
  "Auto",
  "Auto Advance",
  "Auto center Pacora",
  "AutoPartes Juan diaz",
  "Autoservicio",
  "Autoservicio cruce",
  "Autozen",
  "Carlos rastreria",
  "Ce car services",
  "Chapistería la pulida",
  "Cheaper",
  "Chilibre",
  "Cholo taller",
  "Cliente sin nombre",
  "Clientecolon",
  "Compraventa",
  "David car Center",
  "El blueprints",
  "El progreso",
  "Estrella de oro",
  "Euro rastro",
  "Felipe rodriguez",
  "Gabriel",
  "Geovani",
  "Guillermo Juan Díaz",
  "Gustavo taller",
  "Itsmo llantas",
  "Jesús tallerr",
  "Juan diaz",
  "Lemans cars",
  "Luis pueblo nuevo",
  "Maxcenter",
  "Mechanical workshop",
  "Melvin",
  "Miguel soldador",
  "Milton soldador",
  "Milton soldadura",
  "Multiservicios",
  "Nelson",
  "No cliente",
  "Nueva era",
  "Online",
  "Papa",
  "Personal",
  "Polo serviauto",
  "Rastro autopartes",
  "Rastro la esperanza",
  "Rastro linin",
  "Rastro vacamonte",
  "Rastro507",
  "Rodrigo",
  "Servicentro el gigante",
  "Servicentro vicente",
  "Servicio ricardo",
  "Servioeste",
  "Silenciadores Colon",
  "Soldadura",
  "Soldadura taller",
  "Sparks motors",
  "Taller bonilla",
  "Taller bosa",
  "Taller central",
  "Taller chu",
  "Taller DF",
  "Taller el Cruze",
  "Taller general",
  "Taller JE",
  "Taller kam",
  "Taller leo",
  "Taller río abajo",
  "Taller roberto",
  "Taller romo",
  "Taller san Vicente",
  "Wilmer rastro",
];

const panamaZoneCenters = {
  "Panamá Metro": [8.99, -79.519] as [number, number],
  "Río Abajo": [9.006, -79.482] as [number, number],
  "Juan Díaz": [9.016, -79.449] as [number, number],
  Tocumen: [9.079, -79.385] as [number, number],
  "Panamá Este": [9.086, -79.289] as [number, number],
  Arraiján: [8.97, -79.68] as [number, number],
  "Panamá Norte": [9.155, -79.618] as [number, number],
  Colón: [9.36, -79.9] as [number, number],
} as const;

type PanamaPresentationZone = keyof typeof panamaZoneCenters;

function inferPanamaPresentationZone(name: string): PanamaPresentationZone {
  const normalized = name.toLowerCase();

  if (normalized.includes("col")) return "Colón";
  if (normalized.includes("chilibre")) return "Panamá Norte";
  if (
    normalized.includes("vacamonte") ||
    normalized.includes("servioeste") ||
    normalized.includes("oeste") ||
    normalized.includes("5 hermano")
  ) {
    return "Arraiján";
  }
  if (normalized.includes("pacora")) return "Panamá Este";
  if (normalized.includes("tocumen") || normalized.includes("sparks")) return "Tocumen";
  if (normalized.includes("juan diaz")) return "Juan Díaz";
  if (
    normalized.includes("rio abajo") ||
    normalized.includes("gigante") ||
    normalized.includes("servicentro")
  ) {
    return "Río Abajo";
  }

  return "Panamá Metro";
}

function createPresentationClient(
  name: string,
  index: number,
  zoneIndex: number,
  zone: PanamaPresentationZone
): DemoMapClient {
  const [baseLat, baseLng] = panamaZoneCenters[zone];
  const latOffset = ((zoneIndex % 6) - 2.5) * 0.008 + (Math.floor(zoneIndex / 6) % 3) * 0.003;
  const lngOffset = ((zoneIndex % 5) - 2) * 0.01 + (Math.floor(zoneIndex / 5) % 4) * 0.004;

  return {
    _id: `real-${String(index + 1).padStart(3, "0")}`,
    name,
    zone,
    buyerName: zoneIndex % 3 === 1 ? "Kenny" : "Richard",
    lat: Number((baseLat + latOffset).toFixed(4)),
    lng: Number((baseLng + lngOffset).toFixed(4)),
    address: `${zone}, Panamá`,
  };
}

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
      "Cada catalizador comprado alimenta una base de conocimiento. Cada registro fortalece la operación. Cada relación comercial hace crecer la empresa.",
    ],
    visual: "closing",
  },
];

export const demoMapClients: DemoMapClient[] = (() => {
  const zoneCounts = new Map<PanamaPresentationZone, number>();

  return panamaProviderNames.map((name, index) => {
    const zone = inferPanamaPresentationZone(name);
    const zoneIndex = zoneCounts.get(zone) ?? 0;
    zoneCounts.set(zone, zoneIndex + 1);

    return createPresentationClient(name, index, zoneIndex, zone);
  });
})();

export const demoCommercialRows: DemoCommercialRow[] = demoMapClients.map((client, index) => ({
  name: client.name,
  zone: client.zone ?? "Panamá Metro",
  contact: "Registro PMG",
  type:
    client.zone === "Colón"
      ? "Ruta comercial"
      : client.zone === "Arraiján"
        ? "Proveedor recurrente"
        : client.zone === "Tocumen" || client.zone === "Panamá Este"
          ? "Frente activo"
          : "Proveedor registrado",
  buyer: client.buyerName ?? "Richard",
  status: index % 4 === 0 ? "Seguimiento activo" : index % 4 === 1 ? "Ruta activa" : index % 4 === 2 ? "Recompra abierta" : "Proveedor visible",
  history: `${(index % 6) + 1} ${index % 6 === 0 ? "registro" : "registros"} vinculados`,
}));

export function buildCommercialRowsFromClients(
  clients: DemoMapClient[]
): DemoCommercialRow[] {
  return [...clients]
    .sort((a, b) => {
      const zoneCompare = (a.zone ?? "").localeCompare(b.zone ?? "", "es", {
        sensitivity: "base",
      });
      if (zoneCompare !== 0) return zoneCompare;
      return (a.name ?? "").localeCompare(b.name ?? "", "es", {
        sensitivity: "base",
      });
    })
    .map((client, index) => ({
      name: client.name,
      zone: client.zone ?? "Panamá Metro",
      contact: client.contactName ?? "Registro PMG",
      type:
        client.zone === "colon"
          ? "Ruta comercial"
          : client.zone === "chorrera"
            ? "Proveedor recurrente"
            : client.zone === "david" || client.zone === "interior"
              ? "Cobertura regional"
              : "Proveedor registrado",
      buyer: client.buyerName ?? "Richard",
      status:
        index % 4 === 0
          ? "Seguimiento activo"
          : index % 4 === 1
            ? "Ruta activa"
            : index % 4 === 2
              ? "Recompra abierta"
              : "Proveedor visible",
      history: `${(index % 6) + 1} ${(index % 6) + 1 === 1 ? "registro" : "registros"} vinculados`,
    }));
}

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
