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

type InternalPriceDraft = {
  quotedPrice: string;
};

type SharedViewMode = "pmg" | "brandReference" | "brand";

type GroupableSharedItem = {
  _id: Id<"quotationItems">;
  brand?: string | null;
  reference?: string | null;
};

type SharedItemGroup<TItem extends GroupableSharedItem> = {
  key: string;
  title: string;
  items: TItem[];
};

const VIEW_MODE_OPTIONS: Array<{ value: SharedViewMode; label: string }> = [
  { value: "pmg", label: "Orden PMG" },
  { value: "brandReference", label: "Marca + referencia" },
  { value: "brand", label: "Marca" },
];

const normalizeGroupValue = (value?: string | null) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const formatGroupValue = (value: string | null | undefined, fallback: string) => {
  const safeValue = (value ?? "").trim().replace(/\s+/g, " ");
  return safeValue || fallback;
};

const buildSharedItemGroups = <TItem extends GroupableSharedItem>(
  items: TItem[],
  viewMode: SharedViewMode
): SharedItemGroup<TItem>[] => {
  if (viewMode === "pmg") {
    return [
      {
        key: "pmg-order",
        title: "Todas las piezas en orden PMG",
        items,
      },
    ];
  }

  const groups = new Map<string, SharedItemGroup<TItem>>();

  for (const item of items) {
    const brandLabel = formatGroupValue(item.brand, "Sin marca");
    const referenceLabel = formatGroupValue(item.reference, "Sin referencia");
    const normalizedBrand = normalizeGroupValue(item.brand) || "__sin_marca__";
    const normalizedReference = normalizeGroupValue(item.reference) || "__sin_referencia__";

    const groupKey =
      viewMode === "brandReference"
        ? `${normalizedBrand}::${normalizedReference}`
        : normalizedBrand;
    const groupTitle =
      viewMode === "brandReference" ? `${brandLabel} · ${referenceLabel}` : brandLabel;

    const currentGroup = groups.get(groupKey);
    if (currentGroup) {
      currentGroup.items.push(item);
      continue;
    }

    groups.set(groupKey, {
      key: groupKey,
      title: groupTitle,
      items: [item],
    });
  }

  return Array.from(groups.values());
};

