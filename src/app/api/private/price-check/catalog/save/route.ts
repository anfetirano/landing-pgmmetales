import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import { priceCheckConfig } from "@/lib/price-check/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-price-check-token");
  if (!priceCheckConfig.privateApiToken || token !== priceCheckConfig.privateApiToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        tenantKey?: "co" | "pa";
        reference?: string;
        altReferences?: string[];
        brand?: string;
        canonicalName?: string;
        internalPrice?: number;
        samplePhotoUrl?: string;
        notes?: string;
        source?: "manual" | "pmr" | "ecotrade" | "confirmed_field";
        confidence?: "exact" | "probable" | "review_manually";
        createdByLabel?: string;
      }
    | null;

  if (!body?.canonicalName?.trim()) {
    return NextResponse.json(
      { ok: false, error: "canonicalName is required." },
      { status: 400 }
    );
  }

  if (typeof body.internalPrice !== "number" || body.internalPrice <= 0) {
    return NextResponse.json(
      { ok: false, error: "internalPrice must be a positive number." },
      { status: 400 }
    );
  }

  const id = await fetchMutation(api.catalogPieces.saveCatalogPiece, {
    tenantKey: body.tenantKey ?? priceCheckConfig.defaultTenant,
    reference: body.reference?.trim() || undefined,
    altReferences: body.altReferences?.filter(Boolean),
    brand: body.brand?.trim() || undefined,
    canonicalName: body.canonicalName.trim(),
    internalPrice: body.internalPrice,
    samplePhotoUrl: body.samplePhotoUrl?.trim() || undefined,
    notes: body.notes?.trim() || undefined,
    source: body.source ?? "manual",
    confidence: body.confidence ?? "probable",
    createdByLabel: body.createdByLabel?.trim() || undefined,
  });

  return NextResponse.json({ ok: true, id });
}
