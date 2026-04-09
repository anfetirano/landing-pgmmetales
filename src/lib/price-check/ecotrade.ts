import { hasEcotradeCredentials, priceCheckConfig } from "./config";
import type { LookupMatch, LookupResult, NormalizedPriceQuery } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const ECOTRADE_BOOT_PAGES = [
  "/en/",
  "/es/catalogo-de-convertidores-catal%C3%ADticos",
];

const BRAND_SLUGS: Record<string, string> = {
  AUDI: "audi",
  BMW: "bmw",
  CHEVROLET: "chevrolet",
  DODGE: "dodge",
  FORD: "ford",
  HONDA: "honda",
  HYUNDAI: "hyundai",
  ISUZU: "isuzu",
  JEEP: "jeep",
  KIA: "kia",
  MAZDA: "mazda",
  MERCEDES: "mercedes-benz",
  MITSUBISHI: "mitsubishi",
  NISSAN: "nissan",
  RENAULT: "renault",
  SUBARU: "subaru",
  SUZUKI: "suzuki",
  TOYOTA: "toyota",
  VOLKSWAGEN: "volkswagen",
  VW: "volkswagen",
};

type SearchContext = {
  pageKind: "reference_search" | "brand_page";
  queryLabel: string;
  page: string;
};

function absoluteUrl(path: string | null | undefined) {
  if (!path) return null;
  try {
    return new URL(path, priceCheckConfig.ecotradeBaseUrl).toString();
  } catch {
    return null;
  }
}

function decodeEntities(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value: string | null | undefined) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string | null | undefined) {
  return (value ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function getResponseCookies(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const rawCookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

  const cookies = new Map<string, string>();

  for (const cookie of rawCookies) {
    const [nameValue] = cookie.split(";");
    if (!nameValue) continue;
    const separatorIndex = nameValue.indexOf("=");
    if (separatorIndex <= 0) continue;
    const name = nameValue.slice(0, separatorIndex).trim();
    const value = nameValue.slice(separatorIndex + 1).trim();
    if (name && value) {
      cookies.set(name, value);
    }
  }

  return cookies;
}

function mergeCookies(...maps: Map<string, string>[]) {
  const merged = new Map<string, string>();
  for (const map of maps) {
    for (const [name, value] of map.entries()) {
      merged.set(name, value);
    }
  }
  return Array.from(merged.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function parseCsrfToken(html: string) {
  return (
    html.match(/name="_csrf_token"\s+value="([^"]+)"/i)?.[1] ??
    html.match(/name='_csrf_token'\s+value='([^']+)'/i)?.[1] ??
    null
  );
}

function isSubscriptionPage(html: string) {
  return /Ecotrade Group \| Subscriptions/i.test(html);
}

function buildSearchContexts(query: NormalizedPriceQuery) {
  const contexts: SearchContext[] = [];

  if (query.reference) {
    const search = new URL(`${priceCheckConfig.ecotradeBaseUrl}/en/search`);
    search.searchParams.set("search[keyword]", query.reference);
    contexts.push({
      pageKind: "reference_search",
      queryLabel: query.reference,
      page: search.toString(),
    });
  }

  if (!query.reference && query.brand) {
    const brandSlug = BRAND_SLUGS[query.brand];
    if (brandSlug) {
      contexts.push({
        pageKind: "brand_page",
        queryLabel: query.brand,
        page: `${priceCheckConfig.ecotradeBaseUrl}/en/carbrand/${brandSlug}`,
      });
    }
  }

  return contexts;
}

function extractMatchesFromHtml(html: string, query: NormalizedPriceQuery) {
  const rawMatches: LookupMatch[] = [];
  const seen = new Set<string>();
  const anchorPattern =
    /<a class="position-relative d-block overflow-hidden text-reset" href="([^"]+)" title="([^"]+)"/g;

  for (const anchor of html.matchAll(anchorPattern)) {
    const href = anchor[1] ?? "";
    if (!href.includes("/en/product/")) continue;

    const dedupeKey = href;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const anchorIndex = anchor.index ?? 0;
    const start = Math.max(0, anchorIndex - 1800);
    const end = Math.min(html.length, anchorIndex + 2800);
    const window = html.slice(start, end);

    const hiddenReference =
      window.match(/name="name"\s+class="name"\s+value="([^"]+)"/i)?.[1] ?? null;
    const visibleTitle = cleanText(anchor[2]);
    const reference = hiddenReference ?? visibleTitle ?? null;
    const hiddenBrand =
      window.match(/name="brand"\s+value="([^"]+)"/i)?.[1] ??
      window.match(/alt="([^"]+)"\s+title="[^"]*">\s*<\/div>\s*<div class="col text-end/i)?.[1] ??
      null;
    const hiddenPrice =
      window.match(/name="price"\s+value="([^"]+)"/i)?.[1] ??
      window.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/)?.[1] ??
      null;
    const imagePath =
      window.match(/background-image:\s*url\('([^']+)'\)/i)?.[1] ??
      window.match(/<img[^>]+src="([^"]+)"[^>]*>/i)?.[1] ??
      null;

    const titleParts = [hiddenBrand, visibleTitle].filter(Boolean);
    const title = titleParts.join(" - ") || reference || "Ecotrade candidate";

    const notes = [
      query.reference ? `Matched from Ecotrade search: ${query.reference}` : null,
      !query.reference && query.brand
        ? `Matched from Ecotrade brand page: ${query.brand}`
        : null,
      hiddenBrand && query.brand && compact(hiddenBrand) === compact(query.brand)
        ? "Brand matched in Ecotrade"
        : null,
      imagePath && !/mascot/i.test(imagePath)
        ? "Ecotrade image available"
        : null,
    ].filter(Boolean) as string[];

    rawMatches.push({
      source: "ecotrade",
      title,
      reference,
      brand: hiddenBrand,
      price: hiddenPrice ? Number(hiddenPrice) : null,
      currency: "USD",
      confidence: "review_manually",
      url: absoluteUrl(href),
      imageUrl:
        imagePath && !/mascot/i.test(imagePath) ? absoluteUrl(imagePath) : null,
      notes,
    });
  }

  if (query.brand) {
    const sameBrand = rawMatches.filter(
      (match) => compact(match.brand) === compact(query.brand)
    );
    if (sameBrand.length > 0) {
      return sameBrand;
    }
  }

  return rawMatches;
}

