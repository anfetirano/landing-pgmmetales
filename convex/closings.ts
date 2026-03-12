import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeTenantKey, sameTenantKey } from "./tenants";

export const createClosing = mutation({
  args: {
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    date: v.string(),
    purchaseIds: v.array(v.id("purchases")),
    totalPaid: v.number(),
    totalCommission: v.number(),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const buyer = await ctx.db.get(args.buyerId);
    if (!buyer) throw new Error("Comprador no encontrado.");
    const lot = await ctx.db.get(args.lotId);
    if (!lot) throw new Error("Lote no encontrado.");
    const tenantKey = normalizeTenantKey(buyer.tenantKey);
    if (!sameTenantKey(lot.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const uniquePurchaseIds = [...new Set(args.purchaseIds)];
    const purchases = await Promise.all(
      uniquePurchaseIds.map(async (purchaseId) => await ctx.db.get(purchaseId))
    );

    const closablePurchases = purchases.filter(
      (purchase): purchase is NonNullable<typeof purchase> =>
        !!purchase &&
        purchase.buyerId === args.buyerId &&
        purchase.lotId === args.lotId &&
        sameTenantKey(purchase.tenantKey, tenantKey) &&
        purchase.status !== "closed"
    );

    if (closablePurchases.length === 0) {
      throw new Error("No hay compras abiertas para cerrar.");
    }

    const totalPaid = closablePurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = closablePurchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalAmount = totalPaid + totalCommission;

    const closingId = await ctx.db.insert("dayClosings", {
      buyerId: args.buyerId,
      lotId: args.lotId,
      date: args.date,
      purchaseIds: closablePurchases.map((p) => p._id),
      totalPaid,
      totalCommission,
      totalAmount,
      notes: args.notes,
      status: "pending",
      createdAt: Date.now(),
      tenantKey,
    });

    for (const purchase of closablePurchases) {
      await ctx.db.patch(purchase._id, {
        status: "closed",
        closingId,
        closedAt: Date.now(),
      });
    }

    return closingId;
  },
});

export const listPending = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("No autorizado.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const closings = await ctx.db
      .query("dayClosings")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const detailed = await Promise.all(
      closings
        .filter((closing) => sameTenantKey(closing.tenantKey, tenantKey))
        .map(async (closing) => {
          const buyer = await ctx.db.get(closing.buyerId);
          const lot = await ctx.db.get(closing.lotId);
          const purchases = await Promise.all(
            closing.purchaseIds.map(async (purchaseId) => {
              const purchase = await ctx.db.get(purchaseId);
              if (!purchase || !sameTenantKey(purchase.tenantKey, tenantKey)) return null;
              const client = await ctx.db.get(purchase.clientId);
              const photoUrl = purchase.photoId ? await ctx.storage.getUrl(purchase.photoId) : null;

              return {
                _id: purchase._id,
                type: purchase.type,
                brand: purchase.brand,
                model: purchase.model,
                grams: purchase.grams,
                pricePaid: purchase.pricePaid,
                commission: purchase.commission,
                total: purchase.total,
                pmrCatalogValue: purchase.pmrCatalogValue ?? null,
                notes: purchase.notes,
                createdAt: purchase.createdAt,
                clientName: client?.name ?? "Cliente",
                approvedAt: purchase.approvedAt ?? null,
                photoUrl,
              };
            })
          );

          const purchaseRows = purchases
            .filter((p): p is NonNullable<typeof p> => !!p)
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

          return {
            ...closing,
            buyerName: buyer?.name ?? "Comprador",
            lotNumber: lot?.number ?? null,
            purchases: purchaseRows,
            approvedCount: purchaseRows.filter((p) => !!p.approvedAt).length,
            pendingCount: purchaseRows.filter((p) => !p.approvedAt).length,
          };
        })
    );

    return detailed.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const approvePurchasesInClosing = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
    purchaseIds: v.array(v.id("purchases")),
    pmrCatalogValues: v.optional(
      v.array(
        v.object({
          purchaseId: v.id("purchases"),
          value: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede aprobar compras.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const closing = await ctx.db.get(args.closingId);
    if (!closing) throw new Error("Cierre no encontrado.");
    if (!sameTenantKey(closing.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const closingPurchaseIds = new Set(closing.purchaseIds.map((id) => String(id)));
    const uniqueRequestedIds = [...new Set(args.purchaseIds)];
    const targetIds = uniqueRequestedIds.filter((id) => closingPurchaseIds.has(String(id)));
    if (targetIds.length === 0) {
      throw new Error("Selecciona al menos una compra del cierre.");
    }

    const isPanama = tenantKey === "pa";
    const pmrByPurchaseId = new Map<string, number>();
    for (const row of args.pmrCatalogValues ?? []) {
      if (!Number.isFinite(row.value) || row.value <= 0) {
        throw new Error("Valor PMR inválido.");
      }
      pmrByPurchaseId.set(String(row.purchaseId), row.value);
    }

    let approvedNow = 0;
    for (const purchaseId of targetIds) {
      const purchase = await ctx.db.get(purchaseId);
      if (!purchase) continue;
      if (!sameTenantKey(purchase.tenantKey, tenantKey)) continue;
      if (purchase.closingId !== args.closingId) continue;
      const providedPmrValue = pmrByPurchaseId.get(String(purchaseId));
      const effectivePmrValue =
        typeof providedPmrValue === "number" ? providedPmrValue : purchase.pmrCatalogValue;

      if (isPanama && (!effectivePmrValue || effectivePmrValue <= 0)) {
        throw new Error("En Panamá debes ingresar valor PMR para cada compra seleccionada.");
      }

      const patch: Record<string, unknown> = {};
      if (isPanama && typeof providedPmrValue === "number") {
        patch.pmrCatalogValue = providedPmrValue;
        patch.pmrValuedAt = Date.now();
        patch.pmrValuedBy = args.adminId;
      }
      if (!purchase.approvedAt) {
        patch.approvedAt = Date.now();
        patch.approvedBy = args.adminId;
        approvedNow += 1;
      }
      if (Object.keys(patch).length === 0) continue;

      await ctx.db.patch(purchaseId, patch);
    }

    const purchasesAfter = await Promise.all(
      closing.purchaseIds.map(async (purchaseId) => await ctx.db.get(purchaseId))
    );

    const validPurchases = purchasesAfter.filter(
      (purchase): purchase is NonNullable<typeof purchase> =>
        !!purchase &&
        purchase.closingId === args.closingId &&
        sameTenantKey(purchase.tenantKey, tenantKey)
    );

    const allApproved = validPurchases.length > 0 && validPurchases.every((purchase) => !!purchase.approvedAt);

    if (allApproved && closing.status !== "received") {
      await ctx.db.patch(args.closingId, {
        status: "received",
        receivedAt: Date.now(),
        receivedBy: args.adminId,
      });
    }

    return {
      ok: true,
      approvedNow,
      approvedTotal: validPurchases.filter((purchase) => !!purchase.approvedAt).length,
      totalPurchases: validPurchases.length,
      closingReceived: allApproved,
    };
  },
});

export const receiveClosing = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede aprobar cierres.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const closing = await ctx.db.get(args.closingId);
    if (!closing) {
      throw new Error("Cierre no encontrado.");
    }
    if (!sameTenantKey(closing.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }
    if (closing.status === "received") {
      return { ok: true, alreadyReceived: true };
    }

    await ctx.db.patch(args.closingId, {
      status: "received",
      receivedAt: Date.now(),
      receivedBy: args.adminId,
    });

    return { ok: true, alreadyReceived: false };
  },
});

export const recalculateClosingTotals = mutation({
  args: {
    closingId: v.id("dayClosings"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Solo el administrador puede recalcular cierres.");
    }
    const tenantKey = normalizeTenantKey(admin.tenantKey);

    const closing = await ctx.db.get(args.closingId);
    if (!closing) {
      throw new Error("Cierre no encontrado.");
    }
    if (!sameTenantKey(closing.tenantKey, tenantKey)) {
      throw new Error("No autorizado.");
    }

    const purchaseDocs = await Promise.all(
      closing.purchaseIds.map(async (purchaseId) => ({
        purchaseId,
        purchase: await ctx.db.get(purchaseId),
      }))
    );

    const validPurchases = purchaseDocs
      .filter(
        (row): row is { purchaseId: typeof row.purchaseId; purchase: NonNullable<typeof row.purchase> } =>
          !!row.purchase &&
          row.purchase.buyerId === closing.buyerId &&
          sameTenantKey(row.purchase.tenantKey, tenantKey)
      )
      .map((row) => row.purchase);

    if (validPurchases.length === 0) {
      throw new Error("El cierre no tiene compras válidas para recalcular.");
    }

    const totalPaid = validPurchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = validPurchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalAmount = totalPaid + totalCommission;

    await ctx.db.patch(args.closingId, {
      purchaseIds: validPurchases.map((p) => p._id),
      totalPaid,
      totalCommission,
      totalAmount,
    });

    return {
      ok: true,
      purchaseCount: validPurchases.length,
      totalPaid,
      totalCommission,
      totalAmount,
    };
  },
});
