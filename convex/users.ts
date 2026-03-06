import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey, type TenantKey } from "./tenants";

const PANAMA_ADMIN_EMAILS = new Set(["andres@pmgmetales.com"]);
const PANAMA_BUYER_EMAILS = new Set([
  "richie@pmgmetales.com",
  "andrescompra@pmgmetales.com",
]);

const inferIdentityFromEmail = (email?: string): { role: "admin" | "buyer"; tenantKey: TenantKey } => {
  const normalized = (email ?? "").trim().toLowerCase();
  if (PANAMA_ADMIN_EMAILS.has(normalized)) {
    return { role: "admin", tenantKey: "pa" };
  }
  if (PANAMA_BUYER_EMAILS.has(normalized)) {
    return { role: "buyer", tenantKey: "pa" };
  }
  return { role: "buyer", tenantKey: "co" };
};

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("buyer"), v.literal("admin")),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email?.trim().toLowerCase() || existing.email,
        name: args.name,
        role: args.role,
        tenantKey: args.tenantKey ?? existing.tenantKey,
        phone: args.phone,
        city: args.city,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email?.trim().toLowerCase(),
      name: args.name,
      role: args.role,
      tenantKey: args.tenantKey,
      phone: args.phone,
      city: args.city,
      active: true,
    });
  },
});

export const syncFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const normalizedEmail = args.email?.trim().toLowerCase();
    const inferred = inferIdentityFromEmail(normalizedEmail);
    const isPanamaAdminEmail = !!normalizedEmail && PANAMA_ADMIN_EMAILS.has(normalizedEmail);
    const isPanamaMappedEmail =
      isPanamaAdminEmail || (!!normalizedEmail && PANAMA_BUYER_EMAILS.has(normalizedEmail));

    if (existing) {
      const nextName = args.name?.trim() || existing.name;
      await ctx.db.patch(existing._id, {
        name: nextName,
        email: normalizedEmail || existing.email,
        role: isPanamaAdminEmail ? "admin" : existing.role,
        tenantKey: isPanamaMappedEmail
          ? inferred.tenantKey
          : existing.tenantKey ?? inferred.tenantKey,
      });
      return existing._id;
    }

    const name =
      args.name?.trim() ||
      normalizedEmail?.split("@")[0] ||
      "Usuario";

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: normalizedEmail,
      name,
      role: inferred.role,
      tenantKey: inferred.tenantKey,
      active: true,
    });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// NUEVO: listar compradores
export const listBuyers = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.role === "buyer" && sameTenantKey(u.tenantKey, tenantKey));
  },
});
