import { priceCheckConfig } from "./config";
import type { LookupResult, NormalizedPriceQuery } from "./types";

function buildEcotradeSearchUrl(query: NormalizedPriceQuery) {
  const search = query.reference || query.brand || "";
  if (!search) return null;
  return `${priceCheckConfig.ecotradeBaseUrl}?search=${encodeURIComponent(search)}`;
}

export async function lookupInEcotrade(
  query: NormalizedPriceQuery
): Promise<LookupResult> {
  if (query.searchMode === "insufficient") {
    return {
      source: "ecotrade",
      status: "not_found",
      message: "Ecotrade lookup needs at least a brand or a photo to propose candidates.",
      matches: [],
    };
  }

  const notes = [
    "The search URL structure is prepared.",
    "Real result extraction still needs to be implemented.",
  ];

  if (!query.reference) {
    notes.unshift(
      "This query has no exact reference. Ecotrade should return ranked candidates using brand and visual cues."
    );
  }

  return {
    source: "ecotrade",
    status: "needs_manual_discovery",
    message: !query.reference
      ? "Ecotrade connector scaffolded. Candidate ranking pending discovery phase."
      : "Ecotrade connector scaffolded. Real catalog extraction pending discovery phase.",
    matches: [
      {
        source: "ecotrade",
        title: !query.reference
          ? "Ecotrade candidate ranking pending"
          : "Ecotrade catalog lookup pending",
        reference: query.reference,
        brand: query.brand,
        price: null,
        currency: "USD",
        confidence: "review_manually",
        url: buildEcotradeSearchUrl(query),
        notes,
      },
    ],
  };
}
