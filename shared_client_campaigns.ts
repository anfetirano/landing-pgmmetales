export const CLIENT_ZONES = ["panama", "colon", "chorrera", "david", "interior"] as const;

export type ClientZone = (typeof CLIENT_ZONES)[number];

export const CLIENT_ZONE_LABELS: Record<ClientZone, string> = {
  panama: "Panamá Metro",
  colon: "Colón",
  chorrera: "Arraiján + La Chorrera",
  david: "David",
  interior: "Interior",
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceInKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const inferPanamaZoneFromCoordinates = (
  lat?: number | null,
  lng?: number | null
): ClientZone | null => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const point = { lat: lat as number, lng: lng as number };

  // Ignore clearly invalid points outside Panama's rough bounding box.
  if (point.lat < 7 || point.lat > 10.2 || point.lng < -83.2 || point.lng > -77) {
    return null;
  }

  if (distanceInKm(point, { lat: 8.4273, lng: -82.4308 }) <= 35) {
    return "david";
  }

  if (
    distanceInKm(point, { lat: 9.3592, lng: -79.9001 }) <= 35 ||
    (point.lat >= 9.05 && point.lat <= 9.5 && point.lng >= -80.15 && point.lng <= -79.65)
  ) {
    return "colon";
  }

  if (
    (point.lat >= 8.85 && point.lat <= 9.25 && point.lng >= -80.35 && point.lng <= -79.68) ||
    distanceInKm(point, { lat: 8.9516, lng: -79.6601 }) <= 18 ||
    distanceInKm(point, { lat: 8.8803, lng: -79.7833 }) <= 20
  ) {
    return "chorrera";
  }

  if (
    distanceInKm(point, { lat: 8.9824, lng: -79.5199 }) <= 32 ||
    (point.lat >= 8.85 && point.lat <= 9.25 && point.lng >= -79.68 && point.lng <= -79.15)
  ) {
    return "panama";
  }

  return "interior";
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
