import { hasTelegramBot, priceCheckConfig } from "./config";

export type TelegramIncomingMessage = {
  chatId: number;
  text: string;
  photoUrl?: string | null;
  fromId?: number | null;
};

type TelegramReplyOptions = {
  keyboard?: string[][];
  removeKeyboard?: boolean;
};

type TelegramPayload = {
  message?: {
    text?: string;
    caption?: string;
    photo?: Array<{ file_id?: string }>;
    chat?: { id?: number };
    from?: { id?: number };
  };
};

type TelegramGetFileResponse = {
  ok?: boolean;
  result?: {
    file_path?: string;
  };
};

async function resolveTelegramPhotoUrl(fileId: string) {
  if (!hasTelegramBot) return null;

  const response = await fetch(
    `https://api.telegram.org/bot${priceCheckConfig.telegramBotToken}/getFile?file_id=${encodeURIComponent(
      fileId
    )}`
  );

  if (!response.ok) return null;

  const body = (await response.json().catch(() => null)) as TelegramGetFileResponse | null;
  const filePath = body?.result?.file_path;
  if (!filePath) return null;

  return `https://api.telegram.org/file/bot${priceCheckConfig.telegramBotToken}/${filePath}`;
}

export async function parseTelegramUpdate(payload: unknown): Promise<TelegramIncomingMessage | null> {
  if (!payload || typeof payload !== "object") return null;
  const parsed = payload as TelegramPayload;

  const message = parsed.message;
  if (!message) return null;

  const chatId = message.chat?.id;
  if (typeof chatId !== "number") return null;

  const textSource =
    typeof message.text === "string"
      ? message.text
      : typeof message.caption === "string"
      ? message.caption
      : "";
  const text = textSource.trim();

  const photoFileId =
    Array.isArray(message.photo) && message.photo.length > 0
      ? message.photo[message.photo.length - 1]?.file_id
      : null;
  const photoUrl =
    typeof photoFileId === "string" ? await resolveTelegramPhotoUrl(photoFileId) : null;

  if (!text && !photoUrl) return null;

  const fromId = typeof message.from?.id === "number" ? message.from.id : null;

  return {
    chatId,
    text,
    photoUrl,
    fromId,
  };
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: TelegramReplyOptions
) {
  if (!hasTelegramBot) {
    throw new Error("Telegram bot token is not configured.");
  }

  const replyMarkup = options?.removeKeyboard
    ? { remove_keyboard: true }
    : options?.keyboard
    ? {
        keyboard: options.keyboard.map((row) => row.map((label) => ({ text: label }))),
        resize_keyboard: true,
        one_time_keyboard: false,
      }
    : undefined;

  const response = await fetch(
    `https://api.telegram.org/bot${priceCheckConfig.telegramBotToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${body}`);
  }
}

export async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption?: string
) {
  if (!hasTelegramBot) {
    throw new Error("Telegram bot token is not configured.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${priceCheckConfig.telegramBotToken}/sendPhoto`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendPhoto failed: ${body}`);
  }
}
