import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { normalizeTenantKey, sameTenantKey } from "./tenants";
import {
  CAMPAIGN_SEGMENT_LABELS,
  CAMPAIGN_TEMPLATE_LABELS,
  type CampaignSegment,
  type ClientZone,
  normalizeCampaignPhone,
  renderCampaignPreview,
} from "../shared_client_campaigns";

const clientZoneValidator = v.union(
  v.literal("panama"),
  v.literal("colon"),
  v.literal("chorrera"),
  v.literal("david"),
  v.literal("interior")
);

const campaignSegmentValidator = v.union(
  v.literal("panama"),
  v.literal("colon"),
  v.literal("chorrera"),
  v.literal("david"),
  v.literal("interior"),
  v.literal("all")
);

const templateKeyValidator = v.union(v.literal("morning_route"), v.literal("availability_check"));

const getAdminOrThrow = async (ctx: any, adminId: any) => {
  const admin = await ctx.db.get(adminId);
  if (!admin || admin.role !== "admin") {
    throw new Error("No autorizado.");
  }
  const tenantKey = normalizeTenantKey(admin.tenantKey);
  if (tenantKey !== "pa") {
    throw new Error("Este módulo solo está disponible para Panamá.");
  }
  return { admin, tenantKey } as const;
};

const buildEligibleAudience = async (ctx: any, adminId: any, segment: CampaignSegment) => {
  const { tenantKey } = await getAdminOrThrow(ctx, adminId);
  const clients = await ctx.db.query("clients").collect();

  return clients
    .filter((client: any) => sameTenantKey(client.tenantKey, tenantKey))
    .filter((client: any) => (segment === "all" ? Boolean(client.zone) : client.zone === segment))
    .map((client: any) => ({
      client,
      normalizedPhone: client.phone ? normalizeCampaignPhone(client.phone, tenantKey) : null,
    }))
    .filter((item: any) => Boolean(item.normalizedPhone))
    .map((item: any) => ({
      clientId: item.client._id,
      clientName: item.client.name,
      phone: item.normalizedPhone as string,
      zone: item.client.zone as ClientZone,
    }));
};

const getMetaTemplateName = (segment: CampaignSegment) => {
  const envMap: Record<CampaignSegment, string | undefined> = {
    panama: process.env.WHATSAPP_TEMPLATE_PANAMA,
    colon: process.env.WHATSAPP_TEMPLATE_COLON,
    chorrera: process.env.WHATSAPP_TEMPLATE_CHORRERA,
    david: process.env.WHATSAPP_TEMPLATE_DAVID || process.env.WHATSAPP_TEMPLATE_INTERIOR,
    interior: process.env.WHATSAPP_TEMPLATE_INTERIOR,
    all: process.env.WHATSAPP_TEMPLATE_ALL || process.env.WHATSAPP_TEMPLATE_PANAMA,
  };
  return envMap[segment]?.trim() || "";
};

const sendTemplateMessage = async ({
  phone,
  clientName,
  messageBody,
  zone,
}: {
  phone: string;
  clientName: string;
  messageBody: string;
  zone: CampaignSegment;
}) => {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim() || "";
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim() || "";
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION?.trim() || "v22.0";
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE?.trim() || "es";
  const templateName = getMetaTemplateName(zone);

  if (!accessToken || !phoneNumberId) {
    throw new Error("Faltan variables de entorno de WhatsApp Cloud API.");
  }
  if (!templateName) {
    throw new Error(`No hay plantilla de WhatsApp configurada para ${CAMPAIGN_SEGMENT_LABELS[zone]}.`);
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: clientName.trim() || "cliente" },
              { type: "text", text: messageBody.trim() },
            ],
          },
        ],
      },
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    const message = json?.error?.message || "Error enviando mensaje a WhatsApp.";
    throw new Error(message);
  }

  return {
    messageId: json?.messages?.[0]?.id as string | undefined,
    templateName,
  };
};

