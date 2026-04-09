import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import type { LookupResult, NormalizedPriceQuery } from "./types";

export async function lookupInInternalCatalog(
  query: NormalizedPriceQuery,
  tenantKey: "co" | "pa"
): Promise<LookupResult> {
  if (query.searchMode === "insufficient") {
    return {
      source: "catalog",
      status: "not_found",
      message: "Internal catalog needs at least a brand, reference or photo hints.",
      matches: [],
    };
  }

  const items = await fetchQuery(api.catalogPieces.searchCatalog, {
    tenantKey,
    reference: query.reference ?? undefined,
    brand: query.brand ?? undefined,
    limit: 8,
  });

  if (items.length === 0) {
    return {
      source: "catalog",
      status: "not_found",
      message: "No internal catalog match found for this country yet.",
      matches: [],
    };
  }

  return {
    source: "catalog",
    status: "ok",
    message: `Found ${items.length} candidate(s) in the internal ${tenantKey.toUpperCase()} catalog.`,
    matches: items.map((item) => ({
      source: "catalog" as const,
      title: item.canonicalName,
      reference: item.reference ?? null,
      brand: item.brand ?? null,
      price: item.internalPrice ?? null,
      currency: "USD" as const,
      confidence: item.confidence,
      url: item.samplePhotoUrl ?? null,
      notes: [
        item.notes ?? "Saved in internal catalog",
        `Source: ${item.source}`,
      ].filter(Boolean),
    })),
  };
}
