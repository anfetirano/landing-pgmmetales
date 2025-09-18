import { ITestimonial } from "@/types";
import { siteDetails } from "./siteDetails";

export const testimonials: ITestimonial[] = [
  {
    name: "Taller La 80",
    role: "Taller aliado",
    message: `Pagos inmediatos y buen precio. ${siteDetails.siteName} nos recibe la pieza o la cerámica y liquida sin demoras.`,
    avatar: "/images/Logos/pmg-logo-isotipo-movil.svg",
  },
  {
    name: "Taller La 65",
    role: "Taller aliado",
    message: `Excelente atención por WhatsApp y recolección a tiempo. Confianza total con ${siteDetails.siteName}.`,
    avatar: "/images/Logos/pmg-logo-isotipo-movil.svg",
  },
  {
    name: "Taller Solomofles",
    role: "Taller aliado",
    message: `Cumplimiento en lo acordado y reporte claro del contenido (Pt, Pd, Rh). Recomendados.`,
    avatar: "/images/Logos/pmg-logo-isotipo-movil.svg",
  },
  {
    name: "Taller Soldamos",
    role: "Taller aliado",
    message: `Proceso transparente y certificado de compra. Volvimos porque siempre cumplen.`,
    avatar: "/images/Logos/pmg-logo-isotipo-movil.svg",
  },
];

export default testimonials;
