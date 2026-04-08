import { query } from "./_generated/server";
import { sameTenantKey } from "./tenants";

const PANAMA_TENANT_KEY = "pa" as const;

const buildPanamaBuyerNameMap = (
  users: Array<{ _id: unknown; role: "admin" | "buyer"; tenantKey?: "co" | "pa"; name: string }>
) => {
  const buyerNameById = new Map<string, string>();
  for (const user of users) {
    if (user.role !== "buyer") continue;
    if (!sameTenantKey(user.tenantKey, PANAMA_TENANT_KEY)) continue;
    buyerNameById.set(String(user._id), user.name ?? "Buyer");
  }
  return buyerNameById;
};

export const getPanamaControlData = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const since7d = now - 7 * dayMs;
    const since30d = now - 30 * dayMs;

    const [users, clientsRaw, purchasesRaw, lotsRaw] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("clients").collect(),
      ctx.db.query("purchases").collect(),
      ctx.db.query("lots").collect(),
    ]);

    const buyerNameById = buildPanamaBuyerNameMap(users);

    const clients = clientsRaw.filter((client) =>
      sameTenantKey(client.tenantKey, PANAMA_TENANT_KEY)
    );
    const clientsById = new Map(clients.map((client) => [String(client._id), client]));

    const lotsById = new Map(
      lotsRaw
        .filter((lot) => sameTenantKey(lot.tenantKey, PANAMA_TENANT_KEY))
        .map((lot) => [String(lot._id), lot.number])
    );

    const purchases = purchasesRaw.filter((purchase) =>
      sameTenantKey(purchase.tenantKey, PANAMA_TENANT_KEY)
    );

    const totalInvested = purchases.reduce((sum, purchase) => sum + (purchase.total ?? 0), 0);
    const totalPaidToClients = purchases.reduce((sum, purchase) => sum + (purchase.pricePaid ?? 0), 0);
    const totalPmrCatalogValue = purchases.reduce(
      (sum, purchase) => sum + (purchase.pmrCatalogValue ?? 0),
      0
    );
    const valuedPurchasesCount = purchases.filter(
      (purchase) => typeof purchase.pmrCatalogValue === "number" && purchase.pmrCatalogValue > 0
    ).length;
    const pendingPmrValuationCount = Math.max(0, purchases.length - valuedPurchasesCount);
    const invested30d = purchases
      .filter((purchase) => (purchase.createdAt ?? 0) >= since30d)
      .reduce((sum, purchase) => sum + (purchase.total ?? 0), 0);
    const looseMaterialPurchases = purchases.filter((purchase) => purchase.type === "suelto");
    const totalLooseMaterialGrams = looseMaterialPurchases.reduce(
      (sum, purchase) => sum + (purchase.grams ?? 0),
      0
    );
    const totalLooseMaterialKilos = totalLooseMaterialGrams / 1000;

    const buyersActive = new Set(
      purchases.map((purchase) => String(purchase.buyerId)).filter((id) => buyerNameById.has(id))
    ).size;

    const clientsWithLocation = clients.filter(
      (client) => typeof client.lat === "number" && typeof client.lng === "number"
    );

    const clientCards = await Promise.all(
      [...clients]
        .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))
        .map(async (client) => ({
          _id: client._id,
          name: client.name,
          contactName: client.contactName,
          buyerName: buyerNameById.get(String(client.buyerId)) ?? "Buyer",
          phone: client.phone,
          lat: client.lat,
          lng: client.lng,
          photoUrl: client.photoId ? await ctx.storage.getUrl(client.photoId) : null,
          createdAt: client._creationTime ?? now,
          isEmergency: client.isEmergency === true,
        }))
    );

    const purchaseCards = [...purchases]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .map((purchase) => {
        const client = clientsById.get(String(purchase.clientId));
        const fallbackClientName = client?.name?.trim() || client?.contactName?.trim() || "Unregistered client";
        return {
          _id: purchase._id,
          createdAt: purchase.createdAt ?? now,
          type: purchase.type,
          brand: purchase.brand,
          model: purchase.model,
          grams: purchase.grams,
          pricePaid: purchase.pricePaid,
          commission: purchase.commission,
          total: purchase.total,
          pmrCatalogValue: purchase.pmrCatalogValue ?? null,
          buyerName: buyerNameById.get(String(purchase.buyerId)) ?? "Buyer",
          clientName: fallbackClientName,
          clientContactName: client?.contactName,
          clientRegistered: Boolean(client),
          clientIsEmergency: client?.isEmergency === true,
          lotNumber: lotsById.get(String(purchase.lotId)) ?? null,
        };
      });

    return {
      generatedAt: now,
      summary: {
        totalClients: clients.length,
        clientsAdded7d: clients.filter((client) => (client._creationTime ?? 0) >= since7d).length,
        clientsAdded30d: clients.filter((client) => (client._creationTime ?? 0) >= since30d).length,
        totalPurchases: purchases.length,
        purchases7d: purchases.filter((purchase) => (purchase.createdAt ?? 0) >= since7d).length,
        purchases30d: purchases.filter((purchase) => (purchase.createdAt ?? 0) >= since30d).length,
        totalInvested,
        invested30d,
        totalPaidToClients,
        totalPmrCatalogValue,
        valuedPurchasesCount,
        pendingPmrValuationCount,
        totalLooseMaterialGrams,
        totalLooseMaterialKilos,
        totalLooseMaterialPurchases: looseMaterialPurchases.length,
        buyersActive,
      },
      clients: clientCards,
      purchases: purchaseCards,
      mapClients: clientsWithLocation.map((client) => ({
        _id: client._id,
        name: client.name,
        contactName: client.contactName,
        buyerName: buyerNameById.get(String(client.buyerId)) ?? "Buyer",
        phone: client.phone,
        lat: client.lat,
        lng: client.lng,
      })),
    };
  },
});

export const getPanamaClientAlerts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const [users, clientsRaw] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("clients").collect(),
    ]);

    const buyerNameById = buildPanamaBuyerNameMap(users);
    const clients = clientsRaw
      .filter((client) => sameTenantKey(client.tenantKey, PANAMA_TENANT_KEY))
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))
      .slice(0, 60)
      .map((client) => ({
        _id: client._id,
        name: client.name,
        contactName: client.contactName,
        buyerName: buyerNameById.get(String(client.buyerId)) ?? "Buyer",
        createdAt: client._creationTime ?? now,
      }));

    return {
      generatedAt: now,
      totalClients: clientsRaw.filter((client) => sameTenantKey(client.tenantKey, PANAMA_TENANT_KEY)).length,
      latestClients: clients,
    };
  },
});
