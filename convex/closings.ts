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
    const uniquePurchaseIds = [...new Set(args.purchaseIds)];
    const purchases = await Promise.all(
      uniquePurchaseIds.map(async (purchaseId) => await ctx.db.get(purchaseId))
    );

    const closablePurchases = purchases.filter(
      (purchase): purchase is NonNullable<typeof purchase> =>
        !!purchase &&
        purchase.buyerId === args.buyerId &&
        purchase.status !== "closed"
    );

    if (closablePurchases.length === 0) {
      throw new Error("No hay compras abiertas para cerrar.");
    }

    const totalPaid = closablePurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = closablePurchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalAmount = totalPaid + totalCommission;

    const closingId = await ctx.db.insert("dayClosings", {
      buyerId: args.buyerId,
      lotId: args.lotId,
      date: args.date,
      purchaseIds: closablePurchases.map((p) => p._id),
      totalPaid,
      totalCommission,
      totalAmount,
      notes: args.notes,
      status: "pending",
      createdAt: Date.now(),
    });

    for (const purchase of closablePurchases) {
      await ctx.db.patch(purchase._id, {
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
    const closings = await ctx.db
      .query("dayClosings")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const detailed = await Promise.all(
      closings.map(async (closing) => {
        const buyer = await ctx.db.get(closing.buyerId);
        const lot = await ctx.db.get(closing.lotId);

        return {
          ...closing,
          buyerName: buyer?.name ?? "Comprador",
          lotNumber: lot?.number ?? null,
        };
      })
    );

    return detailed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const receiveClosing = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede aprobar cierres.");
    }

    const closing = await ctx.db.get(args.closingId);
    if (!closing) {
      throw new Error("Cierre no encontrado.");
    }
    if (closing.status === "received") {
      return { ok: true, alreadyReceived: true };
    }

    await ctx.db.patch(args.closingId, {
      status: "received",
      receivedAt: Date.now(),
      receivedBy: args.adminId,
    });

    return { ok: true, alreadyReceived: false };
  },
});

export const recalculateClosingTotals = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede recalcular cierres.");
    }

    const closing = await ctx.db.get(args.closingId);
    if (!closing) {
      throw new Error("Cierre no encontrado.");
    }

    const purchaseDocs = await Promise.all(
      closing.purchaseIds.map(async (purchaseId) => ({
        purchaseId,
        purchase: await ctx.db.get(purchaseId),
      }))
    );

    const validPurchases = purchaseDocs
      .filter(
        (row): row is { purchaseId: typeof row.purchaseId; purchase: NonNullable<typeof row.purchase> } =>
          !!row.purchase && row.purchase.buyerId === closing.buyerId
      )
      .map((row) => row.purchase);

    if (validPurchases.length === 0) {
      throw new Error("El cierre no tiene compras válidas para recalcular.");
    }

    const totalPaid = validPurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = validPurchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalAmount = totalPaid + totalCommission;

    await ctx.db.patch(args.closingId, {
      purchaseIds: validPurchases.map((p) => p._id),
      totalPaid,
      totalCommission,
      totalAmount,
    });

    return {
      ok: true,
      purchaseCount: validPurchases.length,
      totalPaid,
      totalCommission,
      totalAmount,
    };
  },
});
