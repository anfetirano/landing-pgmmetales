import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import { priceCheckConfig } from "@/lib/price-check/config";
import { runPriceCheck } from "@/lib/price-check/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-price-check-token");
  if (!priceCheckConfig.privateApiToken || token !== priceCheckConfig.privateApiToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        requesterId?: string;
        requesterLabel?: string;
        tenantKey?: "co" | "pa";
        queryText?: string;
        photoUrl?: string | null;
      }
    | null;

  if (!body?.queryText?.trim() && !body?.photoUrl) {
    return NextResponse.json(
      { ok: false, error: "queryText or photoUrl is required." },
      { status: 400 }
    );
  }

  const result = await runPriceCheck({
    channel: "private_api",
    requesterId: body.requesterId ?? null,
    requesterLabel: body.requesterLabel ?? null,
    tenantKey: body.tenantKey ?? priceCheckConfig.defaultTenant,
    queryText: body.queryText ?? "",
    photoUrl: body.photoUrl ?? null,
  });

  await fetchMutation(api.priceChecks.logPriceCheck, {
    channel: "private_api",
    requesterId: body.requesterId ?? undefined,
    requesterLabel: body.requesterLabel ?? undefined,
    tenantKey: body.tenantKey ?? priceCheckConfig.defaultTenant,
    queryText: body.queryText ?? "",
    photoUrl: body.photoUrl ?? undefined,
    catalogStatus: result.catalog.status,
    normalizedReference: result.normalizedQuery.reference ?? undefined,
    normalizedBrand: result.normalizedQuery.brand ?? undefined,
    pmrStatus: result.pmr.status,
    ecotradeStatus: result.ecotrade.status,
    overallConfidence: result.overallConfidence,
    summaryText: result.summaryText,
  });

  return NextResponse.json({ ok: true, data: result });
}
