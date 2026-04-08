"use client";

import { useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Camera, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMoneyByTenant } from "@/lib/currency";

const CATEGORY_LABELS = {
  gasolina: "Gasolina",
  comida: "Comida",
  parqueadero: "Parqueadero",
  otros: "Otros",
} as const;

type ExpenseCategory = keyof typeof CATEGORY_LABELS;

export default function GastosPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const buyerId = dbUser?.role === "buyer" ? dbUser._id : undefined;
  const hasBuyerExpenses =
    dbUser?.role === "buyer" &&
    dbUser?.tenantKey === "pa" &&
    Array.isArray(dbUser?.features) &&
    dbUser.features.includes("buyer_expenses");
  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);

  const activeLot = useQuery(
    api.lots.getActiveLot,
    dbUser ? { tenantKey: dbUser.tenantKey ?? "co" } : "skip"
  );
  const summary = useQuery(
    api.buyerExpenses.getExpenseSummaryByBuyer,
    buyerId && hasBuyerExpenses ? { buyerId, viewerId: buyerId } : "skip"
  );
  const expenses =
    useQuery(
      api.buyerExpenses.listByBuyer,
      buyerId && hasBuyerExpenses ? { buyerId, viewerId: buyerId } : "skip"
    ) ?? [];

  const createExpense = useMutation(api.buyerExpenses.createExpense);
  const updateExpense = useMutation(api.buyerExpenses.updateExpense);
  const deleteExpense = useMutation(api.buyerExpenses.deleteExpense);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [category, setCategory] = useState<ExpenseCategory>("gasolina");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<Id<"buyerExpenses"> | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [expenses]
  );

  const resetForm = () => {
    setCategory("gasolina");
    setDescription("");
    setAmount("");
    setNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPhotoOptions(false);
    setEditingExpenseId(null);
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

  const uploadReceiptIfNeeded = async () => {
    if (!photoFile) return undefined;

    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": photoFile.type },
      body: photoFile,
    });
    const { storageId } = await res.json();
    return storageId as Id<"_storage">;
  };

  const handleSave = async () => {
    if (!dbUser || !buyerId || !hasBuyerExpenses) {
      alert("No autorizado.");
      return;
    }
    if (!activeLot?._id) {
      alert("No hay lote activo en este momento.");
      return;
    }
    if (!description.trim()) {
      alert("La descripción es obligatoria.");
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert("Monto inválido.");
      return;
    }

    setLoading(true);
    try {
      const receiptPhotoId = await uploadReceiptIfNeeded();

      if (editingExpenseId) {
        await updateExpense({
          expenseId: editingExpenseId,
          category,
          description: description.trim(),
          amount: numericAmount,
          notes: notes.trim() || undefined,
          receiptPhotoId,
          updatedBy: dbUser._id,
        });
        alert("Gasto actualizado.");
      } else {
        await createExpense({
          buyerId,
          category,
          description: description.trim(),
          amount: numericAmount,
          notes: notes.trim() || undefined,
          receiptPhotoId,
          createdBy: dbUser._id,
        });
        alert("Gasto guardado.");
      }

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Error guardando el gasto.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: (typeof expenses)[number]) => {
    setEditingExpenseId(expense._id);
    setCategory(expense.category as ExpenseCategory);
    setDescription(expense.description ?? "");
    setAmount(String(expense.amount ?? ""));
    setNotes(expense.notes ?? "");
    setPhotoFile(null);
    setPhotoPreview(expense.receiptPhotoUrl ?? null);
    setShowPhotoOptions(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (expenseId: Id<"buyerExpenses">) => {
    if (!dbUser) return;
    const ok = confirm("¿Eliminar este gasto? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingExpenseId(expenseId);
    try {
      await deleteExpense({
        expenseId,
        deletedBy: dbUser._id,
      });
      if (editingExpenseId === expenseId) {
        resetForm();
      }
      alert("Gasto eliminado.");
    } catch (error) {
      console.error(error);
      alert("Error eliminando el gasto.");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  if (!dbUser) {
    return <div className="max-w-5xl">Cargando...</div>;
  }

  if (!hasBuyerExpenses) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Gastos</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Gastos</h1>
      <p className="text-foreground-accent mt-2">
        Registra tus gastos operativos y adjunta el recibo cuando lo tengas.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Lote activo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary?.activeLotNumber ?? activeLot?.number ?? "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total gastos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-600">
            {formatMoney(summary?.totalExpenses ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cantidad de gastos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary?.expenseCount ?? 0}</CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6">
        <div className="flex justify-center">
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
              className="h-42 w-42 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white text-gray-500"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Recibo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <Camera className="h-20 w-20" />
                  <span className="text-xs">Toca para foto</span>
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

        <Card>
          <CardHeader>
            <CardTitle>{editingExpenseId ? "Editar gasto" : "Nuevo gasto"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Monto</label>
              <Input
                type="number"
                placeholder="Ej: 25"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input
                placeholder="Ej: Gasolina para ruta Panamá Oeste"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Detalle adicional del gasto"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Guardando..." : editingExpenseId ? "Guardar cambios" : "Guardar gasto"}
              </Button>
              {editingExpenseId ? (
                <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de gastos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {sortedExpenses.length === 0 ? (
              <div className="text-sm text-muted-foreground">Todavía no hay gastos registrados.</div>
            ) : (
              sortedExpenses.map((expense) => (
                <div key={expense._id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                  <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                    {expense.receiptPhotoUrl ? (
                      <img
                        src={expense.receiptPhotoUrl}
                        alt="Recibo"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {CATEGORY_LABELS[expense.category as ExpenseCategory]} — {expense.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(expense.createdAt).toLocaleDateString("es-PA")}
                      {expense.lotNumber ? ` · Lote ${expense.lotNumber}` : ""}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-red-600">{formatMoney(expense.amount ?? 0)}</div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(expense._id)}
                      disabled={deletingExpenseId === expense._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
