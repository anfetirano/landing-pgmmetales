import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

const normalizeClientNameKey = (value: string | undefined | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const createPurchase = mutation({
  args: {
    buyerId: v.id("users"),
    clientId: v.id("clients"),
    lotId: v.id("lots"),
    type: v.union(v.literal("pieza"), v.literal("suelto")),
    brand: v.string(),
    model: v.optional(v.string()),
    grams: v.optional(v.number()),
    pricePaid: v.number(),
    commission: v.number(),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) throw new Error("Comprador no encontrado.");
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Cliente no encontrado.");
    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") throw new Error("Lote no válido.");

    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const canUseClient =
      tenantKey === "pa"
        ? sameTenantKey(client.tenantKey, tenantKey)
        : client.buyerId === args.buyerId;

    if (!canUseClient) {
      throw new Error("Cliente no corresponde al comprador.");
    }

    if (!sameTenantKey(client.tenantKey, tenantKey) || !sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const total = args.pricePaid + args.commission;
    return await ctx.db.insert("purchases", {
      ...args,
      total,
      status: "open",
      createdAt: Date.now(),
      tenantKey,
    });
  },
});

export const deleteOpenPurchase = mutation({
  args: {
    purchaseId: v.id("purchases"),
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) throw new Error("No autorizado.");
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Compra no encontrada.");
    if (purchase.buyerId !== args.buyerId) throw new Error("No autorizado.");
    if (!sameTenantKey(purchase.tenantKey, tenantKey)) throw new Error("No autorizado.");
    if (purchase.status === "closed") throw new Error("Compra ya cerrada.");

    if (purchase.photoId) {
      await ctx.storage.delete(purchase.photoId);
    }

    await ctx.db.delete(args.purchaseId);
    return { ok: true };
  },
});

// NUEVO: borrado por administrador (sin restricción de estado)
export const deletePurchaseAsAdmin = mutation({
  args: {
    purchaseId: v.id("purchases"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede borrar compras.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Compra no encontrada.");
    if (!sameTenantKey(purchase.tenantKey, tenantKey)) throw new Error("No autorizado.");

    if (purchase.photoId) {
      await ctx.storage.delete(purchase.photoId);
    }

    await ctx.db.delete(args.purchaseId);
    return { ok: true };
  },
});

export const listOpenByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "open"), q.eq(q.field("status"), undefined))
      )
      .collect();

    const withUrls = await Promise.all(
      items.filter((p) => sameTenantKey(p.tenantKey, tenantKey)).map(async (p) => {
        const photoUrl = p.photoId ? await ctx.storage.getUrl(p.photoId) : null;
        return { ...p, photoUrl };
      })
    );

    return withUrls;
  },
});

export const listByBuyerAndDate = query({
  args: {
    buyerId: v.id("users"),
    dateFrom: v.number(),
    dateTo: v.number(),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) =>
        q.and(q.gte(q.field("createdAt"), args.dateFrom), q.lt(q.field("createdAt"), args.dateTo))
      )
      .collect();

    const withUrls = await Promise.all(
      items.filter((p) => sameTenantKey(p.tenantKey, tenantKey)).map(async (p) => {
        const photoUrl = p.photoId ? await ctx.storage.getUrl(p.photoId) : null;
        return { ...p, photoUrl };
      })
    );

    return withUrls;
  },
});

export const listLatestByBuyer = query({
  args: {
    buyerId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const sorted = items
      .filter((p) => sameTenantKey(p.tenantKey, tenantKey))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, args.limit);

    const withUrls = await Promise.all(
      sorted.map(async (p) => {
        const photoUrl = p.photoId ? await ctx.storage.getUrl(p.photoId) : null;
        return { ...p, photoUrl };
      })
    );

    return withUrls;
  },
});