const formatUsd = (value: number) =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export default function InternalSharedQuotationPage() {
  const params = useParams<{ token: string }>();
  const shareToken = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const [viewMode, setViewMode] = useState<SharedViewMode>("pmg");
  const [showComparison, setShowComparison] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<Record<string, InternalPriceDraft>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);

  const quotationData = useQuery(
    api.quotations.getInternalSharedQuotation,
    shareToken ? { shareToken, includeComparison: showComparison } : "skip"
  );
  const updateInternalPrice = useMutation(api.quotations.updateInternalSharedQuotationItemPrice);

  const items = quotationData?.items ?? [];

  const mergedDrafts = useMemo(() => {
    const next: Record<string, InternalPriceDraft> = { ...itemDrafts };
    for (const item of items) {
      if (!next[String(item._id)]) {
        next[String(item._id)] = {
          quotedPrice: typeof item.quotedPrice === "number" ? String(item.quotedPrice) : "",
        };
      }
    }
    return next;
  }, [items, itemDrafts]);

  const totalInternalDraft = useMemo(
    () =>
      items.reduce((sum, item) => {
        const rawValue = mergedDrafts[String(item._id)]?.quotedPrice ?? "";
        const parsedValue = rawValue.trim() ? Number(rawValue) : 0;
        return sum + (Number.isFinite(parsedValue) ? parsedValue : 0);
      }, 0),
    [items, mergedDrafts]
  );

  const groupedItems = useMemo(
    () => buildSharedItemGroups(items, viewMode),
    [items, viewMode]
  );

  const handleDraftChange = (itemId: Id<"quotationItems">, value: string) => {
    setItemDrafts((current) => ({
      ...current,
      [String(itemId)]: {
        quotedPrice: value,
      },
    }));
  };

  const handleSavePrice = async (item: (typeof items)[number]) => {
    if (!shareToken) return;

    const draft = mergedDrafts[String(item._id)] ?? {
      quotedPrice: typeof item.quotedPrice === "number" ? String(item.quotedPrice) : "",
    };
    const parsedPrice = draft.quotedPrice.trim() ? Number(draft.quotedPrice) : undefined;

    if (typeof parsedPrice === "number" && Number.isNaN(parsedPrice)) {
      alert("Precio interno inválido.");
      return;
    }

    setSavingItemId(String(item._id));
    try {
      await updateInternalPrice({
        shareToken,
        itemId: item._id,
        quotedPrice: parsedPrice,
      });
      alert("Precio interno guardado.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el precio interno.");
    } finally {
      setSavingItemId(null);
    }
  };

  const handleOpenPhoto = (photoUrl: string | null) => {
    if (!photoUrl) return;
    setPhotoZoom(1);
    setExpandedPhotoUrl(photoUrl);
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
          Cotización interna
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {quotationData.quotation.clientName} · {quotationData.summary.itemCount} piezas
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí ustedes colocan su precio interno. La comparación con el comprador permanece oculta hasta que ustedes la revelen.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-4">
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
            <div className="text-sm text-muted-foreground">Total interno</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              {formatUsd(totalInternalDraft)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Total comprador</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              {showComparison && typeof quotationData.summary.totalBuyerPrice === "number"
                ? formatUsd(quotationData.summary.totalBuyerPrice)
                : "Oculto"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Diferencia</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              {showComparison && typeof quotationData.summary.totalDifference === "number"
                ? formatUsd(quotationData.summary.totalDifference)
                : "Oculta"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Piezas de la cotización</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Agrupa piezas repetidas para cotizar más rápido y revela la comparación solo cuando quieras revisar diferencias.
              </p>
            </div>
            <Button
              type="button"
              variant={showComparison ? "outline" : "default"}
              onClick={() => setShowComparison((current) => !current)}
              className={
                showComparison
                  ? "border-[#234c4b] text-[#234c4b] hover:bg-[#eef5f3]"
                  : "bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
              }
            >
              {showComparison ? "Ocultar comparativa" : "Revelar comparativa"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {VIEW_MODE_OPTIONS.map((option) => {
              const isActive = viewMode === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setViewMode(option.value)}
                  className={
                    isActive
                      ? "bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                      : "border-[#c9d8d4] text-[#234c4b] hover:bg-[#eef5f3]"
                  }
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Todavía no hay piezas registradas en esta cotización.
            </div>
          ) : null}

          {groupedItems.map((group) => (
            <section
              key={group.key}
              className="grid gap-4 rounded-xl border border-[#dbe6e3] bg-[#f8fbfa] p-4"
            >
              {viewMode !== "pmg" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dbe6e3] pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#234c4b]">
                      {group.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {viewMode === "brandReference"
                        ? "Misma marca y misma referencia"
                        : "Misma marca"}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#234c4b] px-3 py-1 text-sm font-semibold text-white">
                    {group.items.length} piezas
                  </div>
                </div>
              ) : null}

              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns:
                    viewMode === "pmg"
                      ? "repeat(auto-fit, minmax(320px, 1fr))"
                      : "repeat(auto-fill, minmax(320px, 360px))",
                }}
              >
                {group.items.map((item) => {
                  const itemId = String(item._id);
                  const internalPrice = mergedDrafts[itemId]?.quotedPrice ?? "";
                  const buyerPriceVisible =
                    showComparison && typeof item.clientPrice === "number";
                  const buyerPrice = buyerPriceVisible ? item.clientPrice : undefined;
                  const hasSavedInternalPrice = typeof item.quotedPrice === "number";
                  const parsedInternalPrice = internalPrice.trim()
                    ? Number(internalPrice)
                    : undefined;
                  const difference =
                    typeof buyerPrice === "number" &&
                    typeof parsedInternalPrice === "number" &&
                    Number.isFinite(parsedInternalPrice)
                      ? parsedInternalPrice - buyerPrice
                      : undefined;

                  return (
                    <div
                      key={item._id}
                      className={`flex h-full flex-col overflow-hidden rounded-lg border p-4 transition-colors ${
                        hasSavedInternalPrice
                          ? "border-[#b9d8cb] bg-[#f3fbf6]"
                          : "bg-white"
                      }`}
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

                        <div className="mt-auto grid gap-3 border-t pt-3">
                          <label className="grid gap-2 text-sm">
                            Precio interno
                            <Input
                              value={internalPrice}
                              onChange={(e) => handleDraftChange(item._id, e.target.value)}
                              type="number"
                              placeholder="USD"
                            />
                          </label>

                          {showComparison ? (
                            <div className="grid gap-1 rounded-lg bg-[#f7fbfa] p-3 text-sm">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Precio comprador</span>
                                <span className="font-medium text-[#234c4b]">
                                  {typeof buyerPrice === "number"
                                    ? formatUsd(buyerPrice)
                                    : "Sin precio"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Tu diferencia</span>
                                <span className="font-medium text-[#234c4b]">
                                  {typeof difference === "number" && Number.isFinite(difference)
                                    ? formatUsd(difference)
                                    : "Pendiente"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg bg-[#f7fbfa] p-3 text-sm text-muted-foreground">
                              Comparación ciega activa. El precio del comprador sigue oculto.
                            </div>
                          )}

                          <Button
                            type="button"
                            onClick={() => handleSavePrice(item)}
                            disabled={savingItemId === itemId}
                            className="w-full bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                          >
                            {savingItemId === itemId ? "Guardando..." : "Guardar precio interno"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
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
                  <Button type="button" variant="outline" onClick={() => setPhotoZoom((current) => Math.max(current - 0.25, 1))}>
                    -
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPhotoZoom(1)}>
                    100%
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPhotoZoom((current) => Math.min(current + 0.25, 4))}>
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
