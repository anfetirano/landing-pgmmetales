import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import { PMR_COOKIE_NAME, isValidPmrSessionToken } from "@/lib/pmr-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(PMR_COOKIE_NAME)?.value;
  if (!isValidPmrSessionToken(token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await fetchQuery(api.pmr.getPanamaClientAlerts, {});
  return NextResponse.json({ ok: true, data: payload });
}
