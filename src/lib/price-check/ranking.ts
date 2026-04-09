import type { LookupMatch, NormalizedPriceQuery, PriceCheckResult } from "./types";

function compact(value: string | null | undefined) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function referenceSimilarityScore(queryRef: string | null, candidateRef: string | null) {
  const normalizedQuery = compact(queryRef);
  const normalizedCandidate = compact(candidateRef);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 60;
  if (
    normalizedQuery.includes(normalizedCandidate) ||
    normalizedCandidate.includes(normalizedQuery)
  ) {
    return 46;
  }

  const distance = levenshtein(normalizedQuery, normalizedCandidate);
  if (distance === 1) return 40;
  if (distance === 2) return 30;
  if (distance === 3) return 18;
  return 0;
}

function brandSimilarityScore(queryBrand: string | null, candidateBrand: string | null) {
  const normalizedQuery = compact(queryBrand);
  const normalizedCandidate = compact(candidateBrand);
  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 25;
  return 0;
}

function visualSupportScore(query: NormalizedPriceQuery, match: LookupMatch) {
  if (!query.imageHints.length) return 0;

  const candidateText = compact(
    [match.title, match.reference, match.brand, ...match.notes].filter(Boolean).join(" ")
  );

  if (!candidateText) return 6;

  const hintMatches = query.imageHints.filter((hint) =>
    candidateText.includes(compact(hint))
  ).length;

  if (hintMatches >= 2) return 15;
  if (hintMatches === 1) return 10;
  return 6;
}

function scoreReasons(query: NormalizedPriceQuery, match: LookupMatch, score: number) {
  const reasons: string[] = [];
  if (query.reference && match.reference && compact(query.reference) === compact(match.reference)) {
    reasons.push("Exact reference match");
  } else if (query.reference && match.reference && referenceSimilarityScore(query.reference, match.reference) >= 30) {
    reasons.push("Similar reference");
  }

  if (query.brand && match.brand && compact(query.brand) === compact(match.brand)) {
    reasons.push("Brand match");
  }

  if (query.imageHints.length > 0) {
    reasons.push("Photo used as supporting signal");
  }

  if (score < 40) {
    reasons.push("Needs manual review");
  }

  return reasons;
}

export function scoreMatch(query: NormalizedPriceQuery, match: LookupMatch): LookupMatch {
  const score =
    referenceSimilarityScore(query.reference, match.reference) +
    brandSimilarityScore(query.brand, match.brand) +
    visualSupportScore(query, match);

  const confidence: LookupMatch["confidence"] =
    score >= 85 ? "exact" : score >= 55 ? "probable" : "review_manually";

  return {
    ...match,
    score,
    confidence,
    reasons: scoreReasons(query, match, score),
  };
}

export function rankMatches(query: NormalizedPriceQuery, matches: LookupMatch[]) {
  return matches
    .map((match) => scoreMatch(query, match))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function decideResponseMode(
  query: NormalizedPriceQuery,
  matches: LookupMatch[]
): PriceCheckResult["responseMode"] {
  if (matches.length === 0) return "insufficient";

  const [first, second] = matches;
  const firstScore = first?.score ?? 0;
  const secondScore = second?.score ?? 0;

  if (!query.reference && !query.brand && query.imageHints.length === 0) {
    return "insufficient";
  }

  if (query.reference && firstScore >= 85 && firstScore - secondScore >= 12) {
    return "single_match";
  }

  if (query.reference && firstScore >= 65 && firstScore - secondScore >= 18) {
    return "single_match";
  }

  if (!query.reference && query.brand && firstScore >= 72 && firstScore - secondScore >= 20) {
    return "single_match";
  }

  return "candidate_list";
}
