// Tipos (opcional, pero útil para TS estricto)
export type SocialMap = Record<string, string>;

export interface FooterDetails {
  subheading: string;
  quickLinks: { text: string; url: string }[];
  email?: string;
  telephone?: string;
  socials?: SocialMap;
}

// Datos del footer
export const footerDetails: FooterDetails = {
  subheading: "PMG Metales — Tu socio en refinacion de Metales Preciosos.",
  quickLinks: [
    { text: "Servicios", url: "#servicios" },
    { text: "Proyectos", url: "#proyectos" },
    { text: "Contacto",  url: "#contacto"  },
  ],
  email: "info@pmgmetales.com",
  telephone: "+57 323 710 7051",
  socials: {
    linkedin: "#",
    instagram: "#",
    // añade más si quieres: twitter: "#", facebook: "#", youtube: "#", etc.
  },
};

export default footerDetails;
