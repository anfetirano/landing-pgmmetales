import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveLot = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("lots")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .unique();
  },
});

export const createLot = mutation({
  args: {
    number: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lots", {
      number: args.number,
      status: "open",
      openedAt: Date.now(),
      notes: args.notes,
    });
  },
});

export const closeLot = mutation({
  args: {
    lotId: v.id("lots"),
    notes: v.optional(v.string()),
    refineryResult: v.optional(v.number()),
    profit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.lotId, {
      status: "closed",
      closedAt: Date.now(),
      notes: args.notes,
      refineryResult: args.refineryResult,
      profit: args.profit,
    });
  },
});
