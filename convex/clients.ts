import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createClient = mutation({
  args: {
    name: v.string(),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", args);
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();
  },
});
