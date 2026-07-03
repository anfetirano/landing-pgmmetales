import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserActive, normalizeTenantKey, sameTenantKey } from "./tenants";

const BUYER_EXPENSE_FEATURE = "buyer_expenses";

const hasBuyerExpenseFeature = (features?: string[]) =>
  Array.isArray(features) && features.includes(BUYER_EXPENSE_FEATURE);

const getCurrentActiveLot = async (ctx: any, tenantKey: "co" | "pa") => {
  const openLots = await ctx.db
    .query("lots")
    .withIndex("by_status", (q: any) => q.eq("status", "open"))
    .collect();

  return (
    openLots
      .filter((lot: any) => sameTenantKey(lot.tenantKey, tenantKey))
      .sort((a: any, b: any) => b.number - a.number)[0] ?? null
  );
};

const canManageBuyerExpenses = ({
  actor,
  buyer,
}: {
  actor: any;
  buyer: any;
}) => {
  if (!actor || !buyer) return false;
  if (!isUserActive(buyer) || !isUserActive(actor)) return false;
  if (!hasBuyerExpenseFeature(buyer.features)) return false;
  const tenantKey = normalizeTenantKey(buyer.tenantKey);
  if (!sameTenantKey(actor.tenantKey, tenantKey)) return false;
  if (actor.role === "admin") return true;
  return String(actor._id) === String(buyer._id) && hasBuyerExpenseFeature(buyer.features);
};

export const createExpense = mutation({
  args: {
    buyerId: v.id("users"),
    category: v.union(
      v.literal("gasolina"),
      v.literal("comida"),
      v.literal("parqueadero"),
      v.literal("otros")
    ),
    description: v.string(),
    amount: v.number(),
    notes: v.optional(v.string()),
    receiptPhotoId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [buyer, actor] = await Promise.all([
      ctx.db.get(args.buyerId),
      ctx.db.get(args.createdBy),
    ]);

    if (!canManageBuyerExpenses({ actor, buyer })) {
      throw new Error("No autorizado.");
    }
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }
    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }
    if (args.amount <= 0) {
      throw new Error("El monto debe ser mayor a 0.");
    }

    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const activeLot = await getCurrentActiveLot(ctx, tenantKey);
    if (!activeLot) {
      throw new Error("No hay lote activo en este momento.");
    }

    return await ctx.db.insert("buyerExpenses", {
      buyerId: args.buyerId,
      lotId: activeLot._id,
      category: args.category,
      description: args.description.trim(),
      amount: Math.abs(args.amount),
      notes: args.notes?.trim(),
      receiptPhotoId: args.receiptPhotoId,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      tenantKey,
    });
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("buyerExpenses"),
    category: v.union(
      v.literal("gasolina"),
      v.literal("comida"),
      v.literal("parqueadero"),
      v.literal("otros")
    ),
    description: v.string(),
    amount: v.number(),
    notes: v.optional(v.string()),
    receiptPhotoId: v.optional(v.id("_storage")),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.expenseId);
    if (!existing) {
      throw new Error("Gasto no encontrado.");
    }

    const [buyer, actor] = await Promise.all([
      ctx.db.get(existing.buyerId),
      ctx.db.get(args.updatedBy),
    ]);

    if (!canManageBuyerExpenses({ actor, buyer })) {
      throw new Error("No autorizado.");
    }
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }
    if (!args.description.trim()) {
      throw new Error("La descripción es obligatoria.");
    }
    if (args.amount <= 0) {
      throw new Error("El monto debe ser mayor a 0.");
    }

    if (
      existing.receiptPhotoId &&
      args.receiptPhotoId &&
      existing.receiptPhotoId !== args.receiptPhotoId
    ) {
      await ctx.storage.delete(existing.receiptPhotoId);
    }

    await ctx.db.patch(args.expenseId, {
      category: args.category,
      description: args.description.trim(),
      amount: Math.abs(args.amount),
      notes: args.notes?.trim(),
      receiptPhotoId: args.receiptPhotoId ?? existing.receiptPhotoId,
    });

    return { ok: true };
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("buyerExpenses"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.expenseId);
    if (!existing) {
      throw new Error("Gasto no encontrado.");
    }

    const [buyer, actor] = await Promise.all([
      ctx.db.get(existing.buyerId),
      ctx.db.get(args.deletedBy),
    ]);

    if (!canManageBuyerExpenses({ actor, buyer })) {
      throw new Error("No autorizado.");
    }

    if (existing.receiptPhotoId) {
      await ctx.storage.delete(existing.receiptPhotoId);
    }

    await ctx.db.delete(args.expenseId);
    return { ok: true };
  },
});

