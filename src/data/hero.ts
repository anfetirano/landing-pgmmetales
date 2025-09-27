export interface HeroDetails {
  heading: string;
  subheading: string;
  centerImageSrc?: string;
  centerImageAlt?: string;
  centerImageWidth?: number;
  centerImageHeight?: number;
  showCenterImage?: boolean;
  ctaText?: string;
}

export const heroDetails: HeroDetails = {
  heading: "Recupera tus metales preciosos",
  subheading:
    "Obtén el valor más alto por tus catalizadores usados. Cotización rápida por WhatsApp basada en el contenido de Pt, Pd y Rh.",
  // cuando tengas imagen real, actualiza:
  // centerImageSrc: "/images/hero-catalizadores.webp",
  centerImageAlt: "Catalizadores usados y cerámica (honeycomb) listos para valoración",
  centerImageWidth: 960,
  centerImageHeight: 540,
  showCenterImage: true,
  ctaText: "Cotizar en línea",
};

export default heroDetails;
