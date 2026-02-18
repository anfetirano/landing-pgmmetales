import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    const total = args.pricePaid + args.commission;
    return await ctx.db.insert("purchases", {
      ...args,
      total,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const deleteOpenPurchase = mutation({
  args: {
    purchaseId: v.id("purchases"),
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Compra no encontrada.");
    if (purchase.buyerId !== args.buyerId) throw new Error("No autorizado.");
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

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) throw new Error("Compra no encontrada.");

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
    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "open"), q.eq(q.field("status"), undefined))
      )
      .collect();

    const withUrls = await Promise.all(
      items.map(async (p) => {
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
    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .filter((q) =>
        q.and(q.gte(q.field("createdAt"), args.dateFrom), q.lt(q.field("createdAt"), args.dateTo))
      )
      .collect();

    const withUrls = await Promise.all(
      items.map(async (p) => {
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
    const items = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const sorted = items
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
