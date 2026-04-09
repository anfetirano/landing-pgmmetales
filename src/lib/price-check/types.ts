export type PriceCheckChannel = "telegram" | "private_api";

export type PriceCheckInput = {
  channel: PriceCheckChannel;
  requesterId?: string | null;
  requesterLabel?: string | null;
  tenantKey?: "co" | "pa" | null;
  queryText?: string | null;
  photoUrl?: string | null;
};

export type NormalizedPriceQuery = {
  rawText: string;
  reference: string | null;
  brand: string | null;
  imageHints: string[];
  requiresManualReview: boolean;
  searchMode:
    | "reference_brand_photo"
    | "reference_brand"
    | "reference_only"
    | "brand_photo"
    | "brand_only"
    | "photo_only"
    | "insufficient";
};

export type LookupMatch = {
  source: "catalog" | "pmr" | "ecotrade";
  title: string;
  reference: string | null;
  brand: string | null;
  price: number | null;
  currency: "USD";
  confidence: "exact" | "probable" | "review_manually";
  url: string | null;
  notes: string[];
  score?: number;
  reasons?: string[];
};

export type LookupStatus =
  | "ok"
  | "not_found"
  | "not_configured"
  | "needs_manual_discovery"
  | "error";

export type LookupResult = {
  source: "catalog" | "pmr" | "ecotrade";
  status: LookupStatus;
  message: string;
  matches: LookupMatch[];
};

export type PriceCheckResult = {
  normalizedQuery: NormalizedPriceQuery;
  catalog: LookupResult;
  pmr: LookupResult;
  ecotrade: LookupResult;
  summaryText: string;
  overallConfidence: "exact" | "probable" | "review_manually";
  responseMode: "single_match" | "candidate_list" | "insufficient";
  shouldSuggestCatalogSave: boolean;
};
