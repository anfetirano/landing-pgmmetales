import { lookupInInternalCatalog } from "./catalog";
import { extractImageHintsFromPhoto } from "./extract";
import { lookupInEcotrade } from "./ecotrade";
import { lookupInPmr } from "./pmr";
import { normalizePriceQuery } from "./normalize";
import { decideResponseMode, rankMatches } from "./ranking";
import type { PriceCheckInput, PriceCheckResult } from "./types";

function computeOverallConfidence(
  catalog: PriceCheckResult["catalog"],
  pmr: PriceCheckResult["pmr"],
  ecotrade: PriceCheckResult["ecotrade"]
) {
  const allMatches = [...catalog.matches, ...pmr.matches, ...ecotrade.matches];
  if (allMatches.some((match) => match.confidence === "exact")) return "exact" as const;
  if (allMatches.some((match) => match.confidence === "probable")) return "probable" as const;
  return "review_manually" as const;
}

function formatMatchLine(prefix: string, match: NonNullable<PriceCheckResult["pmr"]["matches"][number]>) {
  const bits = [
    `${prefix}: ${match.title}`,
    typeof match.price === "number" ? `USD ${match.price}` : null,
    match.score ? `score ${match.score}` : null,
  ].filter(Boolean);

  return bits.join(" · ");
}

function buildSummaryText(result: PriceCheckResult) {
  const mergedMatches = [...result.catalog.matches, ...result.pmr.matches, ...result.ecotrade.matches]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topMatch = mergedMatches[0];
  const candidateMatches = mergedMatches.slice(0, 3);

  const lines = [
    "Price confirmation summary",
    `Reference: ${result.normalizedQuery.reference ?? "Not provided / not detected"}`,
    `Brand: ${result.normalizedQuery.brand ?? "Not detected"}`,
    `Search mode: ${result.normalizedQuery.searchMode}`,
    "",
    `Catalog: ${result.catalog.message}`,
    `PMR: ${result.pmr.message}`,
    `Ecotrade: ${result.ecotrade.message}`,
  ];

  if (result.responseMode === "single_match" && topMatch) {
    lines.push("", "Recommended match");
    lines.push(formatMatchLine(topMatch.source.toUpperCase(), topMatch));
    if (topMatch.reasons?.length) {
      lines.push(`Why: ${topMatch.reasons.join(", ")}`);
    }
  } else if (result.responseMode === "candidate_list" && candidateMatches.length > 0) {
    lines.push("", "Top candidates");
    for (const [index, match] of candidateMatches.entries()) {
      lines.push(`${index + 1}. ${formatMatchLine(match.source.toUpperCase(), match)}`);
    }
  }

  if (!result.normalizedQuery.reference && result.normalizedQuery.brand) {
    lines.push("", "No exact reference was detected. The bot should prioritize brand and visual similarity.");
  }

  if (result.normalizedQuery.searchMode === "photo_only") {
    lines.push("", "Photo-only search enabled. Results should be treated as candidate matches, not exact matches.");
  }

  if (result.overallConfidence === "review_manually") {
    lines.push("", "Recommendation: review manually before giving a final buying price.");
  }

  if (result.shouldSuggestCatalogSave) {
    lines.push(
      "",
      "Si la pieza queda confirmada en campo, pregunta si la guardamos en el catálogo del país y qué precio le ponemos al cliente."
    );
  }

  return lines.join("\n");
}

export async function runPriceCheck(input: PriceCheckInput): Promise<PriceCheckResult> {
  const imageHints = await extractImageHintsFromPhoto(input.photoUrl);
  const normalizedQuery = normalizePriceQuery(input.queryText, imageHints);
  const tenantKey = input.tenantKey ?? "pa";

  const [rawCatalog, rawPmr, rawEcotrade] = await Promise.all([
    lookupInInternalCatalog(normalizedQuery, tenantKey),
    lookupInPmr(normalizedQuery),
    lookupInEcotrade(normalizedQuery),
  ]);

  const catalog = {
    ...rawCatalog,
    matches: rankMatches(normalizedQuery, rawCatalog.matches),
  };

  const pmr = {
    ...rawPmr,
    matches: rankMatches(normalizedQuery, rawPmr.matches),
  };

  const ecotrade = {
    ...rawEcotrade,
    matches: rankMatches(normalizedQuery, rawEcotrade.matches),
  };

  const responseMode = decideResponseMode(normalizedQuery, [
    ...catalog.matches,
    ...pmr.matches,
    ...ecotrade.matches,
  ]);

  const shouldSuggestCatalogSave =
    catalog.matches.length === 0 &&
    (pmr.matches.length > 0 || ecotrade.matches.length > 0) &&
    responseMode !== "insufficient";

  const result: PriceCheckResult = {
    normalizedQuery,
    catalog,
    pmr,
    ecotrade,
    overallConfidence: computeOverallConfidence(catalog, pmr, ecotrade),
    responseMode,
    shouldSuggestCatalogSave,
    summaryText: "",
  };

  result.summaryText = buildSummaryText(result);
  return result;
}
