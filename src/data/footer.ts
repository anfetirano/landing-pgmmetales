export type SocialMap = Record<string, string>;
export interface FooterDetails {
  subheading: string;
  quickLinks: { text: string; url: string }[];
  email?: string;
  telephone?: string;
  socials?: SocialMap;
}

export const footerDetails: FooterDetails = {
  subheading: "PMG Metales — Tu socio en soluciones metálicas.",
  quickLinks: [
    { text: "Servicios",    url: "#servicios"   },
    { text: "Proceso",      url: "#proceso"     },
    { text: "Testimonios",  url: "#testimonios" },
    { text: "Contacto",     url: "#cta"         },
  ],
  email: "info@pmgmetales.com",
  telephone: "+57 323 710 7051",
  socials: { linkedin: "#", instagram: "#" },
};

export default footerDetails;
