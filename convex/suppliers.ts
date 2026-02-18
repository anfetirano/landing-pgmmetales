import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createSupplier = mutation({
  args: {
    name: v.string(),
    city: v.optional(v.string()),
    identification: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.createdBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede crear proveedores.");
    }

    if (!args.name.trim()) {
      throw new Error("El nombre es obligatorio.");
    }

    return await ctx.db.insert("suppliers", {
      name: args.name.trim(),
      city: args.city?.trim(),
      identification: args.identification?.trim(),
      contactName: args.contactName?.trim(),
      phone: args.phone?.trim(),
      active: true,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const listSuppliers = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("suppliers").collect();
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },
});
