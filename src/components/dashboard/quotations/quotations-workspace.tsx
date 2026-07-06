"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Camera, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoneyByTenant } from "@/lib/currency";

type WorkspaceMode = "admin" | "buyer";
type QuotationStatus = "draft" | "pricing" | "ready";

const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Borrador",
  pricing: "Cotizando",
  ready: "Lista",
};

const hasBuyerQuotationFeature = (features?: string[]) =>
  Array.isArray(features) && features.includes("buyer_quotations");

const ANDRES_COMPRA_EMAIL = "andrescompra@pmgmetales.com";

const isAndresCompraEmail = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === ANDRES_COMPRA_EMAIL;

type PriceDraft = {
  clientPrice: string;
};

export function QuotationsWorkspace({ mode }: { mode: WorkspaceMode }) {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const isAdminMode = mode === "admin";
  const hasBuyerAccess =
    dbUser?.role === "buyer" &&
    dbUser?.tenantKey === "pa" &&
    (
      hasBuyerQuotationFeature(dbUser.features) ||
      isAndresCompraEmail(dbUser.email) ||
      isAndresCompraEmail(user?.primaryEmailAddress?.emailAddress)
    );

  const quotations =
    useQuery(api.quotations.listByAdmin, dbUser?._id ? { adminId: dbUser._id } : "skip") ?? [];
  const adminClients =
    useQuery(api.clients.listAllForAdmin, isAdminMode && dbUser?._id ? { adminId: dbUser._id } : "skip") ?? [];
  const buyerClients =
    useQuery(api.clients.listByBuyer, !isAdminMode && dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];
  const clients = isAdminMode ? adminClients : buyerClients;

  const [selectedQuotationId, setSelectedQuotationId] = useState<Id<"quotations"> | null>(null);
  const quotationDetail = useQuery(
    api.quotations.getQuotationDetail,
    dbUser?._id && selectedQuotationId
      ? { adminId: dbUser._id, quotationId: selectedQuotationId }
      : "skip"
  );

  const createQuotation = useMutation(api.quotations.createQuotation);
  const updateQuotation = useMutation(api.quotations.updateQuotation);
  const deleteQuotation = useMutation(api.quotations.deleteQuotation);
  const addQuotationItem = useMutation(api.quotations.addQuotationItem);
  const updateQuotationItem = useMutation(api.quotations.updateQuotationItem);
  const deleteQuotationItem = useMutation(api.quotations.deleteQuotationItem);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);

  const [newClientName, setNewClientName] = useState("");
  const [newClientId, setNewClientId] = useState<string>("none");
  const [newQuotationNotes, setNewQuotationNotes] = useState("");
  const [creatingQuotation, setCreatingQuotation] = useState(false);

  const [clientName, setClientName] = useState("");
  const [quotationNotes, setQuotationNotes] = useState("");
  const [quotationStatus, setQuotationStatus] = useState<QuotationStatus>("draft");
  const [savingQuotation, setSavingQuotation] = useState(false);

  const [editingItemId, setEditingItemId] = useState<Id<"quotationItems"> | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [reference, setReference] = useState("");
  const [clientPrice, setClientPrice] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, PriceDraft>>({});
  const [savingPriceItemId, setSavingPriceItemId] = useState<string | null>(null);
  const [deletingQuotationId, setDeletingQuotationId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const itemFormRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedQuotationId && quotations[0]?._id) {
      setSelectedQuotationId(quotations[0]._id);
    }
  }, [quotations, selectedQuotationId]);

  useEffect(() => {
    if (!quotationDetail) return;
    setClientName(quotationDetail.clientName ?? "");
    setQuotationNotes(quotationDetail.notes ?? "");
    setQuotationStatus((quotationDetail.status as QuotationStatus) ?? "draft");
  }, [quotationDetail?._id, quotationDetail?.clientName, quotationDetail?.notes, quotationDetail?.status]);

  useEffect(() => {
    if (!quotationDetail?.items) {
      setPriceDrafts({});
      return;
    }

    setPriceDrafts((current) => {
      const next: Record<string, PriceDraft> = {};
      for (const item of quotationDetail.items) {
        const existing = current[String(item._id)];
        next[String(item._id)] = existing ?? {
          clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
        };
      }
      return next;
    });
  }, [quotationDetail?.items]);

  const clientOptions = useMemo(
    () =>
      clients
        .filter((client) => !client.isEmergency)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })),
    [clients]
  );

  const resetItemForm = () => {
    setEditingItemId(null);
    setBrand("");
    setModel("");
    setReference("");
    setClientPrice("");
    setItemNotes("");
    setPhotoPreview(null);
    setPhotoFile(null);
    setShowPhotoOptions(false);
  };

  const handleClientSelection = (value: string) => {
    setNewClientId(value);
    if (value === "none") return;
    const client = clientOptions.find((row) => String(row._id) === value);
    if (client) {
      setNewClientName(client.name ?? "");
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setShowPhotoOptions(false);
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreateQuotation = async () => {
    if (!dbUser?._id) return;
    if (!newClientName.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    setCreatingQuotation(true);
    try {
      const quotationId = await createQuotation({
        adminId: dbUser._id,
        clientName: newClientName.trim(),
        clientId: newClientId !== "none" ? (newClientId as Id<"clients">) : undefined,
        notes: newQuotationNotes.trim() || undefined,
      });
      setSelectedQuotationId(quotationId);
      setNewClientName("");
      setNewClientId("none");
      setNewQuotationNotes("");
      alert("Cotización creada.");
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la cotización.");
    } finally {
      setCreatingQuotation(false);
    }
  };

  const handleSaveQuotation = async () => {
    if (!dbUser?._id || !quotationDetail?._id) return;
    if (!clientName.trim()) {
      alert("El nombre del cliente es obligatorio.");
      return;
    }

    setSavingQuotation(true);
    try {
      await updateQuotation({
        adminId: dbUser._id,
        quotationId: quotationDetail._id,
        clientName: clientName.trim(),
        status: quotationStatus,
        notes: quotationNotes.trim() || undefined,
      });
      alert("Cotización actualizada.");
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar la cotización.");
    } finally {
      setSavingQuotation(false);
    }
  };

  const handleEditItem = (item: NonNullable<typeof quotationDetail>["items"][number]) => {
    setEditingItemId(item._id);
    setBrand(item.brand ?? "");
    setModel(item.model ?? "");
    setReference(item.reference ?? "");
    setClientPrice(typeof item.clientPrice === "number" ? String(item.clientPrice) : "");
    setItemNotes(item.notes ?? "");
    setPhotoPreview(item.photoUrl ?? null);
    setPhotoFile(null);
    setShowPhotoOptions(false);
    requestAnimationFrame(() => {
      itemFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSaveItem = async () => {
    if (!dbUser?._id || !quotationDetail?._id) return;

    const parsedClientPrice =
      editingItemId && clientPrice.trim() ? Number(clientPrice) : undefined;
    if (editingItemId && typeof parsedClientPrice === "number" && Number.isNaN(parsedClientPrice)) {
      alert("Precio del cliente inválido.");
      return;
    }

    setSavingItem(true);
    try {
      let uploadedPhotoId: Id<"_storage"> | undefined = undefined;
      if (photoFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": photoFile.type },
          body: photoFile,
        });
        const { storageId } = await response.json();
        uploadedPhotoId = storageId;
      }

      const payload = {
        adminId: dbUser._id,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        reference: reference.trim() || undefined,
        clientPrice: parsedClientPrice,
        notes: itemNotes.trim() || undefined,
        photoId: uploadedPhotoId,
      };

      if (editingItemId) {
        const currentItem = quotationDetail.items.find(
          (item: NonNullable<typeof quotationDetail>["items"][number]) => item._id === editingItemId
        );
        await updateQuotationItem({
          itemId: editingItemId,
          quotedPrice: currentItem?.quotedPrice ?? undefined,
          ...payload,
        });
        alert("Pieza actualizada.");
      } else {
        await addQuotationItem({
          quotationId: quotationDetail._id,
          ...payload,
        });
        alert("Pieza agregada a la cotización.");
      }

      resetItemForm();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la pieza.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: Id<"quotationItems">) => {
    if (!dbUser?._id) return;
    const ok = confirm("¿Eliminar esta pieza de la cotización?");
    if (!ok) return;

    setDeletingItemId(itemId);
    try {
      await deleteQuotationItem({
        adminId: dbUser._id,
        itemId,
      });
      if (editingItemId === itemId) {
        resetItemForm();
      }
      alert("Pieza eliminada.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la pieza.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDeleteQuotation = async (quotationId: Id<"quotations">) => {
    if (!dbUser?._id) return;
    const ok = confirm("¿Eliminar esta cotización completa? También se borrarán sus piezas y fotos.");
    if (!ok) return;

    setDeletingQuotationId(String(quotationId));
    try {
      await deleteQuotation({
        adminId: dbUser._id,
        quotationId,
      });

      if (selectedQuotationId === quotationId) {
        const nextQuotation = quotations.find((quotation) => quotation._id !== quotationId);
        setSelectedQuotationId(nextQuotation?._id ?? null);
      }

      resetItemForm();
      alert("Cotización eliminada.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la cotización.");
    } finally {
      setDeletingQuotationId(null);
    }
  };

  const handlePriceDraftChange = (
    itemId: Id<"quotationItems">,
    field: keyof PriceDraft,
    value: string
  ) => {
    setPriceDrafts((current) => ({
      ...current,
      [String(itemId)]: {
        clientPrice:
          field === "clientPrice" ? value : current[String(itemId)]?.clientPrice ?? "",
      },
    }));
  };

  const handleSaveItemPrices = async (
    item: NonNullable<typeof quotationDetail>["items"][number]
  ) => {
    if (!dbUser?._id) return;

    const draft = priceDrafts[String(item._id)] ?? {
      clientPrice: typeof item.clientPrice === "number" ? String(item.clientPrice) : "",
    };

    const parsedClientPrice = draft.clientPrice.trim() ? Number(draft.clientPrice) : undefined;

    if (typeof parsedClientPrice === "number" && Number.isNaN(parsedClientPrice)) {
      alert("Precio del cliente inválido.");
      return;
    }

    setSavingPriceItemId(String(item._id));
    try {
      await updateQuotationItem({
        adminId: dbUser._id,
        itemId: item._id,
        brand: item.brand ?? undefined,
        model: item.model ?? undefined,
        reference: item.reference ?? undefined,
        notes: item.notes ?? undefined,
        clientPrice: parsedClientPrice,
        quotedPrice: item.quotedPrice ?? undefined,
      });
      alert("Precio guardado.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el precio.");
    } finally {
      setSavingPriceItemId(null);
    }
  };

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (isAdminMode && (dbUser.role !== "admin" || dbUser.tenantKey !== "pa")) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Cotizaciones</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  if (!isAdminMode && !hasBuyerAccess) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Cotizaciones</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Cotizaciones</h1>
      <p className="mt-2 text-muted-foreground">
        Toma piezas en ruta, guarda fotos y referencias, y luego completa los precios con calma.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nueva cotización</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <label className="grid gap-2 text-sm">
                Cliente existente
                <Select value={newClientId} onValueChange={handleClientSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Escribir manualmente</SelectItem>
                    {clientOptions.map((client) => (
                      <SelectItem key={client._id} value={String(client._id)}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-2 text-sm">
                Nombre del cliente
                <Input
                  placeholder="Ej: Taller Rivera"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm">
                Notas
                <Textarea
                  placeholder="Detalles de la visita o del lote a cotizar"
                  value={newQuotationNotes}
                  onChange={(e) => setNewQuotationNotes(e.target.value)}
                />
              </label>

              <Button
                type="button"
                className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                onClick={handleCreateQuotation}
                disabled={creatingQuotation}
              >
                {creatingQuotation ? "Creando..." : "Crear cotización"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cotizaciones recientes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {quotations.length === 0 ? (
                <div className="text-sm text-muted-foreground">Todavía no hay cotizaciones registradas.</div>
              ) : null}
              {quotations.map((quotation) => (
                <div
                  key={quotation._id}
                  className={`rounded-lg border px-3 py-3 ${
                    quotation._id === selectedQuotationId ? "border-[#234c4b] bg-[#f7fbfa]" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedQuotationId(quotation._id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-[#234c4b]">{quotation.clientName}</div>
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABELS[quotation.status as QuotationStatus] ?? quotation.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {quotation.itemCount} piezas · cliente {formatMoney(quotation.totalClientPrice ?? 0)}
                      </div>
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteQuotation(quotation._id)}
                      disabled={deletingQuotationId === String(quotation._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {!quotationDetail ? (
            <Card>
              <CardContent className="py-10 text-sm text-muted-foreground">
                Selecciona una cotización o crea una nueva para empezar.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Cabecera de la cotización</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Cliente
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Estado
                      <Select value={quotationStatus} onValueChange={(value) => setQuotationStatus(value as QuotationStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm">
                    Notas
                    <Textarea value={quotationNotes} onChange={(e) => setQuotationNotes(e.target.value)} />
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-muted-foreground">Piezas</div>
                      <div className="mt-2 text-2xl font-semibold">{quotationDetail.summary.itemCount}</div>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <div className="text-xs text-muted-foreground">Precio cliente</div>
                      <div className="mt-2 text-2xl font-semibold">{formatMoney(quotationDetail.summary.totalClientPrice)}</div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-fit bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                    onClick={handleSaveQuotation}
                    disabled={savingQuotation}
                  >
                    {savingQuotation ? "Guardando..." : "Guardar cabecera"}
                  </Button>
                </CardContent>
              </Card>

              <div ref={itemFormRef}>
              <Card>
                <CardHeader>
                  <CardTitle>{editingItemId ? "Editar pieza" : "Agregar pieza"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {!editingItemId ? (
                    <div className="rounded-lg border border-dashed bg-[#f7fbfa] px-4 py-3 text-sm text-muted-foreground">
                      Primero registra la pieza con foto y datos. Los precios los agregas después al editarla.
                    </div>
                  ) : null}

                  <div className="flex justify-center md:justify-start">
                    <div className="w-fit">
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={onPhotoChange}
                      />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPhotoChange}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPhotoOptions((value) => !value)}
                        className="h-32 w-32 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-white text-gray-500"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Pieza" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-1">
                            <Camera className="h-10 w-10" />
                            <span className="text-xs">Agregar foto</span>
                          </div>
                        )}
                      </button>

                      {showPhotoOptions ? (
                        <div className="mt-2 grid gap-2">
                          <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                            Tomar foto
                          </Button>
                          <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
                            Elegir de galería
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      Marca
                      <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Toyota" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Modelo
                      <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: GP1" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Referencia
                      <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Código o referencia visible" />
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm">
                    Notas
                    <Textarea
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="Detalles extra de la pieza o de la visita"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                      onClick={handleSaveItem}
                      disabled={savingItem}
                    >
                      {savingItem ? "Guardando..." : editingItemId ? "Actualizar pieza" : "Agregar pieza"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetItemForm} disabled={savingItem}>
                      Limpiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Piezas de la cotización</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {quotationDetail.items.length} registradas
                  </span>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {quotationDetail.items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Todavía no has agregado piezas a esta cotización.
                    </div>
                  ) : null}

                  {quotationDetail.items.map((item: NonNullable<typeof quotationDetail>["items"][number]) => (
                    <div key={item._id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[88px_1fr_auto] md:items-center">
                      <button
                        type="button"
                        className="h-20 w-20 overflow-hidden rounded-md border bg-muted"
                        onClick={() => item.photoUrl ? setExpandedPhotoUrl(item.photoUrl) : null}
                        disabled={!item.photoUrl}
                      >
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt="Pieza" className="h-full w-full object-cover" />
                        ) : null}
                      </button>

                      <div className="grid gap-1 text-sm">
                        <div className="font-medium text-[#234c4b]">
                          {[item.brand, item.model].filter(Boolean).join(" ") || "Pieza sin marca/modelo"}
                        </div>
                        <div className="text-muted-foreground">
                          Referencia: {item.reference ?? "-"}
                        </div>
                        <div className="grid gap-3 rounded-lg bg-muted/30 p-3">
                          <div className="grid gap-3">
                            <label className="grid gap-2 text-xs font-medium text-muted-foreground">
                              Precio del cliente
                              <Input
                                value={priceDrafts[String(item._id)]?.clientPrice ?? ""}
                                onChange={(e) => handlePriceDraftChange(item._id, "clientPrice", e.target.value)}
                                type="number"
                                placeholder="USD"
                              />
                            </label>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                              {typeof item.clientPrice === "number"
                                ? `Guardado: cliente ${
                                    typeof item.clientPrice === "number" ? formatMoney(item.clientPrice) : "-"
                                  }`
                                : "Precios pendientes"}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSaveItemPrices(item)}
                              disabled={savingPriceItemId === String(item._id)}
                            >
                              {savingPriceItemId === String(item._id) ? "Guardando..." : "Guardar precio"}
                            </Button>
                          </div>
                        </div>
                        {item.notes ? <div className="text-muted-foreground">{item.notes}</div> : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => handleEditItem(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteItem(item._id)}
                          disabled={deletingItemId === item._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Dialog open={expandedPhotoUrl !== null} onOpenChange={(open) => !open ? setExpandedPhotoUrl(null) : null}>
                <DialogContent className="max-w-3xl border bg-white p-4">
                  <DialogHeader>
                    <DialogTitle>Foto de la pieza</DialogTitle>
                  </DialogHeader>
                  {expandedPhotoUrl ? (
                    <img
                      src={expandedPhotoUrl}
                      alt="Foto ampliada de la pieza"
                      className="max-h-[75vh] w-full rounded-md object-contain"
                    />
                  ) : null}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
