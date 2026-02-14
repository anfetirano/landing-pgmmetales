import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createClosing = mutation({
  args: {
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    date: v.string(),
    purchaseIds: v.array(v.id("purchases")),
    totalPaid: v.number(),
    totalCommission: v.number(),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const closingId = await ctx.db.insert("dayClosings", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });

    for (const purchaseId of args.purchaseIds) {
      const purchase = await ctx.db.get(purchaseId);
      if (!purchase) continue;
      if (purchase.buyerId !== args.buyerId) continue;
      if (purchase.status === "closed") continue;

      await ctx.db.patch(purchaseId, {
        status: "closed",
        closingId,
        closedAt: Date.now(),
      });
    }

    return closingId;
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dayClosings")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

export const receiveClosing = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.closingId, {
      status: "received",
      receivedAt: Date.now(),
      receivedBy: args.adminId,
    });
  },
});
