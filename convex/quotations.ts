import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserActive, normalizeTenantKey, sameTenantKey } from "./tenants";

const BUYER_QUOTATION_FEATURE = "buyer_quotations";
const ANDRES_COMPRA_EMAIL = "andrescompra@pmgmetales.com";

const hasBuyerQuotationFeature = (features?: string[]) =>
  Array.isArray(features) && features.includes(BUYER_QUOTATION_FEATURE);

const isAndresCompraEmail = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === ANDRES_COMPRA_EMAIL;

const getQuotationActorOrThrow = async (ctx: any, actorId: any) => {
  const actor = await ctx.db.get(actorId);
  if (!actor || !isUserActive(actor)) {
    throw new Error("No autorizado.");
  }

  const tenantKey = normalizeTenantKey(actor.tenantKey);
  const isPanamaQuotationBuyer =
    actor.role === "buyer" &&
    tenantKey === "pa" &&
    (hasBuyerQuotationFeature(actor.features) || isAndresCompraEmail(actor.email));

  if (actor.role !== "admin" && !isPanamaQuotationBuyer) {
    throw new Error("No autorizado.");
  }

  return { actor, tenantKey, isAdmin: actor.role === "admin" } as const;
};

const getQuotationOrThrow = async (ctx: any, quotationId: any, tenantKey: "co" | "pa") => {
  const quotation = await ctx.db.get(quotationId);
  if (!quotation) {
    throw new Error("Cotización no encontrada.");
  }
  if (!sameTenantKey(quotation.tenantKey, tenantKey)) {
    throw new Error("No autorizado.");
  }
  return quotation;
};

export const createQuotation = mutation({
  args: {
    adminId: v.id("users"),
    clientName: v.string(),
    clientId: v.optional(v.id("clients")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey } = await getQuotationActorOrThrow(ctx, args.adminId);

    const safeClientName = args.clientName.trim();
    if (!safeClientName) {
      throw new Error("El nombre del cliente es obligatorio.");
    }

    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client || !sameTenantKey(client.tenantKey, tenantKey)) {
        throw new Error("Cliente no válido.");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("quotations", {
      clientName: safeClientName,
      clientId: args.clientId,
      status: "draft",
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      createdBy: actor._id,
      tenantKey,
    });
  },
});

export const listByAdmin = query({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);

    const [quotations, items] = await Promise.all([
      ctx.db.query("quotations").collect(),
      ctx.db.query("quotationItems").collect(),
    ]);

    const itemMap = new Map<string, typeof items>();
    for (const item of items.filter((row) => sameTenantKey(row.tenantKey, tenantKey))) {
      const key = String(item.quotationId);
      const group = itemMap.get(key) ?? [];
      group.push(item);
      itemMap.set(key, group);
    }

    return quotations
      .filter((quotation) => {
        if (!sameTenantKey(quotation.tenantKey, tenantKey)) {
          return false;
        }
        if (isAdmin) {
          return true;
        }
        return String(quotation.createdBy) === String(actor._id);
      })
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .map((quotation) => {
        const quotationItems = itemMap.get(String(quotation._id)) ?? [];
        return {
          ...quotation,
          itemCount: quotationItems.length,
          quotedItemsCount: quotationItems.filter((item) => typeof item.quotedPrice === "number").length,
          totalClientPrice: quotationItems.reduce((sum, item) => sum + (item.clientPrice ?? 0), 0),
          totalQuotedPrice: quotationItems.reduce((sum, item) => sum + (item.quotedPrice ?? 0), 0),
        };
      });
  },
});

export const getQuotationDetail = query({
  args: {
    adminId: v.id("users"),
    quotationId: v.id("quotations"),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);
    const quotation = await getQuotationOrThrow(ctx, args.quotationId, tenantKey);
    if (!isAdmin && String(quotation.createdBy) !== String(actor._id)) {
      throw new Error("No autorizado.");
    }

    const client = quotation.clientId ? await ctx.db.get(quotation.clientId) : null;
    const items = await ctx.db
      .query("quotationItems")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
      .collect();

    const rows = await Promise.all(
      items
        .filter((item) => sameTenantKey(item.tenantKey, tenantKey))
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .map(async (item) => ({
          ...item,
          photoUrl: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
        }))
    );

    return {
      ...quotation,
      client,
      items: rows,
      summary: {
        itemCount: rows.length,
        quotedItemsCount: rows.filter((item) => typeof item.quotedPrice === "number").length,
        totalClientPrice: rows.reduce((sum, item) => sum + (item.clientPrice ?? 0), 0),
        totalQuotedPrice: rows.reduce((sum, item) => sum + (item.quotedPrice ?? 0), 0),
      },
    };
  },
});

