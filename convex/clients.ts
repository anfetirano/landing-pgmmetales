import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
    return await ctx.db.insert("clients", args);
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("clients")
      .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
      .collect();

    return await Promise.all(
      items.map(async (c) => ({
        ...c,
        photoUrl: c.photoId ? await ctx.storage.getUrl(c.photoId) : null,
      }))
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
