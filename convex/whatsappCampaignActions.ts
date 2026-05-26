import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  CAMPAIGN_SEGMENT_LABELS,
  renderCampaignPreview,
} from "../shared_client_campaigns";

const campaignSegmentValidator = v.union(
  v.literal("panama"),
  v.literal("colon"),
  v.literal("chorrera"),
  v.literal("david"),
  v.literal("interior"),
  v.literal("all")
);

const templateKeyValidator = v.union(v.literal("morning_route"), v.literal("availability_check"));

type ClientZone = "panama" | "colon" | "chorrera" | "david" | "interior";
type CampaignSegment = ClientZone | "all";

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

export const sendWhatsAppCampaign = action({
  args: {
    adminId: v.id("users"),
    zone: campaignSegmentValidator,
    templateKey: templateKeyValidator,
    messageBody: v.string(),
  },
  handler: async (ctx, args) => {
    const messageBody = args.messageBody.trim();
    if (!messageBody) {
      throw new Error("El mensaje es obligatorio.");
    }

    const recipients = await ctx.runQuery("whatsappCampaigns:getAudienceForCampaign" as any, {
      adminId: args.adminId,
      zone: args.zone,
    });

    if (!recipients.length) {
      throw new Error("No hay clientes válidos en este segmento con WhatsApp y zona asignada.");
    }

    const previewText = renderCampaignPreview({
      clientName: recipients[0]?.clientName ?? "cliente",
      zone: args.zone,
      message: messageBody,
    });

    const metaTemplateName = getMetaTemplateName(args.zone);
    if (!metaTemplateName) {
      throw new Error(`Falta configurar la plantilla de WhatsApp para ${CAMPAIGN_SEGMENT_LABELS[args.zone]}.`);
    }

    const campaignId = await ctx.runMutation("whatsappCampaigns:createCampaignRun" as any, {
      adminId: args.adminId,
      zone: args.zone,
      templateKey: args.templateKey,
      messageBody,
      previewText,
      metaTemplateName,
      recipients,
    });

    const savedRecipients = await ctx.runQuery("whatsappCampaigns:getCampaignRecipientsForSend" as any, {
      campaignId,
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of savedRecipients) {
      try {
        const result = await sendTemplateMessage({
          phone: recipient.phone,
          clientName: recipient.clientName,
          messageBody,
          zone: args.zone,
        });
        await ctx.runMutation("whatsappCampaigns:markRecipientStatus" as any, {
          recipientId: recipient._id,
          status: "sent",
          providerMessageId: result.messageId,
        });
        sentCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error enviando mensaje.";
        await ctx.runMutation("whatsappCampaigns:markRecipientStatus" as any, {
          recipientId: recipient._id,
          status: "failed",
          error: message,
        });
        failedCount += 1;
      }
    }

    const finalStatus =
      sentCount === 0
        ? "failed"
        : failedCount > 0
          ? "completed_with_errors"
          : "completed";

    await ctx.runMutation("whatsappCampaigns:finalizeCampaignRun" as any, {
      campaignId,
      status: finalStatus,
      sentCount,
      failedCount,
    });

    return {
      campaignId,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      status: finalStatus,
    };
  },
});