export const updateQuotation = mutation({
  args: {
    adminId: v.id("users"),
    quotationId: v.id("quotations"),
    clientName: v.string(),
    status: v.union(v.literal("draft"), v.literal("pricing"), v.literal("ready")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);
    const quotation = await getQuotationOrThrow(ctx, args.quotationId, tenantKey);
    if (!isAdmin && String(quotation.createdBy) !== String(actor._id)) {
      throw new Error("No autorizado.");
    }

    const safeClientName = args.clientName.trim();
    if (!safeClientName) {
      throw new Error("El nombre del cliente es obligatorio.");
    }

    await ctx.db.patch(args.quotationId, {
      clientName: safeClientName,
      status: args.status,
      notes: args.notes?.trim() || undefined,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const addQuotationItem = mutation({
  args: {
    adminId: v.id("users"),
    quotationId: v.id("quotations"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    reference: v.optional(v.string()),
    clientPrice: v.optional(v.number()),
    quotedPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);
    const quotation = await getQuotationOrThrow(ctx, args.quotationId, tenantKey);
    if (!isAdmin && String(quotation.createdBy) !== String(actor._id)) {
      throw new Error("No autorizado.");
    }

    const now = Date.now();
    const itemId = await ctx.db.insert("quotationItems", {
      quotationId: args.quotationId,
      brand: args.brand?.trim() || undefined,
      model: args.model?.trim() || undefined,
      reference: args.reference?.trim() || undefined,
      clientPrice: typeof args.clientPrice === "number" ? args.clientPrice : undefined,
      quotedPrice: typeof args.quotedPrice === "number" ? args.quotedPrice : undefined,
      notes: args.notes?.trim() || undefined,
      photoId: args.photoId,
      createdAt: now,
      updatedAt: now,
      createdBy: actor._id,
      tenantKey,
    });

    await ctx.db.patch(args.quotationId, {
      updatedAt: now,
    });

    return itemId;
  },
});

export const updateQuotationItem = mutation({
  args: {
    adminId: v.id("users"),
    itemId: v.id("quotationItems"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    reference: v.optional(v.string()),
    clientPrice: v.optional(v.number()),
    quotedPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Pieza de cotización no encontrada.");
    }
    if (!sameTenantKey(item.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const quotation = await getQuotationOrThrow(ctx, item.quotationId, tenantKey);
    if (!isAdmin && String(quotation.createdBy) !== String(actor._id)) {
      throw new Error("No autorizado.");
    }

    if (item.photoId && args.photoId && item.photoId !== args.photoId) {
      await ctx.storage.delete(item.photoId);
    }

    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      brand: args.brand?.trim() || undefined,
      model: args.model?.trim() || undefined,
      reference: args.reference?.trim() || undefined,
      clientPrice: typeof args.clientPrice === "number" ? args.clientPrice : undefined,
      quotedPrice: typeof args.quotedPrice === "number" ? args.quotedPrice : undefined,
      notes: args.notes?.trim() || undefined,
      photoId: args.photoId ?? item.photoId,
      updatedAt: now,
    });

    await ctx.db.patch(item.quotationId, {
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const deleteQuotationItem = mutation({
  args: {
    adminId: v.id("users"),
    itemId: v.id("quotationItems"),
  },
  handler: async (ctx, args) => {
    const { actor, tenantKey, isAdmin } = await getQuotationActorOrThrow(ctx, args.adminId);
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Pieza de cotización no encontrada.");
    }
    if (!sameTenantKey(item.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const quotation = await getQuotationOrThrow(ctx, item.quotationId, tenantKey);
    if (!isAdmin && String(quotation.createdBy) !== String(actor._id)) {
      throw new Error("No autorizado.");
    }

    if (item.photoId) {
      await ctx.storage.delete(item.photoId);
    }

    await ctx.db.delete(args.itemId);
    await ctx.db.patch(item.quotationId, {
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});
