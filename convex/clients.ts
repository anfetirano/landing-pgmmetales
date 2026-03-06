import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

export const createClient = mutation({
  args: {
    name: v.string(),
    contactName: v.optional(v.string()),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    buyerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    return await ctx.db.insert("clients", {
      ...args,
      tenantKey,
    });
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items = await ctx.db
      .query("clients")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    return await Promise.all(
      items
        .filter((c) => sameTenantKey(c.tenantKey, tenantKey))
        .map(async (c) => ({
        ...c,
        photoUrl: c.photoId ? await ctx.storage.getUrl(c.photoId) : null,
      }))
    );
  },
});

export const listAllForAdmin = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const items = await ctx.db.query("clients").collect();

    return await Promise.all(
      items.filter((c) => sameTenantKey(c.tenantKey, tenantKey)).map(async (c) => {
        const buyer = await ctx.db.get(c.buyerId);
        return {
          ...c,
          buyerName: buyer?.name ?? "Comprador",
          photoUrl: c.photoId ? await ctx.storage.getUrl(c.photoId) : null,
        };
      })
    );
  },
});

export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    buyerId: v.id("users"),
    name: v.string(),
    contactName: v.optional(v.string()),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.clientId);
    if (!existing) {
      throw new Error("Cliente no encontrado.");
    }
    if (existing.buyerId !== args.buyerId) {
      throw new Error("No autorizado para editar este cliente.");
    }
    if (!args.name.trim()) {
      throw new Error("El nombre del cliente es obligatorio.");
    }

    if (existing.photoId && args.photoId && existing.photoId !== args.photoId) {
      await ctx.storage.delete(existing.photoId);
    }

    await ctx.db.patch(args.clientId, {
      name: args.name.trim(),
      contactName: args.contactName?.trim() || undefined,
      cedula: args.cedula?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      photoId: args.photoId,
    });

    return { ok: true };
  },
});

export const updateClientAsAdmin = mutation({
  args: {
    clientId: v.id("clients"),
    adminId: v.id("users"),
    name: v.string(),
    contactName: v.optional(v.string()),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const existing = await ctx.db.get(args.clientId);
    if (!existing) {
      throw new Error("Cliente no encontrado.");
    }
    if (!sameTenantKey(existing.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }
    if (!args.name.trim()) {
      throw new Error("El nombre del cliente es obligatorio.");
    }

    await ctx.db.patch(args.clientId, {
      name: args.name.trim(),
      contactName: args.contactName?.trim() || undefined,
      cedula: args.cedula?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
    });

    return { ok: true };
  },
});
