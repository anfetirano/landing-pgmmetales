import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

export const dynamic = "force-dynamic";

type TrackViewBody = {
  kind?: "buyer" | "internal";
  shareToken?: string;
};

const normalizeCountryCode = (value?: string | null) => {
  const normalized = (value ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return undefined;
  }
  if (normalized === "XX" || normalized === "ZZ" || normalized === "T1") {
    return undefined;
  }
  return normalized;
};

const getApproximateCountryCode = (req: NextRequest) =>
  normalizeCountryCode(req.headers.get("x-vercel-ip-country")) ??
  normalizeCountryCode(req.headers.get("cf-ipcountry")) ??
  normalizeCountryCode(req.headers.get("x-country-code"));

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as TrackViewBody | null;
  const shareToken = body?.shareToken?.trim();
  const kind = body?.kind;

  if (!shareToken || (kind !== "buyer" && kind !== "internal")) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const countryCode = getApproximateCountryCode(req);

  if (kind === "buyer") {
    await fetchMutation(api.quotations.trackSharedQuotationView, {
      shareToken,
      countryCode,
    });
  } else {
    await fetchMutation(api.quotations.trackInternalSharedQuotationView, {
      shareToken,
      countryCode,
    });
  }

  return NextResponse.json({ ok: true });
}
