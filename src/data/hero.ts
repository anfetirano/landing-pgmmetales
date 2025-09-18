export interface HeroDetails {
  heading: string;
  subheading: string;
  centerImageSrc?: string;
  centerImageAlt?: string;
  centerImageWidth?: number;
  centerImageHeight?: number;
  showStoreButtons?: boolean;
  showCenterImage?: boolean;
  ctaText?: string;
}

export const heroDetails: HeroDetails = {
  heading: "Recupera tus metales preciosos",
  subheading:
    "Obtén el valor más alto por tus catalizadores usados. Cotización rápida por WhatsApp basada en el contenido de Pt, Pd y Rh, con pagos superiores gracias a nuestro acuerdo exclusivo con refinería.",
  // Usamos el asset existente en tu proyecto:
  centerImageSrc: "/images/hero-mockup.webp",
  centerImageAlt: "Mockup del producto en la sección Hero",
  centerImageWidth: 960,
  centerImageHeight: 540,
  showStoreButtons: false,
  showCenterImage: true,
  ctaText: "Cotizar en línea",
};

export default heroDetails;
