import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

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
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }
    if (!sameTenantKey(supplier.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") {
      throw new Error("Lote activo no válido.");
    }
    if (!sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
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
      tenantKey,
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
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }
    if (!sameTenantKey(supplier.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") {
      throw new Error("Lote activo no válido.");
    }
    if (!sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
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
      tenantKey,
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
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const movement = await ctx.db.get(args.movementId);
    if (!movement) {
      throw new Error("Movimiento no encontrado.");
    }
    if (!sameTenantKey(movement.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
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
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) throw new Error("Proveedor no encontrado.");
    if (!sameTenantKey(supplier.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    if (args.amount <= 0) return null;

    return await ctx.db.insert("supplierMovements", {
      supplierId: args.supplierId,
      lotId: args.lotId,
      amount: Math.abs(args.amount),
      type: "carryover",
      notes: args.notes ?? "Saldo arrastrado lote anterior",
      createdAt: Date.now(),
      createdBy: args.createdBy,
      tenantKey,
    });
  },
});

export const listBySupplier = query({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    const tenantKey = supplier?.tenantKey;
    const items = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    return items
      .filter((movement) => movement.lotId === args.lotId)
      .filter((movement) =>
        tenantKey ? sameTenantKey(movement.tenantKey, normalizeTenantKey(tenantKey)) : true
      )
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const getBalanceBySupplier = query({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    const tenantKey = supplier?.tenantKey;
    const movements = await ctx.db
      .query("supplierMovements")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const effectiveMovements = movements
      .filter((movement) => movement.lotId === args.lotId)
      .filter((movement) =>
        tenantKey ? sameTenantKey(movement.tenantKey, normalizeTenantKey(tenantKey)) : true
      );

    const totalFunds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

    const purchases = await ctx.db
      .query("supplierPurchases")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const effectivePurchases = purchases
      .filter((purchase) => purchase.lotId === args.lotId)
      .filter((purchase) =>
        tenantKey ? sameTenantKey(purchase.tenantKey, normalizeTenantKey(tenantKey)) : true
      );

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
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const lot = await ctx.db.get(args.lotId);
    if (!lot || !sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("Lote no autorizado.");
    }

    const suppliers = await ctx.db.query("suppliers").collect();
    let totalPositive = 0;
    let totalNegative = 0;

    for (const supplier of suppliers.filter((s) => sameTenantKey(s.tenantKey, tenantKey))) {
      const movements = await ctx.db
        .query("supplierMovements")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();

      const effectiveMovements = movements
        .filter((movement) => movement.lotId === args.lotId)
        .filter((movement) => sameTenantKey(movement.tenantKey, tenantKey));

      const funds = effectiveMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

      const purchases = await ctx.db
        .query("supplierPurchases")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();

      const effectivePurchases = purchases
        .filter((purchase) => purchase.lotId === args.lotId)
        .filter((purchase) => sameTenantKey(purchase.tenantKey, tenantKey));

      const spent = effectivePurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
      const balance = funds - spent;

      if (balance > 0) totalPositive += balance;
      if (balance < 0) totalNegative += Math.abs(balance);
    }

    return {
      totalPositive,
      totalNegative,
      net: totalPositive - totalNegative,
    };
  },
});
