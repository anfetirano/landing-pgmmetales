import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addMovement = mutation({
  args: {
    buyerId: v.id("users"),
    amount: v.number(), // + entrega, - ajuste
    type: v.union(v.literal("fund"), v.literal("adjustment")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cashMovements", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const deleteMovement = mutation({
  args: {
    movementId: v.id("cashMovements"),
    buyerId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede eliminar movimientos.");
    }

    const movement = await ctx.db.get(args.movementId);
    if (!movement) {
      throw new Error("Movimiento no encontrado.");
    }

    if (movement.buyerId !== args.buyerId) {
      throw new Error("El movimiento no pertenece al comprador seleccionado.");
    }

    await ctx.db.delete(args.movementId);
    return { ok: true };
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

    const totalFunds = movements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const totalSpent = purchases.reduce(
      (s, p) => s + (p.pricePaid ?? 0) + (p.commission ?? 0),
      0
    );

    const balance = totalFunds - totalSpent;

    return {
      totalFunds,
      totalSpent,
      balance,
    };
  },
});
