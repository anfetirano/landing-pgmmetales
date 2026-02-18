"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Trash2, Camera } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProveedoresPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const suppliers = useQuery(api.suppliers.listSuppliers) ?? [];
  const [selectedSupplierId, setSelectedSupplierId] = useState<Id<"suppliers"> | null>(null);

  const supplierId: Id<"suppliers"> | null = selectedSupplierId ?? suppliers[0]?._id ?? null;

  const balance = useQuery(
    api.supplierMovements.getBalanceBySupplier,
    supplierId ? { supplierId } : "skip"
  );
  const movements = useQuery(
    api.supplierMovements.listBySupplier,
    supplierId ? { supplierId } : "skip"
  ) ?? [];
  const purchases = useQuery(
    api.supplierPurchases.listBySupplier,
    supplierId ? { supplierId } : "skip"
  ) ?? [];

  const createSupplier = useMutation(api.suppliers.createSupplier);
  const addMovement = useMutation(api.supplierMovements.addMovement);
  const openBase = useMutation(api.supplierMovements.openBase);
  const createPurchase = useMutation(api.supplierPurchases.createPurchase);
  const deletePurchase = useMutation(api.supplierPurchases.deletePurchase);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [newSupplierName, setNewSupplierName] = useState("Javier Martinez");
  const [newSupplierCity, setNewSupplierCity] = useState("Barranquilla");
  const [newSupplierContact, setNewSupplierContact] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const [amount, setAmount] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [loadingMovement, setLoadingMovement] = useState(false);
  const [loadingOpenBase, setLoadingOpenBase] = useState(false);

  const [purchaseType, setPurchaseType] = useState<"pieza" | "suelto">("pieza");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("");
  const [grams, setGrams] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const sortedPurchases = useMemo(
    () => [...purchases].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [purchases]
  );

  const supplierName = suppliers.find((s) => s._id === supplierId)?.name ?? "Proveedor";

  const handleCreateSupplier = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!newSupplierName.trim()) return alert("Nombre obligatorio.");

    try {
      const id = await createSupplier({
        name: newSupplierName.trim(),
        city: newSupplierCity.trim() || undefined,
        contactName: newSupplierContact.trim() || undefined,
        phone: newSupplierPhone.trim() || undefined,
        createdBy: dbUser._id,
      });
      setSelectedSupplierId(id);
      alert("Proveedor creado.");
    } catch (e) {
      console.error(e);
      alert("Error creando proveedor.");
    }
  };

  const handleMovement = async (type: "fund" | "adjustment" | "expense") => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!amount) return alert("Ingresa un monto.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric === 0) return alert("Monto inválido.");

    setLoadingMovement(true);
    try {
      await addMovement({
        supplierId,
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
      alert("Error registrando movimiento.");
    } finally {
      setLoadingMovement(false);
    }
  };

  const handleOpenBase = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!amount) return alert("Ingresa un monto base.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) return alert("Monto inválido.");

    const ok = confirm(
      `Se abrirá una NUEVA base para ${supplierName} por ${formatCop(Math.abs(numeric))}.\n\nNo se borra historial.`
    );
    if (!ok) return;

    setLoadingOpenBase(true);
    try {
      await openBase({
        supplierId,
        amount: Math.abs(numeric),
        notes: movementNotes || "Apertura de base",
        createdBy: dbUser._id,
      });
      setAmount("");
      setMovementNotes("");
      alert("Base abierta.");
    } catch (e) {
      console.error(e);
      alert("Error abriendo base.");
    } finally {
      setLoadingOpenBase(false);
    }
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

  const handleCreatePurchase = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!supplierId) return alert("Selecciona un proveedor.");
    if (!description.trim() || !pricePaid) return alert("Completa descripción y valor.");

    const numericPaid = Number(pricePaid);
    if (Number.isNaN(numericPaid) || numericPaid <= 0) return alert("Valor pagado inválido.");

    let parsedGrams: number | undefined = undefined;
    if (purchaseType === "suelto") {
      parsedGrams = Number(grams || 0);
      if (Number.isNaN(parsedGrams) || parsedGrams <= 0) {
        return alert("Gramos inválidos para material suelto.");
      }
    }

    setLoadingPurchase(true);
    try {
      let photoId: Id<"_storage"> | undefined = undefined;

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

      await createPurchase({
        supplierId,
        type: purchaseType,
        description: description.trim(),
        model: purchaseType === "pieza" ? model.trim() || undefined : undefined,
        grams: purchaseType === "suelto" ? parsedGrams : undefined,
        pricePaid: numericPaid,
        notes: purchaseNotes.trim() || undefined,
        photoId,
        createdBy: dbUser._id,
      });

      setDescription("");
      setModel("");
      setGrams("");
      setPricePaid("");
      setPurchaseNotes("");
      setPhotoFile(null);
      setPhotoPreview(null);

      alert("Ingreso registrado.");
    } catch (e) {
      console.error(e);
      alert("Error registrando ingreso.");
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
      alert("Ingreso eliminado.");
    } catch (e) {
      console.error(e);
      alert("Error eliminando ingreso.");
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
                onClick={() => setSelectedSupplierId(s._id)}
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
              <div>Base + movimientos desde última apertura: {formatCop(balance?.totalFunds ?? 0)}</div>
              <div>Pagado en ingresos desde última apertura: {formatCop(balance?.totalSpent ?? 0)}</div>
              <div className="text-lg font-semibold">Saldo actual: {formatCop(balance?.balance ?? 0)}</div>
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
              <CardTitle>Registrar ingreso de carga</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={purchaseType} onValueChange={(v) => setPurchaseType(v as "pieza" | "suelto")}>
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
                  placeholder="Modelo (opcional)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              )}

              {purchaseType === "suelto" && (
                <Input
                  type="number"
                  placeholder="Gramos"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                />
              )}

              <Input
                type="number"
                placeholder="Valor pagado"
                value={pricePaid}
                onChange={(e) => setPricePaid(e.target.value)}
              />

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
                onClick={handleCreatePurchase}
                disabled={loadingPurchase}
              >
                {loadingPurchase ? "Guardando..." : "Guardar ingreso"}
              </Button>
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
                <div key={p._id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="Ingreso" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{p.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.type === "pieza" ? "Pieza" : `Suelto · ${p.grams ?? 0} g`} · {formatCop(p.pricePaid)}
                    </div>
                  </div>
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
                        : m.type === "fund"
                        ? "Entrega"
                        : m.type === "expense"
                        ? "Gasto"
                        : "Ajuste"}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.notes ?? ""}</div>
                  </div>
                  <div className={m.amount >= 0 ? "text-green-700" : "text-red-600"}>
                    {formatCop(m.amount)}
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
