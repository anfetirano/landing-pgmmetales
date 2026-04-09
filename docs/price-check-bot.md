# Price Check Bot Scaffold

This project now includes a private scaffold for a Telegram-first price confirmation bot.

## Endpoints

- `POST /api/private/price-check`
  - Protected with `x-price-check-token`
  - Intended for manual backend testing or future internal tooling

- `POST /api/private/price-check/catalog/save`
  - Protected with `x-price-check-token`
  - Saves a confirmed piece into the internal country catalog

- `POST /api/telegram/price-check`
  - Protected with Telegram webhook secret header
  - Accepts Telegram updates and replies with the current scaffolded summary

## Current behavior

- Normalizes incoming text into:
  - reference
  - brand
- Allows candidate-based queries without reference when the request includes:
  - brand
  - photo
- Prepares image hint extraction hook
- Calls:
  - PMR connector scaffold
  - Ecotrade connector scaffold
- Returns a structured summary ready for Telegram
- Logs each request in Convex via `priceCheckRequests`
- Can restrict Telegram usage to a specific user id list

## Not implemented yet

- Real PMR authenticated login flow
- Real Ecotrade scraping and result parsing
- Real PMR candidate discovery and screenshots
- Real Ecotrade candidate discovery and screenshots
- OCR / visual extraction from the catalyst photo
- Persistent audit log of requests

## Required secrets

See `.env.example` for:

- `PRICE_CHECK_PRIVATE_TOKEN`
- `PRICE_CHECK_DEFAULT_TENANT`
- `PMR_SUPPLIERS_USERNAME`
- `PMR_SUPPLIERS_PASSWORD`
- `TELEGRAM_PRICE_CHECK_BOT_TOKEN`
- `TELEGRAM_PRICE_CHECK_WEBHOOK_SECRET`
- `TELEGRAM_PRICE_CHECK_ALLOWED_USER_IDS`

## Testing the private endpoint

Example:

```bash
curl -X POST http://localhost:3000/api/private/price-check \
  -H "Content-Type: application/json" \
  -H "x-price-check-token: change-this-private-token" \
  -d '{
    "requesterId": "andres",
    "requesterLabel": "Andres Compra",
    "tenantKey": "pa",
    "queryText": "Toyota GD3A con foto",
    "photoUrl": "https://example.com/catalizador.jpg"
  }'
```

Brand + photo without reference is also valid:

```bash
curl -X POST http://localhost:3000/api/private/price-check \
  -H "Content-Type: application/json" \
  -H "x-price-check-token: change-this-private-token" \
  -d '{
    "requesterId": "andres",
    "requesterLabel": "Andres Compra",
    "tenantKey": "pa",
    "queryText": "Nissan sin referencia visible",
    "photoUrl": "https://example.com/catalizador.jpg"
  }'
```

## Internal catalog behavior

- The orchestrator now checks the **country catalog first**.
- If the piece already exists in the internal catalog for `pa` or `co`, that result should rank ahead of external references.
- If the bot finds useful PMR/Ecotrade evidence but **no internal catalog match**, it flags that the piece should be offered for saving into the local catalog with a chosen internal price.
- Catalog storage is now available in Convex via `catalogPieces`.

Example save:

```bash
curl -X POST http://localhost:3000/api/private/price-check/catalog/save \
  -H "Content-Type: application/json" \
  -H "x-price-check-token: change-this-private-token" \
  -d '{
    "tenantKey": "pa",
    "reference": "X3",
    "brand": "NISSAN",
    "canonicalName": "Nissan X3 75%",
    "internalPrice": 95,
    "samplePhotoUrl": "https://example.com/catalizador.jpg",
    "notes": "Pieza recurrente en Panama",
    "source": "confirmed_field",
    "confidence": "probable",
    "createdByLabel": "Andres Compra"
  }'
```