export const getAudiencePreview = query({
  args: {
    adminId: v.id("users"),
    zone: campaignSegmentValidator,
  },
  handler: async (ctx, args) => {
    const recipients = await buildEligibleAudience(ctx, args.adminId, args.zone);
    return {
      zone: args.zone,
      zoneLabel: CAMPAIGN_SEGMENT_LABELS[args.zone],
      count: recipients.length,
      clients: recipients.slice(0, 12),
    };
  },
});

export const listByAdmin = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const { tenantKey } = await getAdminOrThrow(ctx, args.adminId);
    const campaigns = await ctx.db
      .query("whatsappCampaigns")
      .withIndex("by_tenantKey", (q) => q.eq("tenantKey", tenantKey))
      .collect();

    return campaigns
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)
      .map((campaign) => ({
        ...campaign,
        zoneLabel: CAMPAIGN_SEGMENT_LABELS[campaign.zone as CampaignSegment],
      }));
  },
});

export const getCampaignRecipients = query({
  args: {
    adminId: v.id("users"),
    campaignId: v.id("whatsappCampaigns"),
  },
  handler: async (ctx, args) => {
    const { tenantKey } = await getAdminOrThrow(ctx, args.adminId);
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign || campaign.tenantKey !== tenantKey) {
      throw new Error("Campaña no encontrada.");
    }

    const recipients = await ctx.db
      .query("whatsappCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    return recipients.sort((a, b) => a.clientName.localeCompare(b.clientName, "es", { sensitivity: "base" }));
  },
});

export const getAudienceForCampaign = internalQuery({
  args: {
    adminId: v.id("users"),
    zone: campaignSegmentValidator,
  },
  handler: async (ctx, args) => {
    const recipients = await buildEligibleAudience(ctx, args.adminId, args.zone);
    return recipients;
  },
});

export const getCampaignRecipientsForSend = internalQuery({
  args: {
    campaignId: v.id("whatsappCampaigns"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whatsappCampaignRecipients")
      .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const createCampaignRun = internalMutation({
  args: {
    adminId: v.id("users"),
    zone: campaignSegmentValidator,
    templateKey: templateKeyValidator,
    messageBody: v.string(),
    previewText: v.string(),
    metaTemplateName: v.string(),
    recipients: v.array(
      v.object({
        clientId: v.id("clients"),
        clientName: v.string(),
        phone: v.string(),
        zone: clientZoneValidator,
      })
    ),
  },
  handler: async (ctx, args) => {
    const { tenantKey } = await getAdminOrThrow(ctx, args.adminId);
    const createdAt = Date.now();
    const campaignId = await ctx.db.insert("whatsappCampaigns", {
      tenantKey,
      zone: args.zone,
      templateKey: args.templateKey,
      templateLabel: CAMPAIGN_TEMPLATE_LABELS[args.templateKey],
      metaTemplateName: args.metaTemplateName,
      messageBody: args.messageBody.trim(),
      previewText: args.previewText,
      createdAt,
      createdBy: args.adminId,
      totalRecipients: args.recipients.length,
      sentCount: 0,
      failedCount: 0,
      status: "processing",
    });

    await Promise.all(
      args.recipients.map((recipient) =>
        ctx.db.insert("whatsappCampaignRecipients", {
          campaignId,
          clientId: recipient.clientId,
          tenantKey,
          zone: recipient.zone,
          clientName: recipient.clientName,
          phone: recipient.phone,
          status: "queued",
          createdAt,
        })
      )
    );

    return campaignId;
  },
});

export const markRecipientStatus = internalMutation({
  args: {
    recipientId: v.id("whatsappCampaignRecipients"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipientId, {
      status: args.status,
      providerMessageId: args.providerMessageId,
      error: args.error,
      sentAt: Date.now(),
    });
  },
});

export const finalizeCampaignRun = internalMutation({
  args: {
    campaignId: v.id("whatsappCampaigns"),
    status: v.union(v.literal("completed"), v.literal("completed_with_errors"), v.literal("failed")),
    sentCount: v.number(),
    failedCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      status: args.status,
      sentCount: args.sentCount,
      failedCount: args.failedCount,
    });
  },
});
