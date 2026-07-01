export type PresentationVisualKey =
  | "hero"
  | "opportunity-map"
  | "technology"
  | "network-map"
  | "catalysts"
  | "electronics"
  | "dashboard"
  | "campaigns"
  | "statement"
  | "closing";

export type PresentationSlide = {
  id: string;
  step: string;
  title: string;
  body?: string[];
  bullets?: string[];
  visual: PresentationVisualKey;
  note?: string;
};

export type PanamaMarker = {
  name: string;
  lat: number;
  lng: number;
  emphasis?: boolean;
};

export const presentacionSlides: PresentationSlide[] = [
  {
    id: "inicio",
    step: "01",
    title: "PMG Metales Panamá",
    body: [
      "Tecnología, organización y relaciones comerciales para el abastecimiento de catalizadores usados y tarjetas electrónicas.",
      "Construimos una operación basada en información, procesos y relaciones de largo plazo para desarrollar una red confiable de abastecimiento en Panamá.",
    ],
    visual: "hero",
  },
  {
    id: "oportunidad",
    step: "02",
    title: "Panamá como oportunidad",
    body: [
      "Panamá ofrece una ubicación estratégica para desarrollar una red eficiente de abastecimiento gracias a su posición logística, su conectividad y su actividad comercial.",
      "Nuestro objetivo es desarrollar relaciones comerciales sólidas que permitan crecer de manera organizada y sostenible.",
    ],
    visual: "opportunity-map",
  },
  {
    id: "vision",
    step: "03",
    title: "Nuestra visión",
    body: [
      "En PMG Metales creemos que el crecimiento no depende únicamente de comprar más piezas.",
      "Depende de construir una operación organizada.",
      "Nuestro objetivo es convertir un mercado tradicional en una operación moderna y escalable.",
    ],
    bullets: [
      "Dar seguimiento a cada contacto",
      "Registrar cada compra",
      "Mantener un historial completo",
      "Administrar relaciones comerciales",
      "Controlar la información del negocio",
    ],
    visual: "technology",
  },
  {
    id: "red",
    step: "04",
    title: "Nuestra red comercial",
    body: [
      "Cada punto representa una oportunidad comercial.",
      "Nuestra red continúa creciendo mediante trabajo de campo y relaciones directas con talleres, soldadores, recicladores, chatarreros, empresas y compradores independientes.",
      "La información geográfica nos permite organizar mejor las visitas comerciales y el crecimiento de la operación.",
    ],
    visual: "network-map",
  },
  {
    id: "catalizadores",
    step: "05",
    title: "Catalizadores usados",
    body: [
      "Construimos relaciones comerciales sostenibles con talleres, centros de escape, recicladores y proveedores independientes.",
      "Cada contacto queda registrado y administrado dentro de nuestra plataforma.",
    ],
    visual: "catalysts",
  },
  {
    id: "tarjetas",
    step: "06",
    title: "Tarjetas electrónicas",
    body: [
      "Nuestro objetivo es desarrollar una red especializada para la compra de tarjetas electrónicas.",
      "Además de trabajar con recicladores y comercios relacionados con residuos electrónicos.",
      "Nuestro enfoque consiste en conectar directamente la generación del material con compradores especializados.",
    ],
    bullets: [
      "Gestión ambiental",
      "Bienes y excedentes",
      "Tecnología",
      "Activos fijos",
      "Compras",
    ],
    visual: "electronics",
  },
  {
    id: "software",
    step: "07",
    title: "Tecnología desarrollada para nuestra operación",
    body: [
      "El software fue desarrollado exclusivamente para administrar nuestra operación.",
      "No vendemos software. Lo utilizamos para mejorar nuestros procesos.",
    ],
    bullets: [
      "Compras",
      "Compradores",
      "Proveedores",
      "Lotes",
      "Pesos",
      "Historial",
      "Indicadores",
    ],
    visual: "dashboard",
  },
  {
    id: "comunicacion",
    step: "08",
    title: "Comunicación inteligente",
    body: [
      "Nuestra plataforma incorpora campañas segmentadas de WhatsApp.",
      "Esto nos permite mantener comunicación constante con nuestra red comercial de forma organizada y por regiones.",
      "La automatización fortalece las relaciones con nuestros proveedores y mejora la continuidad del abastecimiento.",
    ],
    visual: "campaigns",
  },
  {
    id: "filosofia",
    step: "09",
    title: "Nuestra filosofía",
    body: [
      "No competimos por comprar una pieza más.",
      "Construimos una red de abastecimiento basada en información, relaciones comerciales y procesos.",
    ],
    visual: "statement",
  },
  {
    id: "cierre",
    step: "10",
    title: "Buscamos un aliado estratégico",
    body: [
      "Nuestro objetivo es construir una relación comercial de largo plazo con proveedores internacionales que compartan nuestra visión de crecimiento.",
      "Creemos que la combinación entre tecnología, organización y relaciones comerciales permite desarrollar una operación sólida y escalable.",
      "PMG Metales Panamá. Construyendo el futuro del abastecimiento organizado.",
    ],
    visual: "closing",
  },
];

export const panamaOpportunityMarkers: PanamaMarker[] = [
  { name: "Ciudad de Panamá", lat: 8.9824, lng: -79.5199, emphasis: true },
  { name: "Colón", lat: 9.3592, lng: -79.9014 },
  { name: "La Chorrera", lat: 8.8803, lng: -79.7833 },
  { name: "Santiago", lat: 8.1062, lng: -80.9683 },
  { name: "David", lat: 8.4273, lng: -82.4301 },
];

export const panamaNetworkMarkers: PanamaMarker[] = [
  { name: "Panamá Centro", lat: 8.998, lng: -79.519, emphasis: true },
  { name: "San Miguelito", lat: 9.032, lng: -79.5, emphasis: true },
  { name: "La Chorrera", lat: 8.88, lng: -79.783 },
  { name: "Arraiján", lat: 8.951, lng: -79.661 },
  { name: "Colón", lat: 9.3592, lng: -79.9014 },
  { name: "Penonomé", lat: 8.5189, lng: -80.3573 },
  { name: "Santiago", lat: 8.1062, lng: -80.9683 },
  { name: "David", lat: 8.4273, lng: -82.4301 },
  { name: "Chitré", lat: 7.9608, lng: -80.4294 },
];
