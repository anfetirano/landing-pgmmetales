import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTelegramSession = query({
  args: { requesterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("priceCheckSessions")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.requesterId))
      .unique();
  },
});

export const upsertTelegramSession = mutation({
  args: {
    requesterId: v.string(),
    chatId: v.number(),
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    step: v.union(
      v.literal("awaiting_photo_choice"),
      v.literal("awaiting_photo_upload"),
      v.literal("awaiting_reference"),
      v.literal("awaiting_brand"),
      v.literal("awaiting_save_confirmation"),
      v.literal("awaiting_client_price")
    ),
    queryText: v.string(),
    photoUrl: v.optional(v.string()),
    normalizedReference: v.optional(v.string()),
    normalizedBrand: v.optional(v.string()),
    candidateTitle: v.optional(v.string()),
    candidateReference: v.optional(v.string()),
    candidateBrand: v.optional(v.string()),
    candidateConfidence: v.optional(
      v.union(
        v.literal("exact"),
        v.literal("probable"),
        v.literal("review_manually")
      )
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("priceCheckSessions")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.requesterId))
      .unique();

    const payload = {
      channel: "telegram" as const,
      requesterId: args.requesterId,
      chatId: args.chatId,
      tenantKey: args.tenantKey,
      step: args.step,
      queryText: args.queryText,
      photoUrl: args.photoUrl,
      normalizedReference: args.normalizedReference,
      normalizedBrand: args.normalizedBrand,
      candidateTitle: args.candidateTitle,
      candidateReference: args.candidateReference,
      candidateBrand: args.candidateBrand,
      candidateConfidence: args.candidateConfidence,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("priceCheckSessions", {
      ...payload,
      createdAt: Date.now(),
    });
  },
});

export const clearTelegramSession = mutation({
  args: { requesterId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("priceCheckSessions")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.requesterId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { ok: true };
  },
});
