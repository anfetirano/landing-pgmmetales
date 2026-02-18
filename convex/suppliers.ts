import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSupplier = mutation({
  args: {
    name: v.string(),
    city: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede crear proveedores.");
    }

    return await ctx.db.insert("suppliers", {
      name: args.name.trim(),
      city: args.city?.trim(),
      contactName: args.contactName?.trim(),
      phone: args.phone?.trim(),
      notes: args.notes?.trim(),
      active: true,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const updateSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    name: v.string(),
    city: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.updatedBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede editar proveedores.");
    }

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }

    await ctx.db.patch(args.supplierId, {
      name: args.name.trim(),
      city: args.city?.trim(),
      contactName: args.contactName?.trim(),
      phone: args.phone?.trim(),
      notes: args.notes?.trim(),
      active: args.active ?? supplier.active ?? true,
    });

    return { ok: true };
  },
});

export const listSuppliers = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("suppliers").collect();
    return items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  },
});

export const getSupplierById = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.supplierId);
  },
});
