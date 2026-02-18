import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMovement = mutation({
  args: {
    supplierId: v.id("suppliers"),
    amount: v.number(),
    type: v.union(v.literal("fund"), v.literal("adjustment"), v.literal("expense")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede registrar movimientos.");
    }

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }

    const normalizedAmount =
      args.type === "fund" ? Math.abs(args.amount) : -Math.abs(args.amount);

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
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
    supplierId: v.id("suppliers"),
    amount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede abrir base.");
    }

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }

    const baseAmount = Math.abs(args.amount);
    if (!baseAmount) {
      throw new Error("Monto inválido.");
    }

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
      amount: baseAmount,
      type: "opening",
      notes: args.notes ?? "Apertura de base",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const listBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    return items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const getBalanceBySupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const lastOpeningAt = movements
      .filter((m) => m.type === "opening")
      .reduce((max, m) => Math.max(max, m.createdAt ?? 0), 0);

    const effectiveMovements = movements.filter((m) => (m.createdAt ?? 0) >= lastOpeningAt);
    const totalFunds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const purchases = await ctx.db
      .query("supplierPurchases")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const effectivePurchases = purchases.filter((p) => (p.createdAt ?? 0) >= lastOpeningAt);
    const totalSpent = effectivePurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);

    return {
      totalFunds,
      totalSpent,
      balance: totalFunds - totalSpent,
      lastOpeningAt,
    };
  },
});
