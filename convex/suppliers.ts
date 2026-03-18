import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

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
    const tenantKey = normalizeTenantKey(admin.tenantKey);

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
      tenantKey,
    });
  },
});

export const listSuppliers = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const items = await ctx.db.query("suppliers").collect();
    return items
      .filter((supplier) => sameTenantKey(supplier.tenantKey, tenantKey))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const deleteSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.deletedBy);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede eliminar proveedores.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado.");
    }
    if (!sameTenantKey(supplier.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const [movements, purchases] = await Promise.all([
      ctx.db
        .query("supplierMovements")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
        .collect(),
      ctx.db
        .query("supplierPurchases")
        .withIndex("by_supplierId", (q) => q.eq("supplierId", args.supplierId))
        .collect(),
    ]);

    const hasMovements = movements.some((movement) =>
      sameTenantKey(movement.tenantKey, tenantKey)
    );
    const hasPurchases = purchases.some((purchase) =>
      sameTenantKey(purchase.tenantKey, tenantKey)
    );

    if (hasMovements || hasPurchases) {
      throw new Error(
        "No se puede eliminar este proveedor porque ya tiene movimientos o cargas registradas."
      );
    }

    await ctx.db.delete(args.supplierId);
    return { ok: true };
  },
});
