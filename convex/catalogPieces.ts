import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

const normalize = (value: string | undefined | null) =>
  value
    ?.trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const formatPmgCode = (sequence: number) =>
  `PMG-${String(sequence).padStart(4, "0")}`;

const parsePmgSequence = (pmgCode?: string | null) => {
  const match = pmgCode?.match(/^PMG-(\d+)$/i);
  return match ? Number(match[1]) : undefined;
};

const getNextPmgSequence = async (ctx: any) => {
  const items = await ctx.db.query("catalogPieces").collect();
  return (
    items.reduce((max: number, item: any) => {
      const sequence =
        typeof item.pmgSequence === "number"
          ? item.pmgSequence
          : parsePmgSequence(item.pmgCode) ?? 0;
      return Math.max(max, sequence);
    }, 0) + 1
  );
};

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

    const pmgSequence = await getNextPmgSequence(ctx);

    return await ctx.db.insert("catalogPieces", {
      ...payload,
      pmgCode: formatPmgCode(pmgSequence),
      pmgSequence,
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
          item.pmgCode,
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
      .sort((a, b) => {
        const sequenceA =
          typeof a.pmgSequence === "number"
            ? a.pmgSequence
            : parsePmgSequence(a.pmgCode) ?? Number.MAX_SAFE_INTEGER;
        const sequenceB =
          typeof b.pmgSequence === "number"
            ? b.pmgSequence
            : parsePmgSequence(b.pmgCode) ?? Number.MAX_SAFE_INTEGER;

        if (sequenceA !== sequenceB) {
          return sequenceA - sequenceB;
        }

        return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      });
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

    const pmgSequence = await getNextPmgSequence(ctx);

    return await ctx.db.insert("catalogPieces", {
      ...payload,
      pmgCode: formatPmgCode(pmgSequence),
      pmgSequence,
      createdAt: now,
    });
  },
});

export const assignMissingPmgCodes = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const items = await ctx.db.query("catalogPieces").collect();
    const tenantItems = items
      .filter((piece) => sameTenantKey(piece.tenantKey, tenantKey))
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

    let nextSequence = await getNextPmgSequence(ctx);
    let assigned = 0;

    for (const piece of tenantItems) {
      const currentSequence =
        typeof piece.pmgSequence === "number"
          ? piece.pmgSequence
          : parsePmgSequence(piece.pmgCode);

      if (typeof currentSequence === "number" && piece.pmgCode) {
        continue;
      }

      await ctx.db.patch(piece._id, {
        pmgCode: formatPmgCode(nextSequence),
        pmgSequence: nextSequence,
        updatedAt: Date.now(),
      });
      nextSequence += 1;
      assigned += 1;
    }

    return {
      assigned,
      total: tenantItems.length,
    };
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
