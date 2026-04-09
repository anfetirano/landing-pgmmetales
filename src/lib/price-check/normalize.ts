import type { NormalizedPriceQuery } from "./types";

const KNOWN_BRANDS = [
  "toyota",
  "honda",
  "nissan",
  "mazda",
  "hyundai",
  "kia",
  "ford",
  "chevrolet",
  "renault",
  "suzuki",
  "mitsubishi",
  "bmw",
  "mercedes",
  "audi",
  "volkswagen",
  "vw",
  "subaru",
  "jeep",
  "dodge",
  "isuzu",
];

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "NUEVA",
  "CONSULTA",
  "CATALIZADOR",
  "CATALIZADORES",
  "MARCA",
  "REFERENCIA",
  "FOTO",
  "SIN",
  "CON",
  "PARA",
  "DEL",
  "DE",
  "EL",
  "LA",
  "LOS",
  "LAS",
]);

function detectReference(rawText: string, brand: string | null) {
  const explicitMatch =
    rawText.match(/\b[A-Z0-9]{3,}[-/ ]?[A-Z0-9]{1,}\b/i) ??
    rawText.match(/\b[A-Z][A-Z0-9]{1,5}\b/i) ??
    rawText.match(/\b[A-Z0-9]{2,6}\b/i);

  const compactExplicit = explicitMatch?.[0]
    .replace(/\s+/g, "")
    .replace(/[-/]/g, "")
    .toUpperCase();

  if (
    compactExplicit &&
    compactExplicit !== brand &&
    !STOPWORDS.has(compactExplicit)
  ) {
    return compactExplicit;
  }

  const candidates = rawText
    .split(/[^A-Za-z0-9]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
    .filter((token) => token !== brand)
    .filter((token) => !STOPWORDS.has(token))
    .filter((token) => token.length >= 2 && token.length <= 8)
    .filter((token) => /[A-Z]/.test(token));

  return (
    candidates.sort((a, b) => {
      const aScore = Number(/[0-9]/.test(a)) + Number(a.length >= 3);
      const bScore = Number(/[0-9]/.test(b)) + Number(b.length >= 3);
      return bScore - aScore;
    })[0] ?? null
  );
}

export function normalizePriceQuery(
  text: string | null | undefined,
  imageHints: string[] = []
): NormalizedPriceQuery {
  const rawText = normalizeText(text ?? "");
  const lower = rawText.toLowerCase();

  const brand =
    KNOWN_BRANDS.find((item) => lower.includes(item))?.toUpperCase() ?? null;
  const reference = detectReference(rawText, brand);
  const hasPhotoHints = imageHints.length > 0;

  const searchMode: NormalizedPriceQuery["searchMode"] = reference
    ? brand
      ? hasPhotoHints
        ? "reference_brand_photo"
        : "reference_brand"
      : "reference_only"
    : brand
    ? hasPhotoHints
      ? "brand_photo"
      : "brand_only"
    : hasPhotoHints
    ? "photo_only"
    : "insufficient";

  return {
    rawText,
    reference,
    brand,
    imageHints,
    requiresManualReview: searchMode === "photo_only" || searchMode === "insufficient",
    searchMode,
  };
}
