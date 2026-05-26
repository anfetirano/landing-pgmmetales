"use client";

import { useAction, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CAMPAIGN_SEGMENTS,
  CAMPAIGN_SEGMENT_LABELS,
  CAMPAIGN_TEMPLATE_KEYS,
  CAMPAIGN_TEMPLATE_LABELS,
  CLIENT_ZONE_LABELS,
  getDefaultCampaignMessage,
  renderCampaignPreview,
  type CampaignTemplateKey,
  type CampaignSegment,
  type ClientZone,
} from "../../../../../shared_client_campaigns";

export default function AdminCampanasPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const [zone, setZone] = useState<CampaignSegment>("panama");
  const [templateKey, setTemplateKey] = useState<CampaignTemplateKey>("morning_route");
  const [messageBody, setMessageBody] = useState(getDefaultCampaignMessage("morning_route", "panama"));
  const [selectedCampaignId, setSelectedCampaignId] = useState<Id<"whatsappCampaigns"> | null>(null);
  const [sending, setSending] = useState(false);

  const campaigns =
    useQuery(api.whatsappCampaigns.listByAdmin, dbUser?._id ? { adminId: dbUser._id } : "skip") ?? [];
  const audiencePreview =
    useQuery(
      api.whatsappCampaigns.getAudiencePreview,
      dbUser?._id ? { adminId: dbUser._id, zone } : "skip"
    ) ?? null;
  const recipients = useQuery(
    api.whatsappCampaigns.getCampaignRecipients,
    dbUser?._id && selectedCampaignId
      ? { adminId: dbUser._id, campaignId: selectedCampaignId }
      : "skip"
  ) ?? [];

  const sendCampaign = useAction(api.whatsappCampaignActions.sendWhatsAppCampaign);

  useEffect(() => {
    setMessageBody(getDefaultCampaignMessage(templateKey, zone));
  }, [templateKey, zone]);

  useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId(null);
      return;
    }
    setSelectedCampaignId((current) => current ?? campaigns[0]._id);
  }, [campaigns]);

  const previewText = useMemo(
    () =>
      renderCampaignPreview({
        clientName: audiencePreview?.clients[0]?.clientName ?? "Cliente",
        zone,
        message: messageBody,
      }),
    [audiencePreview?.clients, messageBody, zone]
  );

  const handleSend = async () => {
    if (!dbUser?._id) return;
    setSending(true);
    try {
      const result = await sendCampaign({
        adminId: dbUser._id,
        zone,
        templateKey,
        messageBody,
      });
      alert(`Campaña enviada. Enviados: ${result.sentCount}. Fallidos: ${result.failedCount}.`);
      setSelectedCampaignId(result.campaignId as Id<"whatsappCampaigns">);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Error enviando campaña.";
      alert(message);
    } finally {
      setSending(false);
    }
  };

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (dbUser.role !== "admin" || dbUser.tenantKey !== "pa") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Campañas</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Campañas WhatsApp</h1>
      <p className="mt-2 text-foreground-accent">
        Envía campañas manuales de WhatsApp a clientes de Panamá con zona asignada.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva campaña</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Segmento
                <select
                  className="h-10 rounded-md border px-3 text-sm"
                  value={zone}
                  onChange={(e) => setZone(e.target.value as CampaignSegment)}
                >
                  {CAMPAIGN_SEGMENTS.map((zoneValue) => (
                    <option key={zoneValue} value={zoneValue}>
                      {CAMPAIGN_SEGMENT_LABELS[zoneValue]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Plantilla base
                <select
                  className="h-10 rounded-md border px-3 text-sm"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value as CampaignTemplateKey)}
                >
                  {CAMPAIGN_TEMPLATE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {CAMPAIGN_TEMPLATE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-2 rounded-xl border bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">Audience preview</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#234c4b]">
                  {audiencePreview?.count ?? 0} clientes válidos
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {(audiencePreview?.clients ?? []).map((client: any) => (
                  <span key={String(client.clientId)} className="rounded-full border bg-white px-2 py-1">
                    {client.clientName}
                  </span>
                ))}
                {(audiencePreview?.clients ?? []).length === 0 ? (
                  <span>No hay clientes con WhatsApp y zona asignada en este segmento.</span>
                ) : null}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Mensaje base
              <Textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="min-h-[120px]"
              />
            </label>

            <div className="grid gap-2 rounded-xl border bg-[#f7fbfa] p-4">
              <span className="text-sm font-medium text-[#234c4b]">Previsualización</span>
              <p className="text-sm text-slate-700">{previewText}</p>
              <p className="text-xs text-muted-foreground">
                WhatsApp Cloud API enviará una plantilla aprobada por segmento usando el nombre del cliente y este mensaje como variables.
              </p>
            </div>

            <Button
              className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
              onClick={handleSend}
              disabled={sending || !audiencePreview?.count || !messageBody.trim()}
            >
              {sending ? "Enviando campaña..." : "Enviar campaña"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campañas recientes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay campañas registradas.</p>
            ) : (
              campaigns.map((campaign: any) => (
                <button
                  key={String(campaign._id)}
                  type="button"
                  onClick={() => setSelectedCampaignId(campaign._id)}
                  className={`grid gap-2 rounded-xl border p-3 text-left ${
                    selectedCampaignId === campaign._id ? "border-[#234c4b] bg-[#234c4b]/5" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{campaign.templateLabel}</p>
                      <p className="text-xs text-muted-foreground">{campaign.zoneLabel}</p>
                    </div>
                    <span className="text-xs font-medium text-[#234c4b]">{campaign.totalRecipients} envíos</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{campaign.messageBody}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{new Date(campaign.createdAt).toLocaleString("es-PA")}</span>
                    <span>Enviados: {campaign.sentCount}</span>
                    <span>Fallidos: {campaign.failedCount}</span>
                    <span>Estado: {campaign.status}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Destinatarios de la campaña</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCampaignId && recipients.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-left">Zona</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient: any) => (
                    <tr key={String(recipient._id)} className="border-t">
                      <td className="px-4 py-3 font-medium">{recipient.clientName}</td>
                      <td className="px-4 py-3">{recipient.phone}</td>
                      <td className="px-4 py-3">{CLIENT_ZONE_LABELS[recipient.zone as ClientZone]}</td>
                      <td className="px-4 py-3">{recipient.status}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{recipient.error ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona una campaña para revisar a qué clientes se les envió y qué resultado tuvo cada intento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