export const listByBuyer = query({
  args: {
    buyerId: v.id("users"),
    viewerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [buyer, actor] = await Promise.all([
      ctx.db.get(args.buyerId),
      ctx.db.get(args.viewerId),
    ]);

    if (!canManageBuyerExpenses({ actor, buyer })) {
      throw new Error("No autorizado.");
    }
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }

    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const items = await ctx.db
      .query("buyerExpenses")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    const lots = await ctx.db.query("lots").collect();
    const lotNumberById = new Map(
      lots
        .filter((lot) => sameTenantKey(lot.tenantKey, tenantKey))
        .map((lot) => [String(lot._id), lot.number])
    );

    const filtered = items
      .filter((item) => sameTenantKey(item.tenantKey, tenantKey))
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return await Promise.all(
      filtered.map(async (item) => ({
        ...item,
        lotNumber: lotNumberById.get(String(item.lotId)) ?? null,
        receiptPhotoUrl: item.receiptPhotoId ? await ctx.storage.getUrl(item.receiptPhotoId) : null,
      }))
    );
  },
});

export const listByLotForAdmin = query({
  args: {
    adminId: v.id("users"),
    buyerId: v.id("users"),
    lotId: v.id("lots"),
  },
  handler: async (ctx, args) => {
    const [admin, buyer, lot] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.buyerId),
      ctx.db.get(args.lotId),
    ]);

    if (!admin || admin.role !== "admin" || !buyer || !lot) {
      throw new Error("No autorizado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    if (!sameTenantKey(buyer.tenantKey, tenantKey) || !sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const items = await ctx.db
      .query("buyerExpenses")
      .withIndex("by_lotId", (q) => q.eq("lotId", args.lotId))
      .collect();

    const filtered = items
      .filter(
        (item) =>
          String(item.buyerId) === String(args.buyerId) && sameTenantKey(item.tenantKey, tenantKey)
      )
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return await Promise.all(
      filtered.map(async (item) => ({
        ...item,
        receiptPhotoUrl: item.receiptPhotoId ? await ctx.storage.getUrl(item.receiptPhotoId) : null,
      }))
    );
  },
});

export const getExpenseSummaryByBuyer = query({
  args: {
    buyerId: v.id("users"),
    viewerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [buyer, actor] = await Promise.all([
      ctx.db.get(args.buyerId),
      ctx.db.get(args.viewerId),
    ]);

    if (!canManageBuyerExpenses({ actor, buyer })) {
      throw new Error("No autorizado.");
    }
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }

    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const activeLot = await getCurrentActiveLot(ctx, tenantKey);

    if (!activeLot) {
      return {
        totalExpenses: 0,
        expenseCount: 0,
        latestExpenses: [],
        activeLotId: null,
        activeLotNumber: null,
      };
    }

    const items = await ctx.db
      .query("buyerExpenses")
      .withIndex("by_lotId", (q) => q.eq("lotId", activeLot._id))
      .collect();

    const filtered = items
      .filter(
        (item) =>
          String(item.buyerId) === String(args.buyerId) && sameTenantKey(item.tenantKey, tenantKey)
      )
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const latestExpenses = await Promise.all(
      filtered.slice(0, 5).map(async (item) => ({
        ...item,
        receiptPhotoUrl: item.receiptPhotoId ? await ctx.storage.getUrl(item.receiptPhotoId) : null,
      }))
    );

    return {
      totalExpenses: filtered.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      expenseCount: filtered.length,
      latestExpenses,
      activeLotId: activeLot._id,
      activeLotNumber: activeLot.number,
    };
  },
});
