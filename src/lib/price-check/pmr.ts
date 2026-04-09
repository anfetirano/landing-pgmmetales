import { hasPmrCredentials, priceCheckConfig } from "./config";
import type { LookupResult, NormalizedPriceQuery } from "./types";

export async function lookupInPmr(
  query: NormalizedPriceQuery
): Promise<LookupResult> {
  if (!hasPmrCredentials) {
    return {
      source: "pmr",
      status: "not_configured",
      message: "PMR credentials are not configured in the backend secrets.",
      matches: [],
    };
  }

  if (query.searchMode === "insufficient") {
    return {
      source: "pmr",
      status: "not_found",
      message: "PMR lookup needs at least a brand or a photo to start building candidates.",
      matches: [],
    };
  }

  const notes = [
    "Backend structure is ready for PMR session-based lookup.",
    "Real login and selector discovery still need to be implemented.",
  ];

  if (!query.reference) {
    notes.unshift(
      "This query has no exact reference. PMR should run candidate discovery using brand and photo similarity."
    );
  }

  return {
    source: "pmr",
    status: "needs_manual_discovery",
    message: !query.reference
      ? "PMR connector scaffolded. Candidate-based lookup pending discovery phase."
      : "PMR connector scaffolded. Real authenticated lookup pending discovery phase.",
    matches: [
      {
        source: "pmr",
        title: !query.reference
          ? "PMR candidate lookup pending"
          : "PMR authenticated lookup pending",
        reference: query.reference,
        brand: query.brand,
        price: null,
        currency: "USD",
        confidence: "review_manually",
        url:
          query.reference || query.brand
            ? `${priceCheckConfig.pmrBaseUrl}/login`
            : null,
        notes,
      },
    ],
  };
}
