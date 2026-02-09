import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    role: v.union(v.literal("buyer"), v.literal("admin")),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    active: v.optional(v.boolean()),
  }).index("by_clerkId", ["clerkId"]),

  clients: defineTable({
    name: v.string(),              // nombre del taller o cliente
    contactName: v.optional(v.string()), // nombre de contacto
    cedula: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    buyerId: v.id("users"),
  }).index("by_buyerId", ["buyerId"]),

  lots: defineTable({
    number: v.number(),
    status: v.union(v.literal("open"), v.literal("closed")),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    refineryResult: v.optional(v.number()),
    profit: v.optional(v.number()),
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
    createdAt: v.number(),
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
  }).index("by_buyerId", ["buyerId"]),
});
