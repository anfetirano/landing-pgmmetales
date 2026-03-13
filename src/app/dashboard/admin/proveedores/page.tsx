"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Trash2, Camera, Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyByTenant } from "@/lib/currency";
import { formatLotCode } from "@/lib/lots";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

export default function ProveedoresPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);
  const lotCode = (number: number) => formatLotCode(number, dbUser?.tenantKey);
  const formatDateTime = (timestamp?: number) =>
    new Date(timestamp ?? Date.now()).toLocaleString(
      dbUser?.tenantKey === "pa" ? "en-US" : "es-CO"
    );
  const activeLot = useQuery(
    api.lots.getActiveLot,
    dbUser ? { tenantKey: dbUser.tenantKey ?? "co" } : "skip"
  );

  const suppliers =
    useQuery(
      api.suppliers.listSuppliers,
      dbUser && dbUser.role === "admin" ? { adminId: dbUser._id } : "skip"
    ) ?? [];
  const [selectedSupplierId, setSelectedSupplierId] = useState<Id<"suppliers"> | null>(null);

  const supplierId: Id<"suppliers"> | null = selectedSupplierId ?? suppliers[0]?._id ?? null;

  const balance = useQuery(
    api.supplierMovements.getBalanceBySupplier,
    supplierId && activeLot?._id ? { supplierId, lotId: activeLot._id } : "skip"
  );
  const movements =
    useQuery(
      api.supplierMovements.listBySupplier,
      supplierId && activeLot?._id ? { supplierId, lotId: activeLot._id } : "skip"
    ) ?? [];
  const purchases =
    useQuery(
      api.supplierPurchases.listBySupplier,
      supplierId && activeLot?._id ? { supplierId, lotId: activeLot._id } : "skip"
    ) ?? [];

  const createSupplier = useMutation(api.suppliers.createSupplier);
  const addMovement = useMutation(api.supplierMovements.addMovement);
  const openBase = useMutation(api.supplierMovements.openBase);
  const deleteMovement = useMutation(api.supplierMovements.deleteMovement);

  const createPurchase = useMutation(api.supplierPurchases.createPurchase);
  const updatePurchase = useMutation(api.supplierPurchases.updatePurchase);
  const deletePurchase = useMutation(api.supplierPurchases.deletePurchase);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierCity, setNewSupplierCity] = useState("");
  const [newSupplierIdentification, setNewSupplierIdentification] = useState("");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const [amount, setAmount] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [loadingMovement, setLoadingMovement] = useState(false);
  const [loadingOpenBase, setLoadingOpenBase] = useState(false);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);

  const [purchaseType, setPurchaseType] = useState<"pieza" | "suelto">("pieza");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [grams, setGrams] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<Id<"supplierPurchases"> | null>(null);
  const formScopeRef = useRef<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const sortedPurchases = useMemo(
    () => [...purchases].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [purchases]
  );

  const supplierName = suppliers.find((s) => s._id === supplierId)?.name ?? "Proveedor";
  const editingPurchase = useMemo(
    () => sortedPurchases.find((purchase) => purchase._id === editingPurchaseId) ?? null,
    [sortedPurchases, editingPurchaseId]
  );
  const looseComputedTotal = useMemo(() => {
    if (purchaseType !== "suelto") return null;
    const numericGrams = Number(grams || 0);
    const numericUnitPrice = Number(unitPrice || 0);
    if (Number.isNaN(numericGrams) || Number.isNaN(numericUnitPrice)) return null;
    if (numericGrams <= 0 || numericUnitPrice <= 0) return null;
    return Number((numericGrams * numericUnitPrice).toFixed(2));
  }, [purchaseType, grams, unitPrice]);

  const resetPurchaseForm = () => {
    setPurchaseType("pieza");
    setDescription("");
    setModel("");
    setQuantity("1");
    setGrams("");
    setUnitPrice("");
    setPricePaid("");
    setPurchaseNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingPurchaseId(null);
  };

  useEffect(() => {
    const scope =
      supplierId && activeLot?._id ? `${String(supplierId)}:${String(activeLot._id)}` : null;

    if (!scope) {
      formScopeRef.current = null;
      return;
    }

    if (formScopeRef.current && formScopeRef.current !== scope) {
      setAmount("");
      setMovementNotes("");
      resetPurchaseForm();
    }

    formScopeRef.current = scope;
  }, [supplierId, activeLot?._id]);

  useEffect(() => {
    if (!editingPurchaseId) return;
    const existsInCurrentList = sortedPurchases.some((purchase) => purchase._id === editingPurchaseId);
    if (!existsInCurrentList) {
      resetPurchaseForm();
    }
  }, [editingPurchaseId, sortedPurchases]);

  const handleCreateSupplier = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!newSupplierName.trim()) return alert("Nombre obligatorio.");

    try {
      const id = await createSupplier({
        name: newSupplierName.trim(),
        city: newSupplierCity.trim() || undefined,
        identification: newSupplierIdentification.trim() || undefined,
        contactName: newSupplierContact.trim() || undefined,
        phone: newSupplierPhone.trim() || undefined,
        createdBy: dbUser._id,
      });

      setSelectedSupplierId(id);
      setNewSupplierName("");
      setNewSupplierCity("");
      setNewSupplierIdentification("");
      setNewSupplierContact("");
      setNewSupplierPhone("");
      alert("Proveedor creado.");
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, "Error creando proveedor."));
    }
  };

  const handleMovement = async (type: "fund" | "adjustment" | "expense") => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!activeLot?._id) return alert("No hay lote activo.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!amount) return alert("Ingresa un monto.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric === 0) return alert("Monto inválido.");

    setLoadingMovement(true);
    try {
      await addMovement({
        supplierId,
        lotId: activeLot._id,
        amount: numeric,
        type,
        notes: movementNotes || undefined,
        createdBy: dbUser._id,
      });
      setAmount("");
      setMovementNotes("");
      alert("Movimiento registrado.");
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, "Error registrando movimiento."));
    } finally {
      setLoadingMovement(false);
    }
  };

  const handleOpenBase = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!activeLot?._id) return alert("No hay lote activo.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!amount) return alert("Ingresa un monto base.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) return alert("Monto inválido.");

    const ok = confirm(
      `Se abrirá una NUEVA base para ${supplierName} por ${formatMoney(Math.abs(numeric))}.\n\nNo se borra historial.`
    );
    if (!ok) return;

    setLoadingOpenBase(true);
    try {
      await openBase({
        supplierId,
        lotId: activeLot._id,
        amount: Math.abs(numeric),
        notes: movementNotes || "Apertura de base",
        createdBy: dbUser._id,
      });
      setAmount("");
      setMovementNotes("");
      alert("Base abierta.");
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, "Error abriendo base."));
    } finally {
      setLoadingOpenBase(false);
    }
  };

  const handleDeleteMovement = async (movementId: Id<"supplierMovements">) => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");

    const ok = confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingMovementId(movementId);
    try {
      await deleteMovement({
        movementId,
        deletedBy: dbUser._id,
      });
      alert("Movimiento eliminado.");
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, "Error eliminando movimiento."));
    } finally {
      setDeletingMovementId(null);
    }
  };

  const handleSelectSupplier = (nextSupplierId: Id<"suppliers">) => {
    if (nextSupplierId === supplierId) return;
    setSelectedSupplierId(nextSupplierId);
    setAmount("");
    setMovementNotes("");
    resetPurchaseForm();
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startEditingPurchase = (purchase: (typeof sortedPurchases)[number]) => {
    setEditingPurchaseId(purchase._id);
    setPurchaseType(purchase.type);
    setDescription(purchase.description ?? "");
    setModel(purchase.model ?? "");
    setQuantity(
      purchase.type === "pieza" && typeof purchase.quantity === "number"
        ? String(Math.max(1, Math.trunc(purchase.quantity)))
        : "1"
    );
    setGrams(
      purchase.type === "suelto" && typeof purchase.grams === "number"
        ? String(purchase.grams)
        : ""
    );
    setUnitPrice(
      purchase.type === "suelto"
        ? typeof purchase.unitPrice === "number" && purchase.unitPrice > 0
          ? String(purchase.unitPrice)
          : purchase.grams && purchase.grams > 0
          ? String(Number((purchase.pricePaid / purchase.grams).toFixed(2)))
          : ""
        : ""
    );
    setPricePaid(String(purchase.pricePaid ?? ""));
    setPurchaseNotes(purchase.notes ?? "");
    setPhotoFile(null);
    setPhotoPreview(purchase.photoUrl ?? null);
  };

  const handleSavePurchase = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!activeLot?._id) return alert("No hay lote activo.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!description.trim()) return alert("Completa la descripción.");

    let parsedQuantity: number | undefined = undefined;
    let parsedGrams: number | undefined = undefined;
    let parsedUnitPrice: number | undefined = undefined;
    let finalPricePaid = 0;

    if (purchaseType === "pieza") {
      if (!pricePaid) return alert("Completa el valor pagado.");
      parsedQuantity = Number(quantity || 0);
      if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
        return alert("Unidades inválidas para pieza.");
      }
      parsedQuantity = Math.max(1, Math.trunc(parsedQuantity));
      finalPricePaid = Number(pricePaid);
      if (Number.isNaN(finalPricePaid) || finalPricePaid <= 0) {
        return alert("Valor pagado inválido.");
      }
    }

    if (purchaseType === "suelto") {
      parsedGrams = Number(grams || 0);
      if (Number.isNaN(parsedGrams) || parsedGrams <= 0) {
        return alert("Gramos inválidos para material suelto.");
      }
      parsedUnitPrice = Number(unitPrice || 0);
      if (Number.isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
        return alert("Valor por gramo inválido.");
      }
      finalPricePaid = Number((parsedGrams * parsedUnitPrice).toFixed(2));
      if (finalPricePaid <= 0) {
        return alert("Total inválido.");
      }
    }

    const isEditingCurrentContext =
      !!editingPurchase &&
      editingPurchase._id === editingPurchaseId &&
      editingPurchase.supplierId === supplierId &&
      editingPurchase.lotId === activeLot._id;

    setLoadingPurchase(true);
    try {
      let photoId: Id<"_storage"> | undefined = isEditingCurrentContext
        ? editingPurchase?.photoId
        : undefined;

      if (photoFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": photoFile.type },
          body: photoFile,
        });
        const { storageId } = await res.json();
        photoId = storageId;
      }

      if (editingPurchaseId && isEditingCurrentContext) {
        await updatePurchase({
          purchaseId: editingPurchaseId,
          supplierId,
          lotId: activeLot._id,
          type: purchaseType,
          description: description.trim(),
          model: purchaseType === "pieza" ? model.trim() || undefined : undefined,
          quantity: purchaseType === "pieza" ? parsedQuantity : undefined,
          grams: purchaseType === "suelto" ? parsedGrams : undefined,
          unitPrice: purchaseType === "suelto" ? parsedUnitPrice : undefined,
          pricePaid: finalPricePaid,
          notes: purchaseNotes.trim() || undefined,
          photoId,
          updatedBy: dbUser._id,
        });
        alert("Ingreso actualizado.");
      } else {
        if (editingPurchaseId && !isEditingCurrentContext) {
          // Evita que una edición vieja termine sobreescribiendo otra carga.
          setEditingPurchaseId(null);
        }
        await createPurchase({
          supplierId,
          lotId: activeLot._id,
          type: purchaseType,
          description: description.trim(),
          model: purchaseType === "pieza" ? model.trim() || undefined : undefined,
          quantity: purchaseType === "pieza" ? parsedQuantity : undefined,
          grams: purchaseType === "suelto" ? parsedGrams : undefined,
          unitPrice: purchaseType === "suelto" ? parsedUnitPrice : undefined,
          pricePaid: finalPricePaid,
          notes: purchaseNotes.trim() || undefined,
          photoId,
          createdBy: dbUser._id,
        });
        alert("Ingreso registrado.");
      }

      resetPurchaseForm();
    } catch (e) {
      console.error(e);
      alert(
        getErrorMessage(
          e,
          editingPurchaseId ? "Error actualizando ingreso." : "Error registrando ingreso."
        )
      );
    } finally {
      setLoadingPurchase(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: Id<"supplierPurchases">) => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");

    const ok = confirm("¿Eliminar este ingreso? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingPurchaseId(purchaseId);
    try {
      await deletePurchase({
        purchaseId,
        deletedBy: dbUser._id,
      });
      if (editingPurchaseId === purchaseId) {
        resetPurchaseForm();
      }
      alert("Ingreso eliminado.");
    } catch (e) {
      console.error(e);
      alert(getErrorMessage(e, "Error eliminando ingreso."));
    } finally {
      setDeletingPurchaseId(null);
    }
  };

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (dbUser.role !== "admin") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Proveedores</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Proveedores</h1>
      <p className="text-foreground-accent mt-2">
        Gestiona base, movimientos e ingresos de proveedores externos.
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Lote activo: {activeLot?.number ? lotCode(activeLot.number) : "Sin lote activo"}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Lista de proveedores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {suppliers.map((s) => (
              <button
                key={s._id}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  s._id === supplierId ? "bg-[#234c4b] text-white" : "hover:bg-muted"
                }`}
                onClick={() => handleSelectSupplier(s._id)}
              >
                {s.name}
                {s.city ? ` — ${s.city}` : ""}
              </button>
            ))}
            {suppliers.length === 0 && (
              <div className="text-sm text-muted-foreground">No hay proveedores.</div>
            )}

            <div className="mt-4 border-t pt-3 grid gap-2">
              <Input
                placeholder="Nombre proveedor"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
              <Input
                placeholder="Ciudad"
                value={newSupplierCity}
                onChange={(e) => setNewSupplierCity(e.target.value)}
              />
              <Input
                placeholder="Identificación (opcional)"
                value={newSupplierIdentification}
                onChange={(e) => setNewSupplierIdentification(e.target.value)}
              />
              <Input
                placeholder="Contacto (opcional)"
                value={newSupplierContact}
                onChange={(e) => setNewSupplierContact(e.target.value)}
              />
              <Input
                placeholder="Teléfono (opcional)"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleCreateSupplier}>
                Crear proveedor
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldo de {supplierName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div>Base + movimientos desde última apertura: {formatMoney(balance?.totalFunds ?? 0)}</div>
              <div>Pagado en ingresos desde última apertura: {formatMoney(balance?.totalSpent ?? 0)}</div>
              <div className="text-lg font-semibold">Saldo actual: {formatMoney(balance?.balance ?? 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrar movimiento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input
                placeholder="Monto (ej: 2000000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                placeholder="Notas (opcional)"
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                  onClick={() => handleMovement("fund")}
                  disabled={loadingMovement || loadingOpenBase}
                >
                  Agregar base
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMovement("adjustment")}
                  disabled={loadingMovement || loadingOpenBase}
                >
                  Ajustar saldo (-)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMovement("expense")}
                  disabled={loadingMovement || loadingOpenBase}
                >
                  Registrar gasto (-)
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleOpenBase}
                  disabled={loadingMovement || loadingOpenBase}
                >
                  {loadingOpenBase ? "Abriendo..." : "Abrir base nueva"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingPurchaseId ? "Editar ingreso de carga" : "Registrar ingreso de carga"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {editingPurchase ? (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Editando: <span className="font-medium text-foreground">{editingPurchase.description}</span> ·{" "}
                  Valor pagado actual:{" "}
                  <span className="font-medium text-foreground">{formatMoney(editingPurchase.pricePaid ?? 0)}</span>
                </div>
              ) : null}
              {editingPurchaseId ? (
                <Button type="button" variant="outline" onClick={resetPurchaseForm} disabled={loadingPurchase}>
                  Crear ingreso nuevo
                </Button>
              ) : null}
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={purchaseType}
                  onValueChange={(v) => {
                    const nextType = v as "pieza" | "suelto";
                    setPurchaseType(nextType);
                    if (nextType === "pieza") {
                      setGrams("");
                      setUnitPrice("");
                    } else {
                      setModel("");
                      setQuantity("1");
                      setPricePaid("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieza">Pieza</SelectItem>
                    <SelectItem value="suelto">Material suelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Descripción (ej: Catalizadores mixtos)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {purchaseType === "pieza" && (
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Unidades"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              )}

              {purchaseType === "pieza" && (
                <Input
                  placeholder="Modelo (opcional)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              )}

              {purchaseType === "suelto" && (
                <>
                  <Input
                    type="number"
                    placeholder="Gramos"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Valor por gramo"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium text-foreground">
                      {looseComputedTotal !== null ? formatMoney(looseComputedTotal) : "-"}
                    </span>
                  </div>
                </>
              )}

              {purchaseType === "pieza" ? (
                <Input
                  type="number"
                  placeholder="Valor pagado"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value)}
                />
              ) : null}

              <Textarea
                placeholder="Notas (opcional)"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
              />

              <div className="grid gap-2">
                <label className="text-sm font-medium">Foto del lote (opcional)</label>
                <input type="file" accept="image/*" onChange={onPhotoChange} />
                {photoPreview ? (
                  <div className="h-28 w-28 overflow-hidden rounded border">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Camera className="h-4 w-4" />
                    Sin foto seleccionada
                  </div>
                )}
              </div>

              <Button
                type="button"
                className="w-full bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                onClick={handleSavePurchase}
                disabled={loadingPurchase}
              >
                {loadingPurchase
                  ? "Guardando..."
                  : editingPurchaseId
                  ? "Guardar cambios del ingreso"
                  : "Guardar ingreso"}
              </Button>
              {editingPurchaseId ? (
                <Button type="button" variant="outline" onClick={resetPurchaseForm} disabled={loadingPurchase}>
                  Cancelar edición
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos registrados</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {sortedPurchases.length === 0 && (
                <div className="text-sm text-muted-foreground">No hay ingresos registrados.</div>
              )}
              {sortedPurchases.map((p) => (
                <div
                  key={p._id}
                  className={`flex items-center gap-3 border-b pb-2 last:border-b-0 ${
                    editingPurchaseId === p._id ? "rounded-md bg-muted/40" : ""
                  }`}
                >
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="Ingreso" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-left text-sm">
                    <div className="font-medium">{p.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.type === "pieza"
                        ? `Pieza · ${Math.max(1, Math.trunc(p.quantity ?? 1))} und`
                        : `Suelto · ${p.grams ?? 0} g${
                            typeof p.unitPrice === "number" && p.unitPrice > 0
                              ? ` · ${formatMoney(p.unitPrice)} / g`
                              : ""
                          }`}{" "}
                      · Valor pagado:{" "}
                      {formatMoney(p.pricePaid)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEditingPurchase(p)}
                    title="Editar ingreso"
                    aria-label="Editar ingreso"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => handleDeletePurchase(p._id)}
                    disabled={deletingPurchaseId === p._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de movimientos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {movements.length === 0 && (
                <div className="text-muted-foreground">No hay movimientos.</div>
              )}
              {movements.map((m) => (
                <div key={m._id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div>
                    <div className="font-medium">
                      {m.type === "opening"
                        ? "Apertura de base"
                        : m.type === "carryover"
                        ? "Saldo arrastrado"
                        : m.type === "fund"
                        ? "Entrega"
                        : m.type === "expense"
                        ? "Gasto"
                        : "Ajuste"}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.notes ?? ""}</div>
                    <div className="text-xs text-muted-foreground">
                      Fecha: {formatDateTime(m.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={m.amount >= 0 ? "text-green-700" : "text-red-600"}>
                      {formatMoney(m.amount)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteMovement(m._id)}
                      disabled={deletingMovementId === m._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
