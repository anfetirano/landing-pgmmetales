"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SharedItemDraft = {
  brand: string;
  model: string;
  reference: string;
  notes: string;
  clientPrice: string;
};

export default function SharedQuotationPage() {
  const params = useParams<{ token: string }>();
  const shareToken = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const quotationData = useQuery(
    api.quotations.getSharedQuotation,
    shareToken ? { shareToken } : "skip"
  );
  const updateSharedItem = useMutation(api.quotations.updateSharedQuotationItem);

  const [itemDrafts, setItemDrafts] = useState<Record<string, SharedItemDraft>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);

  const items = quotationData?.items ?? [];

  const mergedDrafts = useMemo(() => {
    const next: Record<string, SharedItemDraft> = { ...itemDrafts };
    for (const item of items) {
      if (!next[String(item._id)]) {
        next[String(item._id)] = {
          brand: item.brand ?? "",
          model: item.model ?? "",
          reference: item.reference ?? "",
          notes: item.notes ?? "",
          clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
        };
      }
    }
    return next;
  }, [items, itemDrafts]);

  const totalDraftPrice = useMemo(
    () =>
      items.reduce((sum, item) => {
        const rawValue = mergedDrafts[String(item._id)]?.clientPrice ?? "";
        const parsedValue = rawValue.trim() ? Number(rawValue) : 0;
        return sum + (Number.isFinite(parsedValue) ? parsedValue : 0);
      }, 0),
    [items, mergedDrafts]
  );

  const handleDraftChange = (
    itemId: Id<"quotationItems">,
    field: keyof SharedItemDraft,
    value: string
  ) => {
    setItemDrafts((current) => ({
      ...current,
      [String(itemId)]: {
        ...(current[String(itemId)] ?? {
          brand: "",
          model: "",
          reference: "",
          notes: "",
          clientPrice: "",
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveItem = async (item: (typeof items)[number]) => {
    if (!shareToken) return;

    const draft = mergedDrafts[String(item._id)] ?? {
      brand: item.brand ?? "",
      model: item.model ?? "",
      reference: item.reference ?? "",
      notes: item.notes ?? "",
      clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
    };
    const parsedPrice = draft.clientPrice.trim() ? Number(draft.clientPrice) : undefined;

    if (typeof parsedPrice === "number" && Number.isNaN(parsedPrice)) {
      alert("Precio inválido.");
      return;
    }

    setSavingItemId(String(item._id));
    try {
      await updateSharedItem({
        shareToken,
        itemId: item._id,
        brand: draft.brand,
        model: draft.model,
        reference: draft.reference,
        notes: draft.notes,
        clientPrice: parsedPrice,
      });
      setEditingItemId(null);
      alert("Cambios guardados.");
    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar los cambios.");
    } finally {
      setSavingItemId(null);
    }
  };

  const handleOpenPhoto = (photoUrl: string | null) => {
    if (!photoUrl) return;
    setPhotoZoom(1);
    setExpandedPhotoUrl(photoUrl);
  };

  const handleZoomIn = () => {
    setPhotoZoom((current) => Math.min(current + 0.25, 4));
  };

  const handleZoomOut = () => {
    setPhotoZoom((current) => Math.max(current - 0.25, 1));
  };

  const handleResetZoom = () => {
    setPhotoZoom(1);
  };

  const handleStartEdit = (item: (typeof items)[number]) => {
    setItemDrafts((current) => ({
      ...current,
      [String(item._id)]: {
        brand: item.brand ?? "",
        model: item.model ?? "",
        reference: item.reference ?? "",
        notes: item.notes ?? "",
        clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
      },
    }));
    setEditingItemId(String(item._id));
  };

  const handleCancelEdit = (item: (typeof items)[number]) => {
    setItemDrafts((current) => ({
      ...current,
      [String(item._id)]: {
        brand: item.brand ?? "",
        model: item.model ?? "",
        reference: item.reference ?? "",
        notes: item.notes ?? "",
        clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
      },
    }));
    setEditingItemId(null);
  };

  if (!shareToken) {
    return <div className="mx-auto max-w-4xl px-5 py-8">Link inválido.</div>;
  }

  if (!quotationData) {
    return <div className="mx-auto max-w-4xl px-5 py-8">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-[1800px] px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#234c4b]">
          Cotización compartida
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {quotationData.quotation.clientName} · {quotationData.summary.itemCount} piezas
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí puedes revisar cada pieza y colocar un precio aproximado.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Cantidad de piezas</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              {quotationData.summary.itemCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Suma de precios</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              ${totalDraftPrice.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Piezas de la cotización</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Todavía no hay piezas registradas en esta cotización.
            </div>
          ) : null}

          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            {items.map((item) => {
              const itemId = String(item._id);
              const isEditing = editingItemId === itemId;

              return (
                <div
                  key={item._id}
                  className="flex h-full flex-col overflow-hidden rounded-lg border bg-white p-4"
                >
                  <button
                    type="button"
                    className="group relative aspect-square w-full overflow-hidden rounded-md border bg-muted"
                    onClick={() => handleOpenPhoto(item.photoUrl)}
                    disabled={!item.photoUrl}
                  >
                    <div className="absolute left-3 top-3 z-10 rounded-md bg-[#234c4b] px-2 py-1 text-xs font-semibold text-white">
                      {item.pmgCode ?? "Sin código PMG"}
                    </div>
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt="Pieza"
                        className="h-full w-full object-cover transition-opacity group-hover:opacity-95"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                  </button>

                  <div className="mt-4 flex flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-h-[72px]">
                        <div className="font-semibold text-[#234c4b]">
                          {[item.brand, item.model].filter(Boolean).join(" ") || "Pieza sin marca/modelo"}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          Referencia: {item.reference ?? "-"}
                        </div>
                        {item.notes ? (
                          <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                            {item.notes}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleStartEdit(item)}
                        className="shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="grid gap-3 border-t pt-3">
                        <label className="grid gap-2 text-sm">
                          Marca
                          <Input
                            value={mergedDrafts[itemId]?.brand ?? ""}
                            onChange={(e) => handleDraftChange(item._id, "brand", e.target.value)}
                            placeholder="Marca"
                          />
                        </label>

                        <label className="grid gap-2 text-sm">
                          Modelo
                          <Input
                            value={mergedDrafts[itemId]?.model ?? ""}
                            onChange={(e) => handleDraftChange(item._id, "model", e.target.value)}
                            placeholder="Modelo"
                          />
                        </label>

                        <label className="grid gap-2 text-sm">
                          Referencia
                          <Input
                            value={mergedDrafts[itemId]?.reference ?? ""}
                            onChange={(e) => handleDraftChange(item._id, "reference", e.target.value)}
                            placeholder="Referencia"
                          />
                        </label>

                        <label className="grid gap-2 text-sm">
                          Notas
                          <Textarea
                            value={mergedDrafts[itemId]?.notes ?? ""}
                            onChange={(e) => handleDraftChange(item._id, "notes", e.target.value)}
                            placeholder="Notas de la pieza"
                            rows={3}
                          />
                        </label>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleCancelEdit(item)}
                            disabled={savingItemId === itemId}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-auto grid gap-3 border-t pt-3">
                      <label className="grid gap-2 text-sm">
                        Precio aproximado
                        <Input
                          value={mergedDrafts[itemId]?.clientPrice ?? ""}
                          onChange={(e) => handleDraftChange(item._id, "clientPrice", e.target.value)}
                          type="number"
                          placeholder="USD"
                        />
                      </label>
                      <Button
                        type="button"
                        onClick={() => handleSaveItem(item)}
                        disabled={savingItemId === itemId}
                        className="w-full bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                      >
                        {savingItemId === itemId
                          ? "Guardando..."
                          : isEditing
                            ? "Guardar cambios"
                            : "Guardar precio"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={expandedPhotoUrl !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExpandedPhotoUrl(null);
            setPhotoZoom(1);
          }
        }}
      >
        <DialogContent className="max-w-5xl border bg-white p-4">
          <DialogHeader>
            <DialogTitle>Foto de la pieza</DialogTitle>
          </DialogHeader>
          {expandedPhotoUrl ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  Zoom: {Math.round(photoZoom * 100)}%
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleZoomOut}>
                    -
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetZoom}>
                    100%
                  </Button>
                  <Button type="button" variant="outline" onClick={handleZoomIn}>
                    +
                  </Button>
                </div>
              </div>

              <div className="max-h-[82vh] overflow-auto rounded-md border bg-[#f7f7f7] p-3">
                <img
                  src={expandedPhotoUrl}
                  alt="Foto ampliada de la pieza"
                  className="mx-auto origin-top rounded-md object-contain transition-transform"
                  style={{
                    maxHeight: photoZoom === 1 ? "78vh" : "none",
                    maxWidth: photoZoom === 1 ? "100%" : "none",
                    transform: `scale(${photoZoom})`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
