export const CLIENT_ZONES = ["panama", "colon", "chorrera", "interior"] as const;

export type ClientZone = (typeof CLIENT_ZONES)[number];

export const CLIENT_ZONE_LABELS: Record<ClientZone, string> = {
  panama: "Panamá Metro",
  colon: "Colón",
  chorrera: "Chorrera + Arraiján",
  interior: "Interior",
};

export const CAMPAIGN_TEMPLATE_KEYS = ["morning_route", "availability_check"] as const;

export type CampaignTemplateKey = (typeof CAMPAIGN_TEMPLATE_KEYS)[number];

export const CAMPAIGN_TEMPLATE_LABELS: Record<CampaignTemplateKey, string> = {
  morning_route: "Ruta de la mañana",
  availability_check: "Consulta de disponibilidad",
};

export const getDefaultCampaignMessage = (
  templateKey: CampaignTemplateKey,
  zone: ClientZone
) => {
  const zoneLabel = CLIENT_ZONE_LABELS[zone];

  switch (templateKey) {
    case "availability_check":
      return `Buenos días. Hoy estamos activos comprando catalizadores en ${zoneLabel}. Si tienes piezas, cerámica o material disponible, me avisas y coordinamos.`;
    case "morning_route":
    default:
      return `Buenos días. Hoy salimos a ruta por ${zoneLabel} comprando catalizadores. Si tienes material disponible, te escribo para pasar.`;
  }
};

export const renderCampaignPreview = ({
  clientName,
  zone,
  message,
}: {
  clientName: string;
  zone: ClientZone;
  message: string;
}) => {
  const safeName = clientName.trim() || "cliente";
  const safeMessage = message.trim() || getDefaultCampaignMessage("morning_route", zone);
  return `Hola ${safeName}, ${safeMessage}`;
};

export const normalizeCampaignPhone = (
  rawPhone: string,
  zoneCountry: "pa" | "co" = "pa"
) => {
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  const cleaned = digits.startsWith("00") ? digits.slice(2) : digits;
  if (zoneCountry === "pa") {
    if (cleaned.length === 8) return `507${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith("507")) return cleaned;
  }

  if (zoneCountry === "co") {
    if (cleaned.length === 10) return `57${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("57")) return cleaned;
  }

  if (cleaned.length >= 10 && cleaned.length <= 15) return cleaned;
  return null;
};
