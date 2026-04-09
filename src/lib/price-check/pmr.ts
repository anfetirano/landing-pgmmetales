import { hasPmrCredentials, priceCheckConfig } from "./config";
import type { LookupMatch, LookupResult, NormalizedPriceQuery } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function parseAuthenticityToken(html: string) {
  return (
    html.match(/name="authenticity_token"\s+value="([^"]+)"/i)?.[1] ??
    html.match(/meta name="csrf-token"\s+content="([^"]+)"/i)?.[1] ??
    null
  );
}

function parseLoginError(html: string) {
  return (
    html.match(/<li>([^<]+)<\/li>/i)?.[1]?.trim() ??
    html.match(/<div class="alert alert-danger">[\s\S]*?<li>([^<]+)<\/li>/i)?.[1]?.trim() ??
    null
  );
}

function absoluteUrl(path: string | null | undefined) {
  if (!path) return null;
  try {
    return new URL(path, priceCheckConfig.pmrBaseUrl).toString();
  } catch {
    return null;
  }
}

function cleanText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .trim();
}

function decodeJsHtmlString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\//g, "/");
}

function buildPmrSearchParams(query: NormalizedPriceQuery) {
  const params = new URLSearchParams();

  if (query.reference) {
    params.set("q[simple_sn_or_sn3_cont]", query.reference);
  }

  if (query.brand) {
    params.set("q[make_eq]", query.brand);
  }

  return params;
}

function parseAjaxHtml(payload: string) {
  const match = payload.match(/\$\('#products'\)\.html\("([\s\S]*)"\);\s*$/);
  if (!match?.[1]) return null;
  return decodeJsHtmlString(match[1]);
}

function parsePmrMatches(html: string) {
  const cards = html.split('<div class="col-lg-3 col-md-6 col-xs-12"');
  const matches: LookupMatch[] = [];

  for (const card of cards.slice(1)) {
    const imageUrl = absoluteUrl(
      card.match(/<img class="fit-cover"[^>]+src="([^"]+)"/i)?.[1] ?? null
    );
    const priceRaw = card.match(/\$\s*([0-9]+(?:\.[0-9]+)?)\s*USD/i)?.[1] ?? null;
    const brandHeading = cleanText(card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "");
    const serial = cleanText(
      card.match(/Serial:\s*([^<\n]+)/i)?.[1] ??
        card.match(/SN3?:\s*([^<\n]+)/i)?.[1] ??
        ""
    );
    const gradingCategory = cleanText(
      card.match(/Grading Category:\s*([^<]+)<\/span>/i)?.[1] ?? ""
    );
    const catalogNumber = cleanText(
      card.match(/Catalog No\.\s*([^<\n]+)/i)?.[1] ?? ""
    );
    const makeValue = cleanText(card.match(/Make:\s*([^<\n]+)/i)?.[1] ?? "");
    const originValue = cleanText(card.match(/Origin:\s*([^<\n]+)/i)?.[1] ?? "");
    const viewerUrl = absoluteUrl(
      card.match(/href="(\/photo_collections\/[^"]+\/viewer)"/i)?.[1] ?? null
    );

    const brand = makeValue || brandHeading || null;
    const reference = serial || null;
    const title = [brandHeading || brand, reference ? `Serial ${reference}` : null]
      .filter(Boolean)
      .join(" - ");

    if (!title && !reference && !brand) continue;

    matches.push({
      source: "pmr",
      title: title || "PMR match",
      reference,
      brand,
      price: priceRaw ? Number(priceRaw) : null,
      currency: "USD",
      confidence: "review_manually",
      url: viewerUrl ?? `${priceCheckConfig.pmrBaseUrl}/master`,
      imageUrl,
      notes: [
        gradingCategory ? `Grading Category: ${gradingCategory}` : null,
        catalogNumber ? `Catalog No.: ${catalogNumber}` : null,
        originValue ? `Origin: ${originValue}` : null,
      ].filter(Boolean) as string[],
    });
  }

  return matches;
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

async function loginToPmr() {
  const loginPageResponse = await fetch(`${priceCheckConfig.pmrBaseUrl}/`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!loginPageResponse.ok) {
    throw new Error(`PMR login page responded with ${loginPageResponse.status}.`);
  }

  const loginPageHtml = await loginPageResponse.text();
  const authenticityToken = parseAuthenticityToken(loginPageHtml);

  if (!authenticityToken) {
    throw new Error("PMR login token was not found.");
  }

  const loginPageCookies = getResponseCookies(loginPageResponse);
  const formBody = new URLSearchParams({
    authenticity_token: authenticityToken,
    "user_session[login]": priceCheckConfig.pmrUsername,
    "user_session[password]": priceCheckConfig.pmrPassword,
    commit: "Login",
  });

  const loginResponse = await fetch(`${priceCheckConfig.pmrBaseUrl}/user_sessions`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: mergeCookies(loginPageCookies),
    },
    body: formBody.toString(),
    redirect: "manual",
    cache: "no-store",
  });

  const loginHtml = await loginResponse.text();
  const loginCookies = getResponseCookies(loginResponse);
  const cookieHeader = mergeCookies(loginPageCookies, loginCookies);

  if (/PMR Supplier Services \| Login/i.test(loginHtml)) {
    const loginError = parseLoginError(loginHtml) ?? "PMR rejected the supplied credentials.";
    throw new Error(loginError);
  }

  return { cookieHeader, html: loginHtml };
}

async function fetchPmrSearchResults(
  query: NormalizedPriceQuery,
  cookieHeader: string
) {
  const params = buildPmrSearchParams(query);
  const response = await fetch(
    `${priceCheckConfig.pmrBaseUrl}/master?${params.toString()}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${priceCheckConfig.pmrBaseUrl}/master`,
        Cookie: cookieHeader,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`PMR search responded with ${response.status}.`);
  }

  const payload = await response.text();
  const html = parseAjaxHtml(payload);

  if (!html) {
    throw new Error("PMR search payload could not be decoded.");
  }

  return html;
}

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

  if (query.searchMode === "insufficient" || query.searchMode === "photo_only") {
    return {
      source: "pmr",
      status: "not_found",
      message:
        "PMR needs at least a brand or a reference. Photo-only search is not ready yet.",
      matches: [],
    };
  }

  try {
    const { cookieHeader } = await loginToPmr();
    const resultsHtml = await fetchPmrSearchResults(query, cookieHeader);
    const matches = parsePmrMatches(resultsHtml);

    if (matches.length === 0) {
      return {
        source: "pmr",
        status: "not_found",
        message: "PMR login worked, but the current search returned no products.",
        matches: [],
      };
    }

    return {
      source: "pmr",
      status: "ok",
      message: `PMR returned ${matches.length} candidate(s) from the authenticated catalog.`,
      matches: matches.slice(0, 12),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PMR authentication error.";

    return {
      source: "pmr",
      status: "error",
      message: `PMR lookup failed: ${message}`,
      matches: [],
    };
  }
}
