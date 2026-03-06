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

export const createPurchase = mutation({
  args: {
    supplierId: v.id("suppliers"),
    lotId: v.id("lots"),
    type: v.union(v.literal("pieza"), v.literal("suelto")),
    description: v.string(),
    model: v.optional(v.string()),
    grams: v.optional(v.number()),
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

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }

    const lot = await ctx.db.get(args.lotId);
    if (!lot || lot.status !== "open") {
      throw new Error("Lote activo no válido.");
    }

    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }
    if (args.pricePaid <= 0) {
      throw new Error("El valor pagado debe ser mayor a 0.");
    }

    return await ctx.db.insert("supplierPurchases", {
      supplierId: args.supplierId,
      lotId: args.lotId,
      type: args.type,
      description: args.description.trim(),
      model: args.model?.trim(),
      grams: args.type === "suelto" ? args.grams ?? 0 : args.grams,
      pricePaid: args.pricePaid,
      notes: args.notes?.trim(),
      photoId: args.photoId,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const updatePurchase = mutation({
  args: {
    purchaseId: v.id("supplierPurchases"),
    type: v.union(v.literal("pieza"), v.literal("suelto")),
    description: v.string(),
    model: v.optional(v.string()),
    grams: v.optional(v.number()),
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

    const existing = await ctx.db.get(args.purchaseId);
    if (!existing) {
      throw new Error("Ingreso no encontrado.");
    }

    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }
    if (args.pricePaid <= 0) {
      throw new Error("El valor pagado debe ser mayor a 0.");
    }

    if (existing.photoId && args.photoId && existing.photoId !== args.photoId) {
      await ctx.storage.delete(existing.photoId);
    }

    await ctx.db.patch(args.purchaseId, {
      type: args.type,
      description: args.description.trim(),
      model: args.model?.trim(),
      grams: args.type === "suelto" ? args.grams ?? 0 : args.grams,
      pricePaid: args.pricePaid,
      notes: args.notes?.trim(),
      photoId: args.photoId,
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

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Ingreso no encontrado.");
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

    const sorted = (
      await Promise.all(
        items.map(async (p) => ({
          purchase: p,
          effectiveLotId: await resolveEffectiveLotId(ctx, p.lotId),
        }))
      )
    )
      .filter((x) => x.effectiveLotId === args.lotId)
      .map((x) => x.purchase)
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
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("supplierPurchases").collect();
    const filtered = items.filter((p) => p.lotId === args.lotId);

    const totalEntries = filtered.length;
    const totalPieces = filtered.filter((p) => p.type === "pieza").length;
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
