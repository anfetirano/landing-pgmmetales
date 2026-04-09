import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

const normalize = (value: string | undefined | null) =>
  value
    ?.trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

export const saveCatalogPiece = mutation({
  args: {
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    reference: v.optional(v.string()),
    altReferences: v.optional(v.array(v.string())),
    brand: v.optional(v.string()),
    canonicalName: v.string(),
    internalPrice: v.number(),
    samplePhotoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.union(
      v.literal("manual"),
      v.literal("pmr"),
      v.literal("ecotrade"),
      v.literal("confirmed_field")
    ),
    confidence: v.union(
      v.literal("exact"),
      v.literal("probable"),
      v.literal("review_manually")
    ),
    createdByLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reference = normalize(args.reference);
    const brand = normalize(args.brand);
    const canonicalName = args.canonicalName.trim();
    const now = Date.now();

    const existing = reference
      ? await ctx.db
          .query("catalogPieces")
          .withIndex("by_reference", (q) => q.eq("reference", reference))
          .collect()
      : [];

    const sameTenant = existing.find(
      (item) =>
        item.tenantKey === args.tenantKey &&
        normalize(item.brand) === brand
    );

    const payload = {
      tenantKey: args.tenantKey,
      reference,
      altReferences: args.altReferences?.map(normalize).filter(Boolean) as
        | string[]
        | undefined,
      brand,
      canonicalName,
      internalPrice: args.internalPrice,
      currency: "USD" as const,
      samplePhotoUrl: args.samplePhotoUrl,
      notes: args.notes?.trim(),
      source: args.source,
      confidence: args.confidence,
      createdByLabel: args.createdByLabel?.trim(),
      updatedAt: now,
    };

    if (sameTenant) {
      await ctx.db.patch(sameTenant._id, payload);
      return sameTenant._id;
    }

    return await ctx.db.insert("catalogPieces", {
      ...payload,
      createdAt: now,
    });
  },
});

export const searchCatalog = query({
  args: {
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    reference: v.optional(v.string()),
    brand: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("catalogPieces")
      .withIndex("by_tenantKey", (q) => q.eq("tenantKey", args.tenantKey))
      .collect();

    const reference = normalize(args.reference);
    const brand = normalize(args.brand);

    const filtered = items.filter((item) => {
      const references = [item.reference, ...(item.altReferences ?? [])]
        .map(normalize)
        .filter(Boolean);

      const referenceHit = reference
        ? references.some(
            (candidate) =>
              candidate === reference ||
              candidate?.includes(reference) ||
              reference.includes(candidate ?? "")
          )
        : true;

      const brandHit = brand ? normalize(item.brand) === brand : true;

      return referenceHit && brandHit;
    });

    return filtered
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, args.limit ?? 10);
  },
});

export const listByAdmin = query({
  args: {
    adminId: v.id("users"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const search = normalize(args.search);

    const items = await ctx.db
      .query("catalogPieces")
      .withIndex("by_tenantKey", (q) => q.eq("tenantKey", tenantKey))
      .collect();

    return items
      .filter((item) => {
        if (!search) return true;
        const haystack = [
          item.reference,
          ...(item.altReferences ?? []),
          item.brand,
          item.canonicalName,
          item.notes,
        ]
          .filter(Boolean)
          .map(normalize)
          .join(" ");

        return haystack.includes(search);
      })
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});

export const saveCatalogPieceAsAdmin = mutation({
  args: {
    adminId: v.id("users"),
    pieceId: v.optional(v.id("catalogPieces")),
    reference: v.optional(v.string()),
    altReferences: v.optional(v.array(v.string())),
    brand: v.optional(v.string()),
    canonicalName: v.string(),
    internalPrice: v.number(),
    samplePhotoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.union(
      v.literal("manual"),
      v.literal("pmr"),
      v.literal("ecotrade"),
      v.literal("confirmed_field")
    ),
    confidence: v.union(
      v.literal("exact"),
      v.literal("probable"),
      v.literal("review_manually")
    ),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const reference = normalize(args.reference);
    const brand = normalize(args.brand);
    const canonicalName = args.canonicalName.trim();
    const now = Date.now();

    const payload = {
      tenantKey,
      reference,
      altReferences: args.altReferences?.map(normalize).filter(Boolean) as
        | string[]
        | undefined,
      brand,
      canonicalName,
      internalPrice: args.internalPrice,
      currency: "USD" as const,
      samplePhotoUrl: args.samplePhotoUrl?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      source: args.source,
      confidence: args.confidence,
      createdByLabel: admin.name,
      updatedAt: now,
    };

    if (args.pieceId) {
      const existing = await ctx.db.get(args.pieceId);
      if (!existing || !sameTenantKey(existing.tenantKey, tenantKey)) {
        throw new Error("Pieza no encontrada.");
      }
      await ctx.db.patch(args.pieceId, payload);
      return args.pieceId;
    }

    return await ctx.db.insert("catalogPieces", {
      ...payload,
      createdAt: now,
    });
  },
});

export const deleteCatalogPieceAsAdmin = mutation({
  args: {
    adminId: v.id("users"),
    pieceId: v.id("catalogPieces"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const piece = await ctx.db.get(args.pieceId);
    if (!piece || !sameTenantKey(piece.tenantKey, tenantKey)) {
      throw new Error("Pieza no encontrada.");
    }

    await ctx.db.delete(args.pieceId);
    return { ok: true };
  },
});
