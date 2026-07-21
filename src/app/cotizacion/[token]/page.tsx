"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Pencil, Search } from "lucide-react";

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

type SharedDraftDirtyState = Partial<Record<keyof SharedItemDraft, boolean>>;

type SharedViewMode = "pmg" | "brandReference" | "brand" | "unpriced";

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
  { value: "unpriced", label: "Piezas sin precio" },
];

const normalizeGroupValue = (value?: string | null) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const formatGroupValue = (value: string | null | undefined, fallback: string) => {
  const safeValue = (value ?? "").trim().replace(/\s+/g, " ");
  return safeValue || fallback;
};

const normalizeSearchValue = (value: string | null | undefined) =>
  (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const PRICE_INPUT_HELP =
  "Usa el valor en dolares sin separadores de miles. Ej: 157 o 157.5";

const formatPriceDraft = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const parsePriceInput = (
  value: string
): { value?: number; error?: string } => {
  const normalized = value.trim().replace(/\s+/g, "");

  if (!normalized) {
    return { value: undefined };
  }

  if (!/^[\d.,]+$/.test(normalized)) {
    return { error: PRICE_INPUT_HELP };
  }

  const separators = normalized.match(/[.,]/g) ?? [];
  if (separators.length > 1) {
    return { error: PRICE_INPUT_HELP };
  }

  const usesComma = normalized.includes(",");
  const usesDot = normalized.includes(".");
  const decimalSeparator = usesComma ? "," : usesDot ? "." : null;

  if (decimalSeparator) {
    const [, decimals = ""] = normalized.split(decimalSeparator);
    if (decimals.length === 3 || decimals.length > 2) {
      return { error: PRICE_INPUT_HELP };
    }
  }

  const numericValue = Number(usesComma ? normalized.replace(",", ".") : normalized);

  if (!Number.isFinite(numericValue) || Number.isNaN(numericValue)) {
    return { error: "Precio invalido." };
  }

  if (numericValue < 0) {
    return { error: "El precio no puede ser negativo." };
  }

  if (numericValue > 100000) {
    return { error: "El valor parece estar en pesos. Revisa que este en dolares." };
  }

  return { value: numericValue };
};

const buildSharedItemGroups = <TItem extends GroupableSharedItem>(
  items: TItem[],
  viewMode: SharedViewMode
): SharedItemGroup<TItem>[] => {
  if (viewMode === "pmg" || viewMode === "unpriced") {
    return [
      {
        key: viewMode === "pmg" ? "pmg-order" : "unpriced-items",
        title:
          viewMode === "pmg"
            ? "Todas las piezas en orden PMG"
            : "Todas las piezas sin precio",
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

export default function SharedQuotationPage() {
  const params = useParams<{ token: string }>();
  const shareToken = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const quotationData = useQuery(
    api.quotations.getSharedQuotation,
    shareToken ? { shareToken } : "skip"
  );
  const updateSharedItem = useMutation(api.quotations.updateSharedQuotationItem);

  const [itemDrafts, setItemDrafts] = useState<Record<string, SharedItemDraft>>({});
  const [itemDirtyFields, setItemDirtyFields] = useState<Record<string, SharedDraftDirtyState>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [viewMode, setViewMode] = useState<SharedViewMode>("pmg");
  const [searchTerm, setSearchTerm] = useState("");

  const items = quotationData?.items ?? [];
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  const mergedDrafts = useMemo(() => {
    const next: Record<string, SharedItemDraft> = {};
    for (const item of items) {
      const itemId = String(item._id);
      const currentDraft = itemDrafts[itemId];
      const dirtyFields = itemDirtyFields[itemId] ?? {};

      next[itemId] = {
        brand: dirtyFields.brand ? currentDraft?.brand ?? "" : item.brand ?? "",
        model: dirtyFields.model ? currentDraft?.model ?? "" : item.model ?? "",
        reference: dirtyFields.reference ? currentDraft?.reference ?? "" : item.reference ?? "",
        notes: dirtyFields.notes ? currentDraft?.notes ?? "" : item.notes ?? "",
        clientPrice: dirtyFields.clientPrice
          ? currentDraft?.clientPrice ?? ""
          : formatPriceDraft(item.clientPrice),
      };
    }
    return next;
  }, [items, itemDirtyFields, itemDrafts]);

  const totalDraftPrice = useMemo(
    () =>
      items.reduce((sum, item) => {
        const rawValue = mergedDrafts[String(item._id)]?.clientPrice ?? "";
        const parsedValue = parsePriceInput(rawValue).value ?? 0;
        return sum + parsedValue;
      }, 0),
    [items, mergedDrafts]
  );

  const pricedBuyerItemsCount = useMemo(
    () =>
      items.reduce((count, item) => {
        const rawValue = mergedDrafts[String(item._id)]?.clientPrice ?? "";
        return typeof parsePriceInput(rawValue).value === "number" ? count + 1 : count;
      }, 0),
    [items, mergedDrafts]
  );

  const averageBuyerPrice = useMemo(
    () =>
      pricedBuyerItemsCount > 0
        ? totalDraftPrice / pricedBuyerItemsCount
        : 0,
    [pricedBuyerItemsCount, totalDraftPrice]
  );

  const filteredItems = useMemo(() => {
    const baseItems =
      viewMode === "unpriced"
        ? items.filter((item) => typeof item.clientPrice !== "number")
        : items;

    if (!normalizedSearchTerm) {
      return baseItems;
    }

    return baseItems.filter((item) => {
      const searchBase = [
        item.pmgCode,
        item.brand,
        item.model,
        item.reference,
        item.notes,
      ]
        .map((value) => normalizeSearchValue(value))
        .filter(Boolean)
        .join(" ");

      return searchBase.includes(normalizedSearchTerm);
    });
  }, [items, normalizedSearchTerm, viewMode]);

  const groupedItems = useMemo(
    () => buildSharedItemGroups(filteredItems, viewMode),
    [filteredItems, viewMode]
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
    setItemDirtyFields((current) => ({
      ...current,
      [String(itemId)]: {
        ...(current[String(itemId)] ?? {}),
        [field]: true,
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
    const parsedPriceResult = parsePriceInput(draft.clientPrice);
    if (parsedPriceResult.error) {
      alert(parsedPriceResult.error);
      return;
    }
    const parsedPrice = parsedPriceResult.value;

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
      setItemDirtyFields((current) => ({
        ...current,
        [String(item._id)]: {},
      }));
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
        clientPrice: formatPriceDraft(item.clientPrice),
      },
    }));
    setItemDirtyFields((current) => ({
      ...current,
      [String(item._id)]: {},
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
        clientPrice: formatPriceDraft(item.clientPrice),
      },
    }));
    setItemDirtyFields((current) => ({
      ...current,
      [String(item._id)]: {},
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

      <div className="mb-6 grid gap-4 md:grid-cols-3">
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
            <div className="mt-2 text-xs text-muted-foreground">
              {pricedBuyerItemsCount} piezas con precio
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Promedio por pieza</div>
            <div className="mt-2 text-3xl font-semibold text-[#234c4b]">
              ${averageBuyerPrice.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Promedio de piezas ya cotizadas
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Piezas de la cotización</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Cambia la vista para encontrar piezas repetidas sin alterar el orden real guardado en la base de datos.
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[#234c4b]">
              Buscar pieza
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por PMG, marca, modelo, referencia o nota"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {normalizedSearchTerm
                ? `${filteredItems.length} resultados encontrados`
                : viewMode === "unpriced"
                  ? `${filteredItems.length} piezas sin precio`
                  : `${items.length} piezas disponibles`}
            </p>
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

          {items.length > 0 && filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-[#f7fbfa] px-4 py-5 text-sm text-muted-foreground">
              {viewMode === "unpriced"
                ? "No hay piezas sin precio con ese criterio. Prueba con otra marca, referencia o código PMG."
                : "No encontré piezas con ese criterio. Prueba con otra marca, referencia o código PMG."}
            </div>
          ) : null}

          {groupedItems.map((group) => (
            <section
              key={group.key}
              className="grid gap-4 rounded-xl border border-[#dbe6e3] bg-[#f8fbfa] p-4"
            >
              {viewMode !== "pmg" && viewMode !== "unpriced" ? (
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
                    viewMode === "pmg" || viewMode === "unpriced"
                      ? "repeat(auto-fit, minmax(320px, 1fr))"
                      : "repeat(auto-fill, minmax(320px, 360px))",
                }}
              >
                {group.items.map((item) => {
                  const itemId = String(item._id);
                  const isEditing = editingItemId === itemId;
                  const hasSavedPrice = typeof item.clientPrice === "number";

                  return (
                    <div
                      key={item._id}
                      className={`flex h-full flex-col overflow-hidden rounded-lg border p-4 transition-colors ${
                        hasSavedPrice
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
                            loading="lazy"
                            decoding="async"
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
                              type="text"
                              inputMode="decimal"
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
