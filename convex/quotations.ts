import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isUserActive, normalizeTenantKey, sameTenantKey } from "./tenants";

const BUYER_QUOTATION_FEATURE = "buyer_quotations";
const ANDRES_COMPRA_EMAIL = "andrescompra@pmgmetales.com";

const hasBuyerQuotationFeature = (features?: string[]) =>
  Array.isArray(features) && features.includes(BUYER_QUOTATION_FEATURE);

const isAndresCompraEmail = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === ANDRES_COMPRA_EMAIL;

const createShareToken = () =>
  `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, "")}`;

const formatPmgCode = (sequence: number) =>
  `PMG-${String(sequence).padStart(4, "0")}`;

const parsePmgSequence = (pmgCode?: string | null) => {
  const match = pmgCode?.match(/^PMG-(\d+)$/i);
  return match ? Number(match[1]) : undefined;
};

const getQuotationItemSequence = (item: {
  pmgSequence?: number;
  pmgCode?: string;
  createdAt?: number;
}) =>
  typeof item.pmgSequence === "number"
    ? item.pmgSequence
    : parsePmgSequence(item.pmgCode);

const sortQuotationItems = <T extends { pmgSequence?: number; pmgCode?: string; createdAt?: number }>(
  items: T[]
) =>
  [...items].sort((a, b) => {
    const sequenceA = getQuotationItemSequence(a);
    const sequenceB = getQuotationItemSequence(b);

    if (typeof sequenceA === "number" && typeof sequenceB === "number" && sequenceA !== sequenceB) {
      return sequenceA - sequenceB;
    }
    if (typeof sequenceA === "number") return -1;
    if (typeof sequenceB === "number") return 1;
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  });

const getNextQuotationItemSequence = async (ctx: any, quotationId: any) => {
  const items = await ctx.db
    .query("quotationItems")
    .withIndex("by_quotationId", (q: any) => q.eq("quotationId", quotationId))
    .collect();

  return (
    items.reduce((max: number, item: any) => {
      const sequence = getQuotationItemSequence(item) ?? 0;
      return Math.max(max, sequence);
    }, 0) + 1
  );
};

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
      sortQuotationItems(
        items
        .filter((item) => sameTenantKey(item.tenantKey, tenantKey))
      )
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

export const ensureShareLink = mutation({
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

    const shareToken = quotation.shareToken ?? createShareToken();
    if (!quotation.shareToken) {
      await ctx.db.patch(args.quotationId, {
        shareToken,
        sharedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      shareToken,
      path: `/cotizacion/${shareToken}`,
    };
  },
});

export const getSharedQuotation = query({
  args: {
    shareToken: v.string(),
  },
  handler: async (ctx, args) => {
    const quotation = await ctx.db
      .query("quotations")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .unique();

    if (!quotation || !quotation.shareToken) {
      throw new Error("Cotización no encontrada.");
    }

    const items = await ctx.db
      .query("quotationItems")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", quotation._id))
      .collect();

    const rows = await Promise.all(
      sortQuotationItems(
        items
        .filter((item) => sameTenantKey(item.tenantKey, normalizeTenantKey(quotation.tenantKey)))
      )
        .map(async (item) => ({
          ...item,
          photoUrl: item.photoId ? await ctx.storage.getUrl(item.photoId) : null,
        }))
    );

    return {
      quotation: {
        _id: quotation._id,
        clientName: quotation.clientName,
        status: quotation.status,
        notes: quotation.notes ?? null,
        updatedAt: quotation.updatedAt,
      },
      items: rows,
      summary: {
        itemCount: rows.length,
        totalClientPrice: rows.reduce((sum, item) => sum + (item.clientPrice ?? 0), 0),
      },
    };
  },
});

export const updateSharedQuotationItemPrice = mutation({
  args: {
    shareToken: v.string(),
    itemId: v.id("quotationItems"),
    clientPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const quotation = await ctx.db
      .query("quotations")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .unique();

    if (!quotation || !quotation.shareToken) {
      throw new Error("Cotización no encontrada.");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item || String(item.quotationId) !== String(quotation._id)) {
      throw new Error("Pieza no encontrada.");
    }

    if (
      typeof args.clientPrice === "number" &&
      (!Number.isFinite(args.clientPrice) || Number.isNaN(args.clientPrice))
    ) {
      throw new Error("Precio inválido.");
    }

    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      clientPrice: typeof args.clientPrice === "number" ? args.clientPrice : undefined,
      updatedAt: now,
    });

    await ctx.db.patch(quotation._id, {
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const updateSharedQuotationItem = mutation({
  args: {
    shareToken: v.string(),
    itemId: v.id("quotationItems"),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    clientPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const quotation = await ctx.db
      .query("quotations")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .unique();

    if (!quotation || !quotation.shareToken) {
      throw new Error("Cotización no encontrada.");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item || String(item.quotationId) !== String(quotation._id)) {
      throw new Error("Pieza no encontrada.");
    }

    if (
      typeof args.clientPrice === "number" &&
      (!Number.isFinite(args.clientPrice) || Number.isNaN(args.clientPrice))
    ) {
      throw new Error("Precio inválido.");
    }

    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      brand: args.brand?.trim() || undefined,
      model: args.model?.trim() || undefined,
      reference: args.reference?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      clientPrice: typeof args.clientPrice === "number" ? args.clientPrice : undefined,
      updatedAt: now,
    });

    await ctx.db.patch(quotation._id, {
      updatedAt: now,
    });

    return { ok: true };
  },
});

export const deleteQuotation = mutation({
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

    const items = await ctx.db
      .query("quotationItems")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
      .collect();

    const tenantItems = items.filter((item) => sameTenantKey(item.tenantKey, tenantKey));

    await Promise.all(
      tenantItems.map(async (item) => {
        if (item.photoId) {
          await ctx.storage.delete(item.photoId);
        }
        await ctx.db.delete(item._id);
      })
    );

    await ctx.db.delete(args.quotationId);

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
    const pmgSequence = await getNextQuotationItemSequence(ctx, args.quotationId);
    const itemId = await ctx.db.insert("quotationItems", {
      quotationId: args.quotationId,
      pmgCode: formatPmgCode(pmgSequence),
      pmgSequence,
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

export const assignMissingQuotationItemCodes = mutation({
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

    const items = await ctx.db
      .query("quotationItems")
      .withIndex("by_quotationId", (q) => q.eq("quotationId", args.quotationId))
      .collect();

    const tenantItems = sortQuotationItems(
      items.filter((item) => sameTenantKey(item.tenantKey, tenantKey))
    );

    let nextSequence = 1;
    let assigned = 0;

    for (const item of tenantItems) {
      const currentSequence = getQuotationItemSequence(item);
      if (typeof currentSequence === "number" && item.pmgCode) {
        nextSequence = Math.max(nextSequence, currentSequence + 1);
        continue;
      }

      await ctx.db.patch(item._id, {
        pmgCode: formatPmgCode(nextSequence),
        pmgSequence: nextSequence,
        updatedAt: Date.now(),
      });
      nextSequence += 1;
      assigned += 1;
    }

    await ctx.db.patch(args.quotationId, {
      updatedAt: Date.now(),
    });

    return {
      assigned,
      total: tenantItems.length,
      nextCode: formatPmgCode(nextSequence),
    };
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