function parseProductImage(html: string) {
  return (
    html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] ??
    html.match(/"image":\s*\[\s*"([^"]+)"/i)?.[1] ??
    html.match(/"image":\s*"([^"]+)"/i)?.[1] ??
    null
  );
}

async function loginToEcotrade() {
  let homeHtml = "";
  let homeCookies = new Map<string, string>();
  let csrfToken: string | null = null;
  let lastStatus: number | null = null;

  for (const page of ECOTRADE_BOOT_PAGES) {
    const homeResponse = await fetch(`${priceCheckConfig.ecotradeBaseUrl}${page}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        Referer: priceCheckConfig.ecotradeBaseUrl,
      },
      cache: "no-store",
    });

    lastStatus = homeResponse.status;
    if (!homeResponse.ok) {
      continue;
    }

    homeHtml = await homeResponse.text();
    homeCookies = getResponseCookies(homeResponse);
    csrfToken = parseCsrfToken(homeHtml);

    if (csrfToken) {
      break;
    }
  }

  if (!csrfToken) {
    throw new Error(
      lastStatus
        ? `Ecotrade home responded with ${lastStatus}.`
        : "Ecotrade login form token was not found."
    );
  }

  const loginBody = new URLSearchParams({
    _username: priceCheckConfig.ecotradeUsername,
    _password: priceCheckConfig.ecotradePassword,
    _csrf_token: csrfToken,
  });

  const loginResponse = await fetch(`${priceCheckConfig.ecotradeBaseUrl}/login`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: mergeCookies(homeCookies),
      Referer: `${priceCheckConfig.ecotradeBaseUrl}/login`,
    },
    body: loginBody.toString(),
    redirect: "manual",
    cache: "no-store",
  });

  const loginCookies = getResponseCookies(loginResponse);
  const cookieHeader = mergeCookies(homeCookies, loginCookies);

  const confirmResponse = await fetch(`${priceCheckConfig.ecotradeBaseUrl}/en/`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      Cookie: cookieHeader,
      Referer: `${priceCheckConfig.ecotradeBaseUrl}/login`,
    },
    cache: "no-store",
  });

  const confirmHtml = await confirmResponse.text();
  const isLoggedIn = /sign out|logout/i.test(confirmHtml);

  if (!isLoggedIn) {
    throw new Error("Ecotrade login did not create a valid session.");
  }

  return cookieHeader;
}

async function fetchEcotradePage(url: string, cookieHeader: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Ecotrade page ${url} responded with ${response.status}.`);
  }

  return await response.text();
}

