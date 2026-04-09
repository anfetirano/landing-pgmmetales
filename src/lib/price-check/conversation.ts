import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import type { PriceCheckInput, PriceCheckResult } from "./types";

const YES_VALUES = new Set(["SI", "SÍ", "YES", "Y"]);
const NO_VALUES = new Set(["NO", "N"]);
const NEW_QUERY_VALUES = new Set(["NUEVA CONSULTA", "/START", "START"]);
const SKIP_IMAGE_VALUES = new Set(["NO TENGO IMAGEN", "SALTAR IMAGEN", "NO TENGO FOTO"]);
const NO_REFERENCE_VALUES = new Set(["SIN REFERENCIA", "NO TENGO REFERENCIA"]);
const NO_BRAND_VALUES = new Set(["SIN MARCA", "NO TENGO MARCA"]);
const CANCEL_VALUES = new Set(["CANCELAR", "CANCELAR CONSULTA"]);

export type TelegramConversationInput = {
  text: string;
  photoUrl?: string | null;
};

export type TelegramConversationResponse =
  | {
      type: "reply";
      text: string;
      keyboard?: string[][];
      removeKeyboard?: boolean;
    }
  | {
      type: "run_check";
      input: PriceCheckInput;
      clearSession?: boolean;
    };

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function cleanText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function parseClientPrice(text: string) {
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const price = Number(cleaned);
  if (Number.isNaN(price) || price <= 0) return null;
  return price;
}

function queryKeyboard() {
  return [["Nueva consulta"]];
}

function yesNoKeyboard() {
  return [["SI", "NO"], ["Nueva consulta"]];
}

function photoChoiceKeyboard() {
  return [["Sí, voy a enviarla", "No tengo imagen"], ["Cancelar consulta"]];
}

function uploadPhotoKeyboard() {
  return [["Saltar imagen"], ["Cancelar consulta"]];
}

function referenceKeyboard() {
  return [["Sin referencia"], ["Cancelar consulta"]];
}

function brandKeyboard() {
  return [["Sin marca"], ["Cancelar consulta"]];
}

function buildCatalogName(
  session: Awaited<ReturnType<typeof fetchQuery<typeof api.priceCheckSessions.getTelegramSession>>>
) {
  const brand = session?.candidateBrand ?? session?.normalizedBrand ?? "";
  const reference = session?.candidateReference ?? session?.normalizedReference ?? "";
  const title = session?.candidateTitle ?? "";

  if (title && !title.toLowerCase().includes("pending")) {
    return title;
  }

  return [brand, reference].filter(Boolean).join(" ").trim() || "Pieza catalogada";
}

function buildQueryText(reference?: string | null, brand?: string | null) {
  const bits = [];
  if (brand) bits.push(`Marca: ${brand}`);
  if (reference) bits.push(`Referencia: ${reference}`);
  return bits.join("\n");
}

async function clearSession(requesterId: string) {
  await fetchMutation(api.priceCheckSessions.clearTelegramSession, {
    requesterId,
  });
}

export async function startTelegramConsultation(
  requesterId: string,
  chatId: number,
  tenantKey: "co" | "pa"
): Promise<TelegramConversationResponse> {
  await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
    requesterId,
    chatId,
    tenantKey,
    step: "awaiting_photo_choice",
    queryText: "",
  });

  return {
    type: "reply",
    text: "Perfecto, vamos paso a paso. ¿Tienes imagen de la pieza?",
    keyboard: photoChoiceKeyboard(),
  };
}

export function isNewTelegramConsultationTrigger(text: string) {
  return NEW_QUERY_VALUES.has(normalize(text));
}

