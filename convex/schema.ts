import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("buyer"), v.literal("admin")),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    active: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),

  clients: defineTable({
    name: v.string(),
    isEmergency: v.optional(v.boolean()),
    contactName: v.optional(v.string()),
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    buyerId: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  }).index("by_buyerId", ["buyerId"]),

  lots: defineTable({
    number: v.number(),
    status: v.union(v.literal("open"), v.literal("closed")),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    refineryResult: v.optional(v.number()),
    profit: v.optional(v.number()),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  }).index("by_status", ["status"]),

  purchases: defineTable({
    buyerId: v.id("users"),
    clientId: v.id("clients"),
    lotId: v.id("lots"),

    type: v.union(v.literal("pieza"), v.literal("suelto")),
    brand: v.string(),
    model: v.optional(v.string()),
    grams: v.optional(v.number()),

    pricePaid: v.number(),
    commission: v.number(),
    total: v.number(),

    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    closingId: v.optional(v.id("dayClosings")),
    closedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_clientId", ["clientId"])
    .index("by_lotId", ["lotId"])
    .index("by_createdAt", ["createdAt"]),

  dayClosings: defineTable({
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    date: v.string(),

    purchaseIds: v.array(v.id("purchases")),
    totalPaid: v.number(),
    totalCommission: v.number(),
    totalAmount: v.number(),

    status: v.union(v.literal("pending"), v.literal("received")),
    receivedAt: v.optional(v.number()),
    receivedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  }).index("by_buyerId", ["buyerId"]),

  cashMovements: defineTable({
    buyerId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("opening"),
      v.literal("fund"),
      v.literal("adjustment"),
      v.literal("expense"),
      v.literal("reset")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_createdAt", ["createdAt"]),

  // NUEVO: Proveedores (sin login por ahora, gestionados por admin)
  suppliers: defineTable({
    name: v.string(),
    city: v.optional(v.string()),
    identification: v.optional(v.string()),
    contactName: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
    active: v.optional(v.boolean()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_name", ["name"])
    .index("by_active", ["active"]),

  // NUEVO: Movimientos de dinero para proveedores
  supplierMovements: defineTable({
    supplierId: v.id("suppliers"),
    lotId: v.optional(v.id("lots")),
    amount: v.number(),
    type: v.union(
      v.literal("opening"),    // apertura/base nueva
      v.literal("fund"),       // agregar base
      v.literal("adjustment"), // ajuste (-)
      v.literal("expense"),    // gasto (-)
      v.literal("carryover")   // saldo arrastrado desde lote anterior
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_lotId", ["lotId"])
    .index("by_createdAt", ["createdAt"]),

  // NUEVO: Ingresos/cargas del proveedor (descuentan saldo)
  supplierPurchases: defineTable({
    supplierId: v.id("suppliers"),
    lotId: v.optional(v.id("lots")),

    type: v.union(v.literal("pieza"), v.literal("suelto")),
    description: v.string(),       // ej: "Lote 1", "Catalizadores mixtos"
    model: v.optional(v.string()), // aplica para pieza
    grams: v.optional(v.number()), // aplica para suelto o complemento
    pricePaid: v.number(),         // valor pagado al proveedor
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),

    createdAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_supplierId", ["supplierId"])
    .index("by_lotId", ["lotId"])
    .index("by_createdAt", ["createdAt"]),
});
