export const priceCheckConfig = {
  privateApiToken: process.env.PRICE_CHECK_PRIVATE_TOKEN ?? "",
  connectorMode: process.env.PRICE_CHECK_CONNECTOR_MODE ?? "stub",
  defaultTenant:
    process.env.PRICE_CHECK_DEFAULT_TENANT === "co" ? "co" : "pa",
  pmrBaseUrl: process.env.PMR_SUPPLIERS_BASE_URL ?? "https://suppliers.pmrcc.com",
  pmrUsername: process.env.PMR_SUPPLIERS_USERNAME ?? "",
  pmrPassword: process.env.PMR_SUPPLIERS_PASSWORD ?? "",
  ecotradeBaseUrl:
    process.env.ECOTRADE_BASE_URL ??
    "https://www.ecotradegroup.com/es/catalogo-de-convertidores-cataliticos",
  telegramBotToken: process.env.TELEGRAM_PRICE_CHECK_BOT_TOKEN ?? "",
  telegramWebhookSecret: process.env.TELEGRAM_PRICE_CHECK_WEBHOOK_SECRET ?? "",
  telegramAllowedUserIds:
    process.env.TELEGRAM_PRICE_CHECK_ALLOWED_USER_IDS?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [],
} as const;

export const hasTelegramBot = Boolean(priceCheckConfig.telegramBotToken);
export const hasPmrCredentials = Boolean(
  priceCheckConfig.pmrUsername && priceCheckConfig.pmrPassword
);