export async function handleTelegramConversation(
  requesterId: string,
  chatId: number,
  message: TelegramConversationInput,
  tenantKey: "co" | "pa"
): Promise<TelegramConversationResponse | null> {
  const session = await fetchQuery(api.priceCheckSessions.getTelegramSession, {
    requesterId,
  });

  if (!session) {
    return null;
  }

  const text = cleanText(message.text);
  const normalized = normalize(message.text);

  if (isNewTelegramConsultationTrigger(text)) {
    return await startTelegramConsultation(requesterId, chatId, tenantKey);
  }

  if (CANCEL_VALUES.has(normalized)) {
    await clearSession(requesterId);
    return {
      type: "reply",
      text: "Listo, cancelé esta consulta.",
      keyboard: queryKeyboard(),
    };
  }

  if (session.step === "awaiting_photo_choice") {
    if (message.photoUrl) {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_reference",
        queryText: "",
        photoUrl: message.photoUrl ?? undefined,
      });

      return {
        type: "reply",
        text: "Perfecto. Ahora envíame la referencia. Si no la tienes, escribe SIN REFERENCIA.",
        keyboard: referenceKeyboard(),
      };
    }

    if (normalized === "SÍ, VOY A ENVIARLA" || normalized === "SI, VOY A ENVIARLA") {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_photo_upload",
        queryText: "",
      });

      return {
        type: "reply",
        text: "Envíame la foto del catalizador. Si quieres seguir sin imagen, toca SALTAR IMAGEN.",
        keyboard: uploadPhotoKeyboard(),
      };
    }

    if (normalized === "NO TENGO IMAGEN") {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_reference",
        queryText: "",
      });

      return {
        type: "reply",
        text: "Perfecto. Envíame la referencia. Si no la tienes, escribe SIN REFERENCIA.",
        keyboard: referenceKeyboard(),
      };
    }

    return {
      type: "reply",
      text: "Respóndeme si tienes imagen o no. Puedes tocar uno de los botones.",
      keyboard: photoChoiceKeyboard(),
    };
  }

  if (session.step === "awaiting_photo_upload") {
    if (message.photoUrl) {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_reference",
        queryText: session.queryText,
        photoUrl: message.photoUrl ?? undefined,
        normalizedReference: session.normalizedReference ?? undefined,
        normalizedBrand: session.normalizedBrand ?? undefined,
        candidateTitle: session.candidateTitle ?? undefined,
        candidateReference: session.candidateReference ?? undefined,
        candidateBrand: session.candidateBrand ?? undefined,
        candidateConfidence: session.candidateConfidence ?? undefined,
      });

      return {
        type: "reply",
        text: "Perfecto. Ahora envíame la referencia. Si no la tienes, escribe SIN REFERENCIA.",
        keyboard: referenceKeyboard(),
      };
    }

    if (SKIP_IMAGE_VALUES.has(normalized)) {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_reference",
        queryText: session.queryText,
      });

      return {
        type: "reply",
        text: "Perfecto. Envíame la referencia. Si no la tienes, escribe SIN REFERENCIA.",
        keyboard: referenceKeyboard(),
      };
    }

    return {
      type: "reply",
      text: "Todavía estoy esperando la foto. Si no la vas a mandar, toca SALTAR IMAGEN.",
      keyboard: uploadPhotoKeyboard(),
    };
  }

  if (session.step === "awaiting_reference") {
    const reference = NO_REFERENCE_VALUES.has(normalized) ? "" : text;
    if (!reference && !NO_REFERENCE_VALUES.has(normalized)) {
      return {
        type: "reply",
        text: "Envíame la referencia o escribe SIN REFERENCIA.",
        keyboard: referenceKeyboard(),
      };
    }

    await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
      requesterId,
      chatId,
      tenantKey,
      step: "awaiting_brand",
      queryText: buildQueryText(reference || undefined, session.normalizedBrand ?? undefined),
      photoUrl: session.photoUrl ?? undefined,
      normalizedReference: reference || undefined,
      normalizedBrand: session.normalizedBrand ?? undefined,
      candidateTitle: session.candidateTitle ?? undefined,
      candidateReference: session.candidateReference ?? undefined,
      candidateBrand: session.candidateBrand ?? undefined,
      candidateConfidence: session.candidateConfidence ?? undefined,
    });

    return {
      type: "reply",
      text: "Ahora envíame la marca. Si no la tienes, escribe SIN MARCA.",
      keyboard: brandKeyboard(),
    };
  }

  if (session.step === "awaiting_brand") {
    const brand = NO_BRAND_VALUES.has(normalized) ? "" : text;
    if (!brand && !NO_BRAND_VALUES.has(normalized)) {
      return {
        type: "reply",
        text: "Envíame la marca o escribe SIN MARCA.",
        keyboard: brandKeyboard(),
      };
    }

    const queryText = buildQueryText(
      session.normalizedReference ?? undefined,
      brand || undefined
    );

    return {
      type: "run_check",
      input: {
        channel: "telegram",
        requesterId,
        requesterLabel: "Telegram buyer",
        tenantKey,
        queryText,
        photoUrl: session.photoUrl ?? null,
      },
      clearSession: true,
    };
  }

  if (session.step === "awaiting_save_confirmation") {
    if (YES_VALUES.has(normalized)) {
      await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
        requesterId,
        chatId,
        tenantKey,
        step: "awaiting_client_price",
        queryText: session.queryText,
        photoUrl: session.photoUrl,
        normalizedReference: session.normalizedReference,
        normalizedBrand: session.normalizedBrand,
        candidateTitle: session.candidateTitle,
        candidateReference: session.candidateReference,
        candidateBrand: session.candidateBrand,
        candidateConfidence: session.candidateConfidence,
      });

      return {
        type: "reply",
        text: "Perfecto. ¿Qué precio le ponemos al cliente? Envíamelo en USD, por ejemplo: 95",
        removeKeyboard: true,
      };
    }

    if (NO_VALUES.has(normalized)) {
      await clearSession(requesterId);

      return {
        type: "reply",
        text: "Listo, no la guardamos en catálogo por ahora.",
        keyboard: queryKeyboard(),
      };
    }

    return {
      type: "reply",
      text: "Respóndeme SI o NO para saber si guardamos esta pieza en el catálogo del país.",
      keyboard: yesNoKeyboard(),
    };
  }

  if (session.step === "awaiting_client_price") {
    const internalPrice = parseClientPrice(text);
    if (!internalPrice) {
      return {
        type: "reply",
        text: "No pude entender el precio. Envíamelo solo como número en USD, por ejemplo: 95",
        removeKeyboard: true,
      };
    }

    await fetchMutation(api.catalogPieces.saveCatalogPiece, {
      tenantKey,
      reference: session.candidateReference ?? session.normalizedReference ?? undefined,
      brand: session.candidateBrand ?? session.normalizedBrand ?? undefined,
      canonicalName: buildCatalogName(session),
      internalPrice,
      samplePhotoUrl: session.photoUrl ?? undefined,
      notes: `Guardada desde Telegram. Consulta original: ${session.queryText}`,
      source: "confirmed_field",
      confidence: session.candidateConfidence ?? "probable",
      createdByLabel: "Telegram buyer",
    });

    await clearSession(requesterId);

    return {
      type: "reply",
      text: "Perfecto, ya la guardé en el catálogo interno del país con ese precio.",
      keyboard: queryKeyboard(),
    };
  }

  return null;
}

export async function persistCatalogSuggestionSession(
  requesterId: string,
  chatId: number,
  input: PriceCheckInput,
  result: PriceCheckResult
) {
  if (!result.shouldSuggestCatalogSave) return;

  const mergedMatches = [result.catalog, result.pmr, result.ecotrade]
    .flatMap((source) => source.matches)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const topCandidate = mergedMatches[0];

  await fetchMutation(api.priceCheckSessions.upsertTelegramSession, {
    requesterId,
    chatId,
    tenantKey: input.tenantKey ?? "pa",
    step: "awaiting_save_confirmation",
    queryText: input.queryText ?? "",
    photoUrl: input.photoUrl ?? undefined,
    normalizedReference: result.normalizedQuery.reference ?? undefined,
    normalizedBrand: result.normalizedQuery.brand ?? undefined,
    candidateTitle: topCandidate?.title ?? undefined,
    candidateReference: topCandidate?.reference ?? undefined,
    candidateBrand: topCandidate?.brand ?? undefined,
    candidateConfidence: topCandidate?.confidence ?? undefined,
  });
}
