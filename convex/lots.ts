import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

export const getActiveLot = query({
  args: { tenantKey: v.union(v.literal("co"), v.literal("pa")) },
  handler: async (ctx, args) => {
    const openLots = await ctx.db
      .query("lots")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    return openLots
      .filter((lot) => sameTenantKey(lot.tenantKey, args.tenantKey))
      .sort((a, b) => b.number - a.number)[0] ?? null;
  },
});

export const listAllLots = query({
  args: { tenantKey: v.union(v.literal("co"), v.literal("pa")) },
  handler: async (ctx, args) => {
    const lots = await ctx.db.query("lots").collect();
    return lots
      .filter((lot) => sameTenantKey(lot.tenantKey, args.tenantKey))
      .sort((a, b) => b.number - a.number);
  },
});

export const createLot = mutation({
  args: {
    adminId: v.id("users"),
    number: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede abrir lotes.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);

    return await ctx.db.insert("lots", {
      number: args.number,
      status: "open",
      openedAt: Date.now(),
      notes: args.notes,
      tenantKey,
    });
  },
});

export const closeLot = mutation({
  args: {
    lotId: v.id("lots"),
    notes: v.optional(v.string()),
    refineryResult: v.optional(v.number()),
    profit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.lotId, {
      status: "closed",
      closedAt: Date.now(),
      notes: args.notes,
      refineryResult: args.refineryResult,
      profit: args.profit,
    });
  },
});

export const closeAndOpenNextLot = mutation({
  args: {
    currentLotId: v.id("lots"),
    adminId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede cerrar y abrir lote.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const currentLot = await ctx.db.get(args.currentLotId);
    if (!currentLot) throw new Error("Lote actual no encontrado.");
    if (currentLot.status !== "open") throw new Error("El lote actual ya está cerrado.");
    if (!sameTenantKey(currentLot.tenantKey, tenantKey)) {
      throw new Error("No autorizado para cerrar este lote.");
    }

    // Protección anti doble clic/cierre encadenado accidental:
    // evita cerrar un lote que acaba de abrirse hace segundos.
    const lotAgeMs = Date.now() - (currentLot.openedAt ?? 0);
    if (lotAgeMs < 60_000) {
      throw new Error("El lote se abrió hace menos de 1 minuto. Espera un momento antes de cerrarlo.");
    }

    const now = Date.now();

    await ctx.db.patch(args.currentLotId, {
      status: "closed",
      closedAt: now,
      notes: args.notes ?? currentLot.notes,
    });

    const nextNumber = currentLot.number + 1;

    const newLotId = await ctx.db.insert("lots", {
      number: nextNumber,
      status: "open",
      openedAt: now,
      notes: `Apertura automática desde lote #${currentLot.number}`,
      tenantKey,
    });

    const suppliers = await ctx.db.query("suppliers").collect();
    let carriedSuppliers = 0;

    for (const supplier of suppliers.filter((s) => sameTenantKey(s.tenantKey, tenantKey))) {
      const movements = await ctx.db
        .query("supplierMovements")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();

      const lotMovements = movements.filter((m) => m.lotId === args.currentLotId);

      const totalFunds = lotMovements.reduce((s, m) => s + (m.amount ?? 0), 0);

      const purchases = await ctx.db
        .query("supplierPurchases")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", supplier._id))
        .collect();

      const lotPurchases = purchases.filter((p) => p.lotId === args.currentLotId);

      const totalSpent = lotPurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
      const balance = totalFunds - totalSpent;

      if (balance > 0) {
        await ctx.db.insert("supplierMovements", {
          supplierId: supplier._id,
          lotId: newLotId,
          amount: balance,
          type: "carryover",
          notes: `Saldo arrastrado desde lote #${currentLot.number}`,
          createdAt: now,
          createdBy: args.adminId,
          tenantKey,
        });
        carriedSuppliers += 1;
      }
    }

    return {
      closedLotId: args.currentLotId,
      newLotId,
      nextNumber,
      carriedSuppliers,
    };
  },
});
