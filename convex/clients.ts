import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertUserIsActive, normalizeTenantKey, sameTenantKey } from "./tenants";
import {
  CLIENT_ZONE_LABELS,
  inferPanamaZoneFromCoordinates,
  type ClientZone,
} from "../shared_client_campaigns";

export const createClient = mutation({
  args: {
    name: v.string(),
    isEmergency: v.optional(v.boolean()),
    contactName: v.optional(v.string()),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    zone: v.optional(
      v.union(
        v.literal("panama"),
        v.literal("colon"),
        v.literal("chorrera"),
        v.literal("david"),
        v.literal("interior")
      )
    ),
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
    assertUserIsActive(buyer);
    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const safeName = args.name.trim();

    if (!safeName) {
      throw new Error("El nombre del cliente es obligatorio.");
    }

    return await ctx.db.insert("clients", {
      name: safeName,
      isEmergency: args.isEmergency === true ? true : undefined,
      contactName: args.contactName?.trim() || undefined,
      cedula: args.cedula?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      zone: tenantKey === "pa" ? args.zone : undefined,
      photoId: args.photoId,
      address: args.address?.trim() || undefined,
      lat: args.lat,
      lng: args.lng,
      buyerId: args.buyerId,
      tenantKey,
    });
  },
});

export const listByBuyer = query({
  args: { buyerId: v.id("users") },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) return [];
    assertUserIsActive(buyer);
    const tenantKey = normalizeTenantKey(buyer.tenantKey);

    const items =
      tenantKey === "pa"
        ? await ctx.db.query("clients").collect()
        : await ctx.db
            .query("clients")
            .withIndex("by_buyerId", (q) => q.eq("buyerId", args.buyerId))
            .collect();

    return await Promise.all(
      items
        .filter((c) => sameTenantKey(c.tenantKey, tenantKey))
        .map(async (c) => {
          const owner = await ctx.db.get(c.buyerId);
          return {
            ...c,
            buyerName: owner?.name ?? "Comprador",
            photoUrl: c.photoId ? await ctx.storage.getUrl(c.photoId) : null,
          };
        })
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
    zone: v.optional(
      v.union(
        v.literal("panama"),
        v.literal("colon"),
        v.literal("chorrera"),
        v.literal("david"),
        v.literal("interior")
      )
    ),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.clientId);
    if (!existing) {
      throw new Error("Cliente no encontrado.");
    }
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) {
      throw new Error("Comprador no encontrado.");
    }
    assertUserIsActive(buyer);
    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    const canEdit =
      tenantKey === "pa"
        ? sameTenantKey(existing.tenantKey, tenantKey)
        : existing.buyerId === args.buyerId;

    if (!canEdit) {
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
      zone: tenantKey === "pa" ? args.zone : undefined,
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
    zone: v.optional(
      v.union(
        v.literal("panama"),
        v.literal("colon"),
        v.literal("chorrera"),
        v.literal("david"),
        v.literal("interior")
      )
    ),
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
      zone: tenantKey === "pa" ? args.zone : undefined,
    });

    return { ok: true };
  },
});

export const deleteClientAsAdmin = mutation({
  args: {
    clientId: v.id("clients"),
    adminId: v.id("users"),
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

    const linkedPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const hasPurchases = linkedPurchases.some((purchase) =>
      sameTenantKey(purchase.tenantKey, tenantKey)
    );
    if (hasPurchases) {
      throw new Error(
        "No se puede eliminar: este cliente tiene compras registradas. Elimina o corrige primero esas compras."
      );
    }

    if (existing.photoId) {
      await ctx.storage.delete(existing.photoId);
    }

    await ctx.db.delete(args.clientId);
    return { ok: true };
  },
});

export const previewPanamaZoneAssignments = query({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    if (tenantKey !== "pa") {
      throw new Error("Este proceso solo aplica a Panamá.");
    }

    const clients = await ctx.db.query("clients").collect();
    const panamaClients = clients.filter((client) => sameTenantKey(client.tenantKey, tenantKey));
    const summary: Record<ClientZone, number> = {
      panama: 0,
      colon: 0,
      chorrera: 0,
      david: 0,
      interior: 0,
    };

    const assignments = panamaClients
      .map((client) => {
        const suggestedZone = inferPanamaZoneFromCoordinates(client.lat, client.lng);
        if (suggestedZone) {
          summary[suggestedZone] += 1;
        }
        return {
          clientId: client._id,
          name: client.name,
          phone: client.phone ?? null,
          currentZone: client.zone ?? null,
          suggestedZone,
          suggestedZoneLabel: suggestedZone ? CLIENT_ZONE_LABELS[suggestedZone] : null,
          lat: client.lat ?? null,
          lng: client.lng ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

    const assignable = assignments.filter((item) => item.suggestedZone !== null);
    const withoutCoordinates = assignments.filter((item) => item.suggestedZone === null);
    const changed = assignable.filter((item) => item.currentZone !== item.suggestedZone);

    return {
      totalPanamaClients: assignments.length,
      assignableCount: assignable.length,
      withoutCoordinatesCount: withoutCoordinates.length,
      changedCount: changed.length,
      summary,
      assignments,
      withoutCoordinates,
    };
  },
});

export const applyPanamaZoneAssignments = mutation({
  args: {
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);
    if (tenantKey !== "pa") {
      throw new Error("Este proceso solo aplica a Panamá.");
    }

    const clients = await ctx.db.query("clients").collect();
    const panamaClients = clients.filter((client) => sameTenantKey(client.tenantKey, tenantKey));
    const summary: Record<ClientZone, number> = {
      panama: 0,
      colon: 0,
      chorrera: 0,
      david: 0,
      interior: 0,
    };

    let updatedCount = 0;
    let unchangedCount = 0;
    let skippedCount = 0;

    for (const client of panamaClients) {
      const suggestedZone = inferPanamaZoneFromCoordinates(client.lat, client.lng);
      if (!suggestedZone) {
        skippedCount += 1;
        continue;
      }

      summary[suggestedZone] += 1;
      if (client.zone === suggestedZone) {
        unchangedCount += 1;
        continue;
      }

      await ctx.db.patch(client._id, { zone: suggestedZone });
      updatedCount += 1;
    }

    return {
      totalPanamaClients: panamaClients.length,
      updatedCount,
      unchangedCount,
      skippedCount,
      summary,
    };
  },
});
