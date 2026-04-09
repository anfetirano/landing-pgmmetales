import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import { priceCheckConfig } from "@/lib/price-check/config";
import { runPriceCheck } from "@/lib/price-check/orchestrator";
import { parseTelegramUpdate, sendTelegramMessage } from "@/lib/price-check/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (
    !priceCheckConfig.telegramWebhookSecret ||
    secret !== priceCheckConfig.telegramWebhookSecret
  ) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const message = await parseTelegramUpdate(payload);

  if (!message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (
    priceCheckConfig.telegramAllowedUserIds.length > 0 &&
    (!message.fromId ||
      !priceCheckConfig.telegramAllowedUserIds.includes(String(message.fromId)))
  ) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const result = await runPriceCheck({
    channel: "telegram",
    requesterId: message.fromId ? String(message.fromId) : null,
    requesterLabel: "Telegram buyer",
    tenantKey: priceCheckConfig.defaultTenant,
    queryText: message.text,
    photoUrl: message.photoUrl ?? null,
  });

  await fetchMutation(api.priceChecks.logPriceCheck, {
    channel: "telegram",
    requesterId: message.fromId ? String(message.fromId) : undefined,
    requesterLabel: "Telegram buyer",
    tenantKey: priceCheckConfig.defaultTenant,
    queryText: message.text,
    photoUrl: message.photoUrl ?? undefined,
    catalogStatus: result.catalog.status,
    normalizedReference: result.normalizedQuery.reference ?? undefined,
    normalizedBrand: result.normalizedQuery.brand ?? undefined,
    pmrStatus: result.pmr.status,
    ecotradeStatus: result.ecotrade.status,
    overallConfidence: result.overallConfidence,
    summaryText: result.summaryText,
  });

  try {
    await sendTelegramMessage(message.chatId, result.summaryText);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Telegram reply failed.", data: result },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: result });
}