async function enrichMatchWithProductImage(match: LookupMatch, cookieHeader: string) {
  if (!match.url || match.imageUrl) return match;

  try {
    const html = await fetchEcotradePage(match.url, cookieHeader);
    const productImage = absoluteUrl(parseProductImage(html));

    if (!productImage) return match;

    return {
      ...match,
      imageUrl: productImage,
      notes: [...match.notes, "Ecotrade product image loaded"],
    };
  } catch {
    return match;
  }
}

export async function lookupInEcotrade(
  query: NormalizedPriceQuery
): Promise<LookupResult> {
  if (!hasEcotradeCredentials) {
    return {
      source: "ecotrade",
      status: "not_configured",
      message: "Ecotrade credentials are not configured in the backend secrets.",
      matches: [],
    };
  }

  if (query.searchMode === "insufficient" || query.searchMode === "photo_only") {
    return {
      source: "ecotrade",
      status: "not_found",
      message:
        "Ecotrade needs at least a brand or a reference. Photo-only search is not ready yet.",
      matches: [],
    };
  }

  const contexts = buildSearchContexts(query);

  if (contexts.length === 0) {
    return {
      source: "ecotrade",
      status: "not_found",
      message: "Ecotrade could not build a valid search from this query yet.",
      matches: [],
    };
  }

  try {
    const cookieHeader = await loginToEcotrade();
    const combinedMatches: LookupMatch[] = [];

    for (const context of contexts) {
      const html = await fetchEcotradePage(context.page, cookieHeader);

      if (isSubscriptionPage(html)) {
        return {
          source: "ecotrade",
          status: "not_configured",
          message:
            "Ecotrade redirected this lookup to subscriptions. The account likely needs paid access for this search.",
          matches: [],
        };
      }

      const pageMatches = extractMatchesFromHtml(html, query).map((match) => ({
        ...match,
        notes: [
          ...match.notes,
          context.pageKind === "reference_search"
            ? `Ecotrade query: ${context.queryLabel}`
            : `Ecotrade brand page: ${context.queryLabel}`,
          /rel="next"/i.test(html) ? "Ecotrade has more result pages." : null,
        ].filter(Boolean) as string[],
      }));

      combinedMatches.push(...pageMatches);

      if (pageMatches.length > 0 && context.pageKind === "reference_search") {
        break;
      }
    }

    const dedupedMatches = Array.from(
      new Map(
        combinedMatches.map((match) => [
          `${compact(match.brand)}::${compact(match.reference)}::${match.url}`,
          match,
        ])
      ).values()
    );

    if (dedupedMatches.length === 0) {
      return {
        source: "ecotrade",
        status: "not_found",
        message:
          "Ecotrade login worked, but this query did not return candidates on the first page.",
        matches: [],
      };
    }

    const enrichedMatches = await Promise.all(
      dedupedMatches.slice(0, 8).map((match) =>
        enrichMatchWithProductImage(match, cookieHeader)
      )
    );

    return {
      source: "ecotrade",
      status: "ok",
      message: `Ecotrade returned ${dedupedMatches.length} candidate(s) from the current lookup.`,
      matches: [...enrichedMatches, ...dedupedMatches.slice(8)].slice(0, 12),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Ecotrade error.";

    return {
      source: "ecotrade",
      status: "error",
      message: `Ecotrade lookup failed: ${message}`,
      matches: [],
    };
  }
}