export const getClientSheetByBuyer = query({
  args: {
    buyerId: v.id("users"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) throw new Error("Comprador no encontrado.");
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Cliente no encontrado.");
    if (!sameTenantKey(client.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }
    if (tenantKey !== "pa" && client.buyerId !== args.buyerId) {
      throw new Error("No autorizado.");
    }

    const selectedNameKey = normalizeClientNameKey(client.name);
    const scopedClients =
      tenantKey === "pa"
        ? await ctx.db.query("clients").collect()
        : await ctx.db
            .query("clients")
            .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
            .collect();

    const selectedIsEmergency = client.isEmergency === true;
    const relatedClientIds = scopedClients
      .filter(
        (item) =>
          sameTenantKey(item.tenantKey, tenantKey) &&
          normalizeClientNameKey(item.name) === selectedNameKey &&
          (selectedIsEmergency ? item._id === args.clientId : item.isEmergency !== true)
      )
      .map((item) => item._id);

    if (!relatedClientIds.some((id) => id === args.clientId)) {
      relatedClientIds.push(args.clientId);
    }

    const purchasesGroups = await Promise.all(
      relatedClientIds.map((clientId) =>
        ctx.db
          .query("purchases")
          .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
          .collect()
      )
    );
    const purchases = purchasesGroups.flat();

    const lotNumberById = new Map<string, number | null>();
    const seenPurchaseIds = new Set<string>();
    const sortedPurchases = purchases
      .filter((purchase) =>
        tenantKey === "pa"
          ? sameTenantKey(purchase.tenantKey, tenantKey)
          : purchase.buyerId === args.buyerId && sameTenantKey(purchase.tenantKey, tenantKey)
      )
      .filter((purchase) => {
        const key = String(purchase._id);
        if (seenPurchaseIds.has(key)) return false;
        seenPurchaseIds.add(key);
        return true;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const purchaseRows = await Promise.all(
      sortedPurchases.map(async (purchase) => {
        const lotId = String(purchase.lotId);
        if (!lotNumberById.has(lotId)) {
          const lot = await ctx.db.get(purchase.lotId);
          lotNumberById.set(lotId, lot?.number ?? null);
        }
        const photoUrl = purchase.photoId ? await ctx.storage.getUrl(purchase.photoId) : null;

        return {
          ...purchase,
          lotNumber: lotNumberById.get(lotId) ?? null,
          photoUrl,
        };
      })
    );

    const totalPurchases = purchaseRows.length;
    const totalPaid = purchaseRows.reduce((sum, purchase) => sum + (purchase.pricePaid ?? 0), 0);
    const totalCommission = purchaseRows.reduce(
      (sum, purchase) => sum + (purchase.commission ?? 0),
      0
    );
    const totalAmount = totalPaid + totalCommission;
    const totalGrams = purchaseRows.reduce((sum, purchase) => sum + (purchase.grams ?? 0), 0);
    const totalPieces = purchaseRows.filter((purchase) => purchase.type === "pieza").length;

    return {
      client: {
        _id: client._id,
        name: client.name,
        contactName: client.contactName,
        cedula: client.cedula,
        phone: client.phone,
        lat: client.lat,
        lng: client.lng,
      },
      summary: {
        totalPurchases,
        totalPaid,
        totalCommission,
        totalAmount,
        totalGrams,
        totalPieces,
      },
      purchases: purchaseRows,
      mergedClientIds: relatedClientIds,
    };
  },
});

export const getClientSheetByAdmin = query({
  args: {
    adminId: v.id("users"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede consultar la hoja del cliente.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Cliente no encontrado.");
    if (!sameTenantKey(client.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const buyer = await ctx.db.get(client.buyerId);
    const selectedNameKey = normalizeClientNameKey(client.name);
    const scopedClients =
      tenantKey === "pa"
        ? await ctx.db.query("clients").collect()
        : await ctx.db
            .query("clients")
            .withIndex("by_buyerId", (q) => q.eq("buyerId", client.buyerId))
            .collect();

    const selectedIsEmergency = client.isEmergency === true;
    const relatedClientIds = scopedClients
      .filter(
        (item) =>
          sameTenantKey(item.tenantKey, tenantKey) &&
          normalizeClientNameKey(item.name) === selectedNameKey &&
          (selectedIsEmergency ? item._id === args.clientId : item.isEmergency !== true)
      )
      .map((item) => item._id);

    if (!relatedClientIds.some((id) => id === args.clientId)) {
      relatedClientIds.push(args.clientId);
    }

    const purchasesGroups = await Promise.all(
      relatedClientIds.map((clientId) =>
        ctx.db
          .query("purchases")
          .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
          .collect()
      )
    );
    const purchases = purchasesGroups.flat();

    const lotNumberById = new Map<string, number | null>();
    const seenPurchaseIds = new Set<string>();
    const sortedPurchases = purchases
      .filter((purchase) => sameTenantKey(purchase.tenantKey, tenantKey))
      .filter((purchase) => {
        const key = String(purchase._id);
        if (seenPurchaseIds.has(key)) return false;
        seenPurchaseIds.add(key);
        return true;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const purchaseRows = await Promise.all(
      sortedPurchases.map(async (purchase) => {
        const lotId = String(purchase.lotId);
        if (!lotNumberById.has(lotId)) {
          const lot = await ctx.db.get(purchase.lotId);
          lotNumberById.set(lotId, lot?.number ?? null);
        }
        const photoUrl = purchase.photoId ? await ctx.storage.getUrl(purchase.photoId) : null;

        return {
          ...purchase,
          lotNumber: lotNumberById.get(lotId) ?? null,
          photoUrl,
        };
      })
    );

    const totalPurchases = purchaseRows.length;
    const totalPaid = purchaseRows.reduce((sum, purchase) => sum + (purchase.pricePaid ?? 0), 0);
    const totalCommission = purchaseRows.reduce(
      (sum, purchase) => sum + (purchase.commission ?? 0),
      0
    );
    const totalAmount = totalPaid + totalCommission;
    const totalGrams = purchaseRows.reduce((sum, purchase) => sum + (purchase.grams ?? 0), 0);
    const totalPieces = purchaseRows.filter((purchase) => purchase.type === "pieza").length;

    return {
      client: {
        _id: client._id,
        name: client.name,
        contactName: client.contactName,
        cedula: client.cedula,
        phone: client.phone,
        lat: client.lat,
        lng: client.lng,
        buyerName: buyer?.name ?? null,
      },
      summary: {
        totalPurchases,
        totalPaid,
        totalCommission,
        totalAmount,
        totalGrams,
        totalPieces,
      },
      purchases: purchaseRows,
      mergedClientIds: relatedClientIds,
    };
  },
});

export const getLotStats = query({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_lotId", (q) => q.eq("lotId", args.lotId))
      .collect();

    const totalPurchases = purchases.length;
    const totalPieces = purchases.filter((p) => p.type === "pieza").length;
    const totalGrams = purchases.reduce((s, p) => s + (p.grams ?? 0), 0);
    const totalKilos = totalGrams / 1000;
    const totalInvested = purchases.reduce(
      (s, p) => s + (p.pricePaid ?? 0) + (p.commission ?? 0),
      0
    );

    return {
      totalPurchases,
      totalPieces,
      totalGrams,
      totalKilos,
      totalInvested,
    };
  },
});
