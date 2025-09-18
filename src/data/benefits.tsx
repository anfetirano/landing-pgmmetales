import {
  FiBarChart2,
  FiBriefcase,
  FiDollarSign,
  FiLock,
  FiPieChart,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";

import { IBenefit } from "@/types";

// Placeholders de imagen (SVG en data URI) para no depender de archivos.
// Puedes cambiarlos más adelante por /images/ceramica.webp y /images/catalizador-completo.webp, etc.
const CERAMICA_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%25' height='100%25' fill='%23f8fafc' stroke='%23d1d5db' stroke-dasharray='8%208' stroke-width='4'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23234c4b' font-family='Arial, Helvetica, sans-serif' font-size='36'>Cer%C3%A1mica%20de%20catalizador%20(placeholder)</text></svg>";

const COMPLETO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%25' height='100%25' fill='%23f8fafc' stroke='%23d1d5db' stroke-dasharray='8%208' stroke-width='4'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23234c4b' font-family='Arial, Helvetica, sans-serif' font-size='36'>Catalizador%20completo%20(placeholder)</text></svg>";

const SEGURIDAD_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%25' height='100%25' fill='%23f8fafc' stroke='%23d1d5db' stroke-dasharray='8%208' stroke-width='4'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23234c4b' font-family='Arial, Helvetica, sans-serif' font-size='36'>Transparencia%20y%20seguridad%20(placeholder)</text></svg>";

export const benefits: IBenefit[] = [
  {
    title: "Compra de cerámica de catalizador",
    description:
      "Pagamos por el contenido de Pt, Pd y Rh. Recibimos monolito cerámico (honeycomb) triturado o entero y realizamos análisis para una oferta justa.",
    bullets: [
      {
        title: "Análisis y valorización",
        description:
          "Estimación por contenido de metales preciosos con reporte claro.",
        icon: <FiBarChart2 size={26} />,
      },
      {
        title: "Mejor precio garantizado",
        description:
          "Acuerdo exclusivo con refinería para pagar más de forma consistente.",
        icon: <FiTrendingUp size={26} />,
      },
      {
        title: "Logística flexible",
        description:
          "Opciones de recolección y trazabilidad para talleres y recolectores.",
        icon: <FiBriefcase size={26} />,
      },
    ],
    imageSrc: CERAMICA_PLACEHOLDER,
  },
  {
    title: "Compra de catalizador completo",
    description:
      "Compramos la pieza completa (OEM o aftermarket). Ideal para talleres y recolectores que prefieren vender por unidad o lote.",
    bullets: [
      {
        title: "Retiro en tu punto",
        description:
          "Coordinamos entrega o recolección según tu ubicación y volumen.",
        icon: <FiTarget size={26} />,
      },
      {
        title: "Pago inmediato",
        description:
          "Pagos rápidos y superiores, acordados previamente por referencia.",
        icon: <FiDollarSign size={26} />,
      },
      {
        title: "Documentación simple",
        description:
          "Guías claras de recepción y comprobantes para tu control.",
        icon: <FiPieChart size={26} />,
      },
    ],
    imageSrc: COMPLETO_PLACEHOLDER,
  },
  {
    title: "Transparencia y seguridad",
    description:
      "Proceso documentado, comunicación constante y métodos de pago confiables para que vendas con tranquilidad.",
    bullets: [
      {
        title: "Contratos y trazabilidad",
        description:
          "Relación formal con talleres y reportes de cada lote recibido.",
        icon: <FiShield size={26} />,
      },
      {
        title: "Pagos seguros",
        description:
          "Transferencias bancarias verificables y soporte ante cualquier duda.",
        icon: <FiLock size={26} />,
      },
      {
        title: "Acompañamiento real",
        description:
          "Atención por WhatsApp o email durante todo el proceso de venta.",
        icon: <FiUser size={26} />,
      },
    ],
    imageSrc: SEGURIDAD_PLACEHOLDER,
  },
];

export default benefits;
