import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

export const addMovement = mutation({
  args: {
    buyerId: v.id("users"),
    amount: v.number(),
    type: v.union(v.literal("fund"), v.literal("adjustment"), v.literal("expense")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    const actor = await ctx.db.get(args.createdBy);
    if (!buyer || !actor) {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    if (!sameTenantKey(actor.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const normalizedAmount =
      args.type === "fund" ? Math.abs(args.amount) : -Math.abs(args.amount);

    return await ctx.db.insert("cashMovements", {
      buyerId: args.buyerId,
      amount: normalizedAmount,
      type: args.type,
      notes: args.notes,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      tenantKey,
    });
  },
});

export const openBase = mutation({
  args: {
    buyerId: v.id("users"),
    amount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede abrir una base.");
    }
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) throw new Error("Comprador no encontrado.");
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    if (!sameTenantKey(buyer.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const baseAmount = Math.abs(args.amount);
    if (!baseAmount) throw new Error("Monto inválido.");

    return await ctx.db.insert("cashMovements", {
      buyerId: args.buyerId,
      amount: baseAmount,
      type: "opening",
      notes: args.notes ?? "Apertura de base",
      createdAt: Date.now(),
      createdBy: args.createdBy,
      tenantKey,
    });
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items = await ctx.db
      .query("cashMovements")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    return items.filter((m) => sameTenantKey(m.tenantKey, tenantKey));
  },
});

export const getBalanceByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) {
      return {
        totalFunds: 0,
        totalSpent: 0,
        pendingSpent: 0,
        balance: 0,
        projectedBalance: 0,
        lastOpeningAt: 0,
      };
    }
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const movements = (await ctx.db
      .query("cashMovements")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect()).filter((m) => sameTenantKey(m.tenantKey, tenantKey));

    // Compatibilidad: corte por "opening" nuevo o "reset" histórico.
    const lastOpeningAt = movements
      .filter((m) => m.type === "opening" || m.type === "reset")
      .reduce((max, m) => Math.max(max, m.createdAt ?? 0), 0);

    const effectiveMovements = movements.filter((m) => (m.createdAt ?? 0) >= lastOpeningAt);
    const totalFunds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const closings = await ctx.db
      .query("dayClosings")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const effectiveClosings = closings.filter(
      (c) => (c.createdAt ?? 0) >= lastOpeningAt && sameTenantKey(c.tenantKey, tenantKey)
    );
    const receivedClosingIds = new Set(
      effectiveClosings.filter((c) => c.status === "received").map((c) => c._id)
    );
    const pendingClosingIds = new Set(
      effectiveClosings.filter((c) => c.status === "pending").map((c) => c._id)
    );

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const effectivePurchases = purchases.filter(
      (p) => (p.createdAt ?? 0) >= lastOpeningAt && sameTenantKey(p.tenantKey, tenantKey)
    );
    let approvedSpent = 0;
    let pendingSpent = 0;

    for (const purchase of effectivePurchases) {
      const amount = (purchase.pricePaid ?? 0) + (purchase.commission ?? 0);

      if (purchase.closingId && receivedClosingIds.has(purchase.closingId)) {
        approvedSpent += amount;
      } else if (
        !purchase.closingId ||
        pendingClosingIds.has(purchase.closingId) ||
        !receivedClosingIds.has(purchase.closingId)
      ) {
        pendingSpent += amount;
      }
    }

    return {
      totalFunds,
      totalSpent: approvedSpent,
      pendingSpent,
      balance: totalFunds - approvedSpent,
      projectedBalance: totalFunds - approvedSpent - pendingSpent,
      lastOpeningAt,
    };
  },
});
