import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey, type TenantKey } from "./tenants";

const CO_ADMIN_EMAILS = new Set(["admin@pmgmetales.com"]);
const CO_BUYER_EMAILS = new Set(["marlen@pmgmetales.com", "kenny@pmgmetales.com"]);
const PANAMA_ADMIN_EMAILS = new Set(["andres@pmgmetales.com"]);
const PANAMA_BUYER_EMAILS = new Set([
  "richie@pmgmetales.com",
  "andrescompra@pmgmetales.com",
]);
const BUYER_EXPENSE_FEATURE_EMAILS = new Set(["andrescompra@pmgmetales.com"]);

const inferFeaturesFromEmail = (email?: string): string[] | undefined => {
  const normalized = (email ?? "").trim().toLowerCase();
  const features: string[] = [];

  if (BUYER_EXPENSE_FEATURE_EMAILS.has(normalized)) {
    features.push("buyer_expenses");
  }

  return features.length ? features : undefined;
};

const inferIdentityFromEmail = (
  email?: string
): { role: "admin" | "buyer"; tenantKey: TenantKey } | null => {
  const normalized = (email ?? "").trim().toLowerCase();
  if (CO_ADMIN_EMAILS.has(normalized)) {
    return { role: "admin", tenantKey: "co" };
  }
  if (CO_BUYER_EMAILS.has(normalized)) {
    return { role: "buyer", tenantKey: "co" };
  }
  if (PANAMA_ADMIN_EMAILS.has(normalized)) {
    return { role: "admin", tenantKey: "pa" };
  }
  if (PANAMA_BUYER_EMAILS.has(normalized)) {
    return { role: "buyer", tenantKey: "pa" };
  }
  return null;
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
    const normalizedEmail = args.email?.trim().toLowerCase();
    const inferred = inferIdentityFromEmail(normalizedEmail);
    const inferredFeatures = inferFeaturesFromEmail(normalizedEmail);
    if (normalizedEmail && !inferred) {
      throw new Error("Usuario no autorizado en esta aplicación.");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: normalizedEmail || existing.email,
        name: args.name,
        role: inferred?.role ?? args.role,
        features: inferredFeatures ?? existing.features,
        tenantKey: inferred?.tenantKey ?? args.tenantKey ?? existing.tenantKey,
        phone: args.phone,
        city: args.city,
      });
      return existing._id;
    }

    if (!inferred) {
      throw new Error("Usuario no autorizado en esta aplicación.");
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: normalizedEmail,
      name: args.name,
      role: inferred.role,
      features: inferredFeatures,
      tenantKey: inferred.tenantKey,
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
    const inferredFeatures = inferFeaturesFromEmail(normalizedEmail);
    if (!inferred) {
      throw new Error("Usuario no autorizado en esta aplicación.");
    }

    if (existing) {
      const nextName = args.name?.trim() || existing.name;
      await ctx.db.patch(existing._id, {
        name: nextName,
        email: normalizedEmail || existing.email,
        role: inferred.role,
        features: inferredFeatures ?? existing.features,
        tenantKey: inferred.tenantKey,
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
      features: inferredFeatures,
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

export const setActiveStatus = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const [admin, targetUser] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.userId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    if (!targetUser) {
      throw new Error("Usuario no encontrado.");
    }

    const tenantKey = normalizeTenantKey(admin.tenantKey);
    if (!sameTenantKey(targetUser.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    await ctx.db.patch(args.userId, {
      active: args.active,
    });

    return { ok: true };
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
