import { lookupInInternalCatalog } from "./catalog";
import { extractImageHintsFromPhoto } from "./extract";
import { lookupInEcotrade } from "./ecotrade";
import { lookupInPmr } from "./pmr";
import { normalizePriceQuery } from "./normalize";
import { decideResponseMode, rankMatches } from "./ranking";
import type { PriceCheckInput, PriceCheckResult } from "./types";

function sourcePriority(source: "catalog" | "pmr" | "ecotrade") {
  if (source === "catalog") return 3;
  if (source === "pmr") return 2;
  return 1;
}

function confidenceLabel(confidence: PriceCheckResult["overallConfidence"]) {
  if (confidence === "exact") return "alta";
  if (confidence === "probable") return "media";
  return "revisar manualmente";
}

function compactNotes(notes: string[]) {
  return notes
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");
}

function formatPrice(price: number | null) {
  if (typeof price !== "number") return "sin precio";
  return `USD ${price.toFixed(2)}`;
}

function bestMatch(matches: PriceCheckResult["pmr"]["matches"]) {
  return [...matches].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return sourcePriority(b.source) - sourcePriority(a.source);
  })[0];
}

function formatSourceBlock(
  label: string,
  match: NonNullable<ReturnType<typeof bestMatch>>,
  fallbackMessage: string
) {
  if (!match) {
    return `${label}: ${fallbackMessage}`;
  }

  const detailBits = [formatPrice(match.price), match.reference, compactNotes(match.notes)].filter(Boolean);
  const lines = [`${label}: ${match.title} · ${detailBits.join(" · ")}`];
  if (match.url) {
    lines.push(`Link ${label}: ${match.url}`);
  }
  return lines.join("\n");
}

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

function formatCandidateLine(match: NonNullable<PriceCheckResult["pmr"]["matches"][number]>) {
  const bits = [
    match.source === "pmr"
      ? "PMR"
      : match.source === "ecotrade"
      ? "Ecotrade"
      : "Catálogo",
    match.title,
    formatPrice(match.price),
    match.reference,
  ].filter(Boolean);

  const details = compactNotes(match.notes);
  return details ? `${bits.join(" · ")} · ${details}` : bits.join(" · ");
}

function buildSummaryText(result: PriceCheckResult) {
  const mergedMatches = [...result.catalog.matches, ...result.pmr.matches, ...result.ecotrade.matches]
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return sourcePriority(b.source) - sourcePriority(a.source);
    });
  const topMatch = mergedMatches[0];
  const candidateMatches = mergedMatches.slice(0, 3);
  const bestCatalog = bestMatch(result.catalog.matches);
  const bestPmr = bestMatch(result.pmr.matches);
  const bestEcotrade = bestMatch(result.ecotrade.matches);

  const lines = [
    "Resultado de consulta",
    `Referencia: ${result.normalizedQuery.reference ?? "sin referencia"}`,
    `Marca: ${result.normalizedQuery.brand ?? "sin marca"}`,
    `Confianza: ${confidenceLabel(result.overallConfidence)}`,
    "",
    formatSourceBlock("PMR", bestPmr, result.pmr.message),
    formatSourceBlock("Ecotrade", bestEcotrade, result.ecotrade.message),
    formatSourceBlock("Catálogo interno", bestCatalog, result.catalog.message),
  ];

  if (result.responseMode === "single_match" && topMatch) {
    lines.push("", "Coincidencia recomendada");
    lines.push(formatCandidateLine(topMatch));
    if (topMatch.reasons?.length) {
      lines.push(`Motivo: ${topMatch.reasons.join(", ")}`);
    }
  } else if (result.responseMode === "candidate_list" && candidateMatches.length > 0) {
    lines.push("", "Candidatos más cercanos");
    for (const [index, match] of candidateMatches.entries()) {
      lines.push(`${index + 1}. ${formatCandidateLine(match)}`);
    }
  }

  if (!result.normalizedQuery.reference && result.normalizedQuery.brand) {
    lines.push("", "No llegó referencia clara; tomé la marca y la forma visual como apoyo para ordenar candidatos.");
  }

  if (result.normalizedQuery.searchMode === "photo_only") {
    lines.push("", "Consulta solo con foto: tómala como guía y revisa manualmente antes de cerrar precio.");
  }

  if (result.overallConfidence === "review_manually") {
    lines.push("", "Recomendación: revisar manualmente antes de definir cuánto pagarle al cliente.");
  }

  if (result.shouldSuggestCatalogSave) {
    lines.push(
      "",
      "Si la pieza queda confirmada en campo, la podemos guardar en el catálogo del país con el precio al cliente."
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
