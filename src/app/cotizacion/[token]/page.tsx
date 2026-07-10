"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SharedPriceDraft = {
  clientPrice: string;
};

export default function SharedQuotationPage() {
  const params = useParams<{ token: string }>();
  const shareToken = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const quotationData = useQuery(
    api.quotations.getSharedQuotation,
    shareToken ? { shareToken } : "skip"
  );
  const updateSharedPrice = useMutation(api.quotations.updateSharedQuotationItemPrice);

  const [priceDrafts, setPriceDrafts] = useState<Record<string, SharedPriceDraft>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  const items = quotationData?.items ?? [];

  const mergedDrafts = useMemo(() => {
    const next: Record<string, SharedPriceDraft> = { ...priceDrafts };
    for (const item of items) {
      if (!next[String(item._id)]) {
        next[String(item._id)] = {
          clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
        };
      }
    }
    return next;
  }, [items, priceDrafts]);

  const handleDraftChange = (itemId: Id<"quotationItems">, value: string) => {
    setPriceDrafts((current) => ({
      ...current,
      [String(itemId)]: {
        clientPrice: value,
      },
    }));
  };

  const handleSavePrice = async (item: (typeof items)[number]) => {
    if (!shareToken) return;

    const draft = mergedDrafts[String(item._id)] ?? { clientPrice: "" };
    const parsedPrice = draft.clientPrice.trim() ? Number(draft.clientPrice) : undefined;

    if (typeof parsedPrice === "number" && Number.isNaN(parsedPrice)) {
      alert("Precio inválido.");
      return;
    }

    setSavingItemId(String(item._id));
    try {
      await updateSharedPrice({
        shareToken,
        itemId: item._id,
        clientPrice: parsedPrice,
      });
      alert("Precio guardado.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el precio.");
    } finally {
      setSavingItemId(null);
    }
  };

  if (!shareToken) {
    return <div className="mx-auto max-w-4xl px-5 py-8">Link inválido.</div>;
  }

  if (!quotationData) {
    return <div className="mx-auto max-w-4xl px-5 py-8">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <div key={item._id} className="flex h-full flex-col rounded-lg border bg-white p-4">
                <button
                  type="button"
                  className="group relative aspect-square w-full overflow-hidden rounded-md border bg-muted"
                  onClick={() => item.photoUrl ? setExpandedPhotoUrl(item.photoUrl) : null}
                  disabled={!item.photoUrl}
                >
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
                  <div className="min-h-[72px]">
                    <div className="font-semibold text-[#234c4b]">
                      {[item.brand, item.model].filter(Boolean).join(" ") || "Pieza sin marca/modelo"}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Referencia: {item.reference ?? "-"}
                    </div>
                    {item.notes ? (
                      <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.notes}</div>
                    ) : null}
                  </div>

                  <div className="mt-auto grid gap-3 border-t pt-3">
                    <label className="grid gap-2 text-sm">
                      Precio aproximado
                      <Input
                        value={mergedDrafts[String(item._id)]?.clientPrice ?? ""}
                        onChange={(e) => handleDraftChange(item._id, e.target.value)}
                        type="number"
                        placeholder="USD"
                      />
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSavePrice(item)}
                      disabled={savingItemId === String(item._id)}
                      className="w-full"
                    >
                      {savingItemId === String(item._id) ? "Guardando..." : "Guardar precio"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={expandedPhotoUrl !== null} onOpenChange={(open) => !open ? setExpandedPhotoUrl(null) : null}>
        <DialogContent className="max-w-5xl border bg-white p-4">
          <DialogHeader>
            <DialogTitle>Foto de la pieza</DialogTitle>
          </DialogHeader>
          {expandedPhotoUrl ? (
            <img
              src={expandedPhotoUrl}
              alt="Foto ampliada de la pieza"
              className="max-h-[82vh] w-full rounded-md object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
