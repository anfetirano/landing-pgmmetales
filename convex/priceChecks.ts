import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logPriceCheck = mutation({
  args: {
    channel: v.union(v.literal("telegram"), v.literal("private_api")),
    requesterId: v.optional(v.string()),
    requesterLabel: v.optional(v.string()),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
    queryText: v.string(),
    photoUrl: v.optional(v.string()),
    catalogStatus: v.optional(v.string()),
    normalizedReference: v.optional(v.string()),
    normalizedBrand: v.optional(v.string()),
    pmrStatus: v.string(),
    ecotradeStatus: v.string(),
    overallConfidence: v.union(
      v.literal("exact"),
      v.literal("probable"),
      v.literal("review_manually")
    ),
    summaryText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("priceCheckRequests", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
