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
  - If the result is useful but not already in the internal catalog, the bot can ask:
    - `¿La guardamos en el catálogo del país?`
    - then:
      - `¿Qué precio le ponemos al cliente?`

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
  - real Ecotrade connector
- Returns a structured summary ready for Telegram
- Logs each request in Convex via `priceCheckRequests`
- Can restrict Telegram usage to a specific user id list

## Not implemented yet

- Real PMR authenticated login flow
- Real PMR candidate discovery and screenshots
- Ecotrade screenshots
- OCR / visual extraction from the catalyst photo
- Persistent audit log of requests

## Required secrets

See `.env.example` for:

- `PRICE_CHECK_PRIVATE_TOKEN`
- `PRICE_CHECK_DEFAULT_TENANT`
- `PMR_SUPPLIERS_USERNAME`
- `PMR_SUPPLIERS_PASSWORD`
- `ECOTRADE_USERNAME`
- `ECOTRADE_PASSWORD`
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

## Ecotrade connector behavior

- The backend now logs into Ecotrade with backend secrets.
- If a **reference** exists, it searches with:
  - `/en/search?search[keyword]=...`
- If there is **no reference** but there is a **brand**, it falls back to:
  - `/en/carbrand/{brand}`
- The current parser returns first-page candidates with:
  - reference
  - brand
  - price
  - product URL
- If Ecotrade exposes a usable product image, Telegram can now send up to 2 visual evidence images with the analysis.
- Full browser screenshots are still pending for a later step.

## PMR connector status

- The backend now performs the real PMR login form handshake.
- PMR search works through the authenticated **AJAX** endpoint on:
  - `/master`
- The current connector searches with:
  - `q[simple_sn_or_sn3_cont]` for serial/reference
  - `q[make_eq]` for brand
- The parser already extracts:
  - image
  - price
  - serial/reference
  - make/brand
  - grading category
  - catalog number
  - origin
- If the credentials are wrong, the connector surfaces the exact PMR message, for example:
  - `Login is not valid`
  - `Password is not valid`
- Full PMR screenshots are still pending for a later step.

## Telegram conversation flow

- Normal query arrives with:
  - photo
  - reference, brand, or both
- Bot replies with analysis
- If the piece is not yet in catalog but looks useful, it asks:
  - `¿La guardamos en el catálogo del país?`
- If the buyer answers `SI`:
  - bot asks:
    - `¿Qué precio le ponemos al cliente?`
- When the buyer sends the number, the piece is saved into the country catalog.

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
