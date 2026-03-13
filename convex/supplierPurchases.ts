import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

const roundCurrency = (value: number) => Number(value.toFixed(2));

export const createPurchase = mutation({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
    type: v.union(v.literal("pieza"), v.literal("suelto")),
    description: v.string(),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    grams: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    pricePaid: v.number(),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede registrar ingresos.");
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

    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }

    const quantity = args.type === "pieza" ? args.quantity ?? 1 : undefined;
    const grams = args.type === "suelto" ? args.grams ?? 0 : undefined;
    const unitPrice = args.type === "suelto" ? args.unitPrice ?? 0 : undefined;

    if (args.type === "pieza" && (!Number.isFinite(quantity) || (quantity ?? 0) < 1)) {
      throw new Error("Las unidades deben ser al menos 1.");
    }
    if (args.type === "suelto" && (!Number.isFinite(grams) || (grams ?? 0) <= 0)) {
      throw new Error("Los gramos deben ser mayores a 0.");
    }
    if (args.type === "suelto" && (!Number.isFinite(unitPrice) || (unitPrice ?? 0) <= 0)) {
      throw new Error("El valor por gramo debe ser mayor a 0.");
    }

    const computedPricePaid =
      args.type === "suelto" ? roundCurrency((grams ?? 0) * (unitPrice ?? 0)) : args.pricePaid;
    if (computedPricePaid <= 0) {
      throw new Error("El valor pagado debe ser mayor a 0.");
    }

    return await ctx.db.insert("supplierPurchases", {
      supplierId: args.supplierId,
      lotId: args.lotId,
      type: args.type,
      description: args.description.trim(),
      model: args.model?.trim(),
      quantity: args.type === "pieza" ? Math.trunc(quantity ?? 1) : undefined,
      grams,
      unitPrice,
      pricePaid: computedPricePaid,
      notes: args.notes?.trim(),
      photoId: args.photoId,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      tenantKey,
    });
  },
});

export const updatePurchase = mutation({
  args: {
    purchaseId: v.id("supplierPurchases"),
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
    type: v.union(v.literal("pieza"), v.literal("suelto")),
    description: v.string(),
    model: v.optional(v.string()),
    quantity: v.optional(v.number()),
    grams: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    pricePaid: v.number(),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.updatedBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede editar ingresos.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const existing = await ctx.db.get(args.purchaseId);
    if (!existing) {
      throw new Error("Ingreso no encontrado.");
    }
    if (!sameTenantKey(existing.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }
    if (existing.supplierId !== args.supplierId || existing.lotId !== args.lotId) {
      throw new Error("La carga no corresponde al proveedor/lote activo.");
    }

    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }

    const quantity = args.type === "pieza" ? args.quantity ?? 1 : undefined;
    const grams = args.type === "suelto" ? args.grams ?? 0 : undefined;
    const unitPrice = args.type === "suelto" ? args.unitPrice ?? 0 : undefined;

    if (args.type === "pieza" && (!Number.isFinite(quantity) || (quantity ?? 0) < 1)) {
      throw new Error("Las unidades deben ser al menos 1.");
    }
    if (args.type === "suelto" && (!Number.isFinite(grams) || (grams ?? 0) <= 0)) {
      throw new Error("Los gramos deben ser mayores a 0.");
    }
    if (args.type === "suelto" && (!Number.isFinite(unitPrice) || (unitPrice ?? 0) <= 0)) {
      throw new Error("El valor por gramo debe ser mayor a 0.");
    }

    const computedPricePaid =
      args.type === "suelto" ? roundCurrency((grams ?? 0) * (unitPrice ?? 0)) : args.pricePaid;
    if (computedPricePaid <= 0) {
      throw new Error("El valor pagado debe ser mayor a 0.");
    }

    if (existing.photoId && args.photoId && existing.photoId !== args.photoId) {
      await ctx.storage.delete(existing.photoId);
    }

    await ctx.db.patch(args.purchaseId, {
      type: args.type,
      description: args.description.trim(),
      model: args.model?.trim(),
      quantity: args.type === "pieza" ? Math.trunc(quantity ?? 1) : undefined,
      grams,
      unitPrice,
      pricePaid: computedPricePaid,
      notes: args.notes?.trim(),
      photoId: args.photoId,
      tenantKey,
    });

    return { ok: true };
  },
});

export const deletePurchase = mutation({
  args: {
    purchaseId: v.id("supplierPurchases"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.deletedBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede eliminar ingresos.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Ingreso no encontrado.");
    }
    if (!sameTenantKey(purchase.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    if (purchase.photoId) {
      await ctx.storage.delete(purchase.photoId);
    }

    await ctx.db.delete(args.purchaseId);
    return { ok: true };
  },
});

export const listBySupplier = query({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("supplierPurchases")
      .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const sorted = items
      .filter((purchase) => purchase.lotId === args.lotId)
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const withUrls = await Promise.all(
      sorted.map(async (p) => {
        const photoUrl = p.photoId ? await ctx.storage.getUrl(p.photoId) : null;
        return { ...p, photoUrl };
      })
    );

    return withUrls;
  },
});

export const getGlobalStats = query({
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

    const items = await ctx.db.query("supplierPurchases").collect();
    const filtered = items.filter(
      (p) => p.lotId === args.lotId && sameTenantKey(p.tenantKey, tenantKey)
    );

    const totalEntries = filtered.length;
    const totalPieces = filtered.reduce(
      (total, purchase) =>
        purchase.type === "pieza" ? total + Math.max(1, Math.trunc(purchase.quantity ?? 1)) : total,
      0
    );
    const totalGrams = filtered.reduce((s, p) => s + (p.grams ?? 0), 0);
    const totalKilos = totalGrams / 1000;
    const totalPaid = filtered.reduce((s, p) => s + (p.pricePaid ?? 0), 0);

    return {
      totalEntries,
      totalPieces,
      totalGrams,
      totalKilos,
      totalPaid,
    };
  },
});
