import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMovement = mutation({
  args: {
    buyerId: v.id("users"),
    amount: v.number(),
    type: v.union(v.literal("fund"), v.literal("adjustment"), v.literal("expense")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const normalizedAmount =
      args.type === "fund" ? Math.abs(args.amount) : -Math.abs(args.amount);

    return await ctx.db.insert("cashMovements", {
      buyerId: args.buyerId,
      amount: normalizedAmount,
      type: args.type,
      notes: args.notes,
      createdAt: Date.now(),
      createdBy: args.createdBy,
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

    const baseAmount = Math.abs(args.amount);
    if (!baseAmount) throw new Error("Monto inválido.");

    return await ctx.db.insert("cashMovements", {
      buyerId: args.buyerId,
      amount: baseAmount,
      type: "opening",
      notes: args.notes ?? "Apertura de base",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cashMovements")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();
  },
});

export const getBalanceByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("cashMovements")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    // Compatibilidad: corte por "opening" nuevo o "reset" histórico.
    const lastOpeningAt = movements
      .filter((m) => m.type === "opening" || m.type === "reset")
      .reduce((max, m) => Math.max(max, m.createdAt ?? 0), 0);

    const effectiveMovements = movements.filter((m) => (m.createdAt ?? 0) >= lastOpeningAt);
    const totalFunds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const effectivePurchases = purchases.filter((p) => (p.createdAt ?? 0) >= lastOpeningAt);
    const totalSpent = effectivePurchases.reduce(
      (s, p) => s + (p.pricePaid ?? 0) + (p.commission ?? 0),
      0
    );

    return {
      totalFunds,
      totalSpent,
      balance: totalFunds - totalSpent,
      lastOpeningAt,
    };
  },
});
