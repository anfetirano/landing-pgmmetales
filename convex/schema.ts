import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("buyer"), v.literal("admin")),
    features: v.optional(v.array(v.string())),
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
    pmrCatalogValue: v.optional(v.number()),
    pmrValuedAt: v.optional(v.number()),
    pmrValuedBy: v.optional(v.id("users")),
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
    quantity: v.optional(v.number()), // aplica para pieza (cantidad de catalizadores)
    grams: v.optional(v.number()), // aplica para suelto o complemento
    unitPrice: v.optional(v.number()), // aplica para suelto (valor por gramo)
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

  buyerExpenses: defineTable({
    buyerId: v.id("users"),
    lotId: v.id("lots"),
    category: v.union(
      v.literal("gasolina"),
      v.literal("comida"),
      v.literal("parqueadero"),
      v.literal("otros")
    ),
    description: v.string(),
    amount: v.number(),
    receiptPhotoId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_lotId", ["lotId"])
    .index("by_createdAt", ["createdAt"]),

  quotations: defineTable({
    clientName: v.string(),
    clientId: v.optional(v.id("clients")),
    shareToken: v.optional(v.string()),
    sharedAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("pricing"),
      v.literal("ready")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_shareToken", ["shareToken"])
    .index("by_updatedAt", ["updatedAt"]),

  quotationItems: defineTable({
    quotationId: v.id("quotations"),
    pmgCode: v.optional(v.string()),
    pmgSequence: v.optional(v.number()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    reference: v.optional(v.string()),
    clientPrice: v.optional(v.number()),
    quotedPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
  })
    .index("by_quotationId", ["quotationId"])
    .index("by_quotationId_pmgSequence", ["quotationId", "pmgSequence"])
    .index("by_createdAt", ["createdAt"]),

  catalogPieces: defineTable({
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    pmgCode: v.optional(v.string()),
    pmgSequence: v.optional(v.number()),
    reference: v.optional(v.string()),
    altReferences: v.optional(v.array(v.string())),
    brand: v.optional(v.string()),
    canonicalName: v.string(),
    internalPrice: v.number(),
    currency: v.literal("USD"),
    samplePhotoUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.union(
      v.literal("manual"),
      v.literal("pmr"),
      v.literal("ecotrade"),
      v.literal("confirmed_field")
    ),
    confidence: v.union(
      v.literal("exact"),
      v.literal("probable"),
      v.literal("review_manually")
    ),
    createdByLabel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantKey", ["tenantKey"])
    .index("by_pmgCode", ["pmgCode"])
    .index("by_pmgSequence", ["pmgSequence"])
    .index("by_reference", ["reference"]),

  priceCheckRequests: defineTable({
    channel: v.union(v.literal("telegram"), v.literal("private_api")),
    requesterId: v.optional(v.string()),
    requesterLabel: v.optional(v.string()),
    tenantKey: v.optional(v.union(v.literal("co"), v.literal("pa"))),
    queryText: v.string(),
    photoUrl: v.optional(v.string()),
    catalogStatus: v.optional(v.string()),
    normalizedReference: v.optional(v.string()),
    normalizedBrand: v.optional(v.string()),
    pmrStatus: v.string(),
    ecotradeStatus: v.string(),
    overallConfidence: v.union(
      v.literal("exact"),
      v.literal("probable"),
      v.literal("review_manually")
    ),
    summaryText: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_requesterId", ["requesterId"])
    .index("by_tenantKey", ["tenantKey"]),

  priceCheckSessions: defineTable({
    channel: v.literal("telegram"),
    requesterId: v.string(),
    chatId: v.number(),
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    step: v.union(
      v.literal("awaiting_photo_choice"),
      v.literal("awaiting_photo_upload"),
      v.literal("awaiting_reference"),
      v.literal("awaiting_brand"),
      v.literal("awaiting_save_confirmation"),
      v.literal("awaiting_client_price")
    ),
    queryText: v.string(),
    photoUrl: v.optional(v.string()),
    normalizedReference: v.optional(v.string()),
    normalizedBrand: v.optional(v.string()),
    candidateTitle: v.optional(v.string()),
    candidateReference: v.optional(v.string()),
    candidateBrand: v.optional(v.string()),
    candidateConfidence: v.optional(
      v.union(
        v.literal("exact"),
        v.literal("probable"),
        v.literal("review_manually")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_chatId", ["chatId"]),

  whatsappCampaigns: defineTable({
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    zone: v.union(
      v.literal("panama"),
      v.literal("colon"),
      v.literal("chorrera"),
      v.literal("david"),
      v.literal("interior"),
      v.literal("all")
    ),
    templateKey: v.union(v.literal("morning_route"), v.literal("availability_check")),
    templateLabel: v.string(),
    metaTemplateName: v.string(),
    messageBody: v.string(),
    previewText: v.string(),
    createdAt: v.number(),
    createdBy: v.id("users"),
    totalRecipients: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("completed_with_errors"),
      v.literal("failed")
    ),
  })
    .index("by_tenantKey", ["tenantKey"])
    .index("by_createdAt", ["createdAt"]),

  whatsappCampaignRecipients: defineTable({
    campaignId: v.id("whatsappCampaigns"),
    clientId: v.id("clients"),
    tenantKey: v.union(v.literal("co"), v.literal("pa")),
    zone: v.union(
      v.literal("panama"),
      v.literal("colon"),
      v.literal("chorrera"),
      v.literal("david"),
      v.literal("interior")
    ),
    clientName: v.string(),
    phone: v.string(),
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_campaignId", ["campaignId"])
    .index("by_tenantKey", ["tenantKey"])
    .index("by_createdAt", ["createdAt"]),
});
