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
      createdAt: Date.now(),
    });
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
        q.and(
          q.gte(q.field("createdAt"), args.dateFrom),
          q.lt(q.field("createdAt"), args.dateTo)
        )
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

// NUEVO: últimas compras por comprador
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
