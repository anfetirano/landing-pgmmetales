import { NextRequest, NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import { priceCheckConfig } from "@/lib/price-check/config";
import {
  handleTelegramConversation,
  isNewTelegramConsultationTrigger,
  persistCatalogSuggestionSession,
  startTelegramConsultation,
} from "@/lib/price-check/conversation";
import { runPriceCheck } from "@/lib/price-check/orchestrator";
import {
  parseTelegramUpdate,
  sendTelegramMessage,
  sendTelegramPhoto,
} from "@/lib/price-check/telegram";
import type { PriceCheckInput } from "@/lib/price-check/types";

export const dynamic = "force-dynamic";

function buildEvidenceCaption(sourceLabel: string, title: string, price: number | null) {
  const bits = [
    sourceLabel,
    title,
    typeof price === "number" ? `USD ${price.toFixed(2)}` : null,
  ].filter(Boolean);

  return bits.join(" · ");
}

function buildEvidenceUrl(match: { source: "catalog" | "pmr" | "ecotrade"; url: string | null }) {
  if (!match.url) return null;
  return match.source === "catalog" ? `Catálogo: ${match.url}` : `Abrir resultado: ${match.url}`;
}

function sourceWeight(source: "catalog" | "pmr" | "ecotrade") {
  if (source === "pmr") return 3;
  if (source === "ecotrade") return 2;
  return 1;
}

function sourceLabel(source: "catalog" | "pmr" | "ecotrade") {
  if (source === "pmr") return "PMR";
  if (source === "ecotrade") return "Ecotrade";
  return "Catálogo";
}

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

  if (message.fromId && isNewTelegramConsultationTrigger(message.text)) {
    const startReply = await startTelegramConsultation(
      String(message.fromId),
      message.chatId,
      priceCheckConfig.defaultTenant
    );

    if (startReply.type === "reply") {
      await sendTelegramMessage(message.chatId, startReply.text, {
        keyboard: startReply.keyboard,
        removeKeyboard: startReply.removeKeyboard,
      });
    }

    return NextResponse.json({ ok: true, conversation: true, started: true });
  }

  let runInput: PriceCheckInput = {
    channel: "telegram" as const,
    requesterId: message.fromId ? String(message.fromId) : null,
    requesterLabel: "Telegram buyer",
    tenantKey: priceCheckConfig.defaultTenant,
    queryText: message.text,
    photoUrl: message.photoUrl ?? null,
  };

  if (message.fromId) {
    const conversationReply = await handleTelegramConversation(
      String(message.fromId),
      message.chatId,
      {
        text: message.text,
        photoUrl: message.photoUrl ?? null,
      },
      priceCheckConfig.defaultTenant
    );

    if (conversationReply) {
      if (conversationReply.type === "reply") {
        await sendTelegramMessage(message.chatId, conversationReply.text, {
          keyboard: conversationReply.keyboard,
          removeKeyboard: conversationReply.removeKeyboard,
        });
        return NextResponse.json({ ok: true, conversation: true });
      }

      runInput = {
        ...conversationReply.input,
      };

      if (conversationReply.clearSession) {
        await fetchMutation(api.priceCheckSessions.clearTelegramSession, {
          requesterId: String(message.fromId),
        });
      }
    }
  }

  const result = await runPriceCheck(runInput);

  await fetchMutation(api.priceChecks.logPriceCheck, {
    channel: runInput.channel,
    requesterId: runInput.requesterId ?? undefined,
    requesterLabel: runInput.requesterLabel ?? undefined,
    tenantKey: runInput.tenantKey ?? undefined,
    queryText: runInput.queryText ?? "",
    photoUrl: runInput.photoUrl ?? undefined,
    catalogStatus: result.catalog.status,
    normalizedReference: result.normalizedQuery.reference ?? undefined,
    normalizedBrand: result.normalizedQuery.brand ?? undefined,
    pmrStatus: result.pmr.status,
    ecotradeStatus: result.ecotrade.status,
    overallConfidence: result.overallConfidence,
    summaryText: result.summaryText,
  });

  if (message.fromId) {
    await persistCatalogSuggestionSession(String(message.fromId), message.chatId, {
      ...runInput,
    }, result);
  }

  try {
    const replyText = result.shouldSuggestCatalogSave
      ? `${result.summaryText}\n\n¿La guardamos en el catálogo del país? Respóndeme SI o NO.`
      : result.summaryText;
    await sendTelegramMessage(message.chatId, replyText, {
      keyboard: result.shouldSuggestCatalogSave ? [["SI", "NO"], ["Nueva consulta"]] : [["Nueva consulta"]],
    });

    const evidenceMatches = [...result.pmr.matches, ...result.ecotrade.matches, ...result.catalog.matches]
      .filter((match) => Boolean(match.imageUrl))
      .sort((a, b) => {
        const sourceDiff = sourceWeight(b.source) - sourceWeight(a.source);
        if (sourceDiff !== 0) return sourceDiff;
        return (b.score ?? 0) - (a.score ?? 0);
      })
      .filter((match, index, array) =>
        array.findIndex((candidate) => candidate.imageUrl === match.imageUrl) === index
      )
      .slice(0, 2);

    for (const [index, match] of evidenceMatches.entries()) {
      if (!match.imageUrl) continue;
      const caption = buildEvidenceCaption(
        index === 0 ? `${sourceLabel(match.source)} evidencia` : sourceLabel(match.source),
        match.title,
        match.price
      );
      const evidenceUrl = buildEvidenceUrl(match);
      await sendTelegramPhoto(
        message.chatId,
        match.imageUrl,
        evidenceUrl ? `${caption}\n${evidenceUrl}` : caption
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Telegram reply failed.", data: result },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: result });
}
