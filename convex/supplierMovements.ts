import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const resolveEffectiveLotId = async (
  ctx: any,
  explicitLotId: string | undefined
) => {
  if (explicitLotId) return explicitLotId;
  const activeLot = await ctx.db
    .query("lots")
    .withIndex("by_status", (q: any) => q.eq("status", "open"))
    .unique();
  return activeLot?._id;
};

export const addMovement = mutation({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
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

    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") {
      throw new Error("Lote activo no válido.");
    }

    const normalizedAmount =
      args.type === "fund" ? Math.abs(args.amount) : -Math.abs(args.amount);

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
      lotId: args.lotId,
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
    lotId: v.id("lots"),
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

    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") {
      throw new Error("Lote activo no válido.");
    }

    const baseAmount = Math.abs(args.amount);
    if (!baseAmount) {
      throw new Error("Monto inválido.");
    }

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
      lotId: args.lotId,
      amount: baseAmount,
      type: "opening",
      notes: args.notes ?? "Apertura de base",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const deleteMovement = mutation({
  args: {
    movementId: v.id("supplierMovements"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.deletedBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede eliminar movimientos.");
    }

    const movement = await ctx.db.get(args.movementId);
    if (!movement) {
      throw new Error("Movimiento no encontrado.");
    }

    await ctx.db.delete(args.movementId);
    return { ok: true };
  },
});

export const createCarryoverMovement = mutation({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
    amount: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado.");

    if (args.amount <= 0) return null;

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
      lotId: args.lotId,
      amount: Math.abs(args.amount),
      type: "carryover",
      notes: args.notes ?? "Saldo arrastrado lote anterior",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const listBySupplier = query({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const withEffectiveLot = await Promise.all(
      items.map(async (m) => ({
        movement: m,
        effectiveLotId: await resolveEffectiveLotId(ctx, m.lotId),
      }))
    );

    return withEffectiveLot
      .filter((x) => x.effectiveLotId === args.lotId)
      .map((x) => x.movement)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const getBalanceBySupplier = query({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const movements = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const effectiveMovements = (
      await Promise.all(
        movements.map(async (m) => ({
          movement: m,
          effectiveLotId: await resolveEffectiveLotId(ctx, m.lotId),
        }))
      )
    )
      .filter((x) => x.effectiveLotId === args.lotId)
      .map((x) => x.movement);

    const totalFunds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const purchases = await ctx.db
      .query("supplierPurchases")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const effectivePurchases = (
      await Promise.all(
        purchases.map(async (p) => ({
          purchase: p,
          effectiveLotId: await resolveEffectiveLotId(ctx, p.lotId),
        }))
      )
    )
      .filter((x) => x.effectiveLotId === args.lotId)
      .map((x) => x.purchase);

    const totalSpent = effectivePurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);

    return {
      totalFunds,
      totalSpent,
      balance: totalFunds - totalSpent,
    };
  },
});

export const getGlobalFundsStats = query({
  args: {
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("supplierMovements").collect();

    const filtered = (
      await Promise.all(
        items.map(async (m) => ({
          movement: m,
          effectiveLotId: await resolveEffectiveLotId(ctx, m.lotId),
        }))
      )
    )
      .filter((x) => x.effectiveLotId === args.lotId)
      .map((x) => x.movement);

    const totalPositive = filtered
      .filter((m) => (m.amount ?? 0) > 0)
      .reduce((s, m) => s + (m.amount ?? 0), 0);

    const totalNegative = filtered
      .filter((m) => (m.amount ?? 0) < 0)
      .reduce((s, m) => s + Math.abs(m.amount ?? 0), 0);

    return {
      totalPositive,
      totalNegative,
      net: totalPositive - totalNegative,
    };
  },
});
