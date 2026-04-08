"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@convex/_generated/dataModel";
import { Camera, Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { formatLotCode } from "@/lib/lots";

const EXPENSE_CATEGORY_LABELS = {
  gasolina: "Gasolina",
  comida: "Comida",
  parqueadero: "Parqueadero",
  otros: "Otros",
} as const;

type ExpenseCategory = keyof typeof EXPENSE_CATEGORY_LABELS;

export default function AdminDashboardPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const adminArgs = dbUser && dbUser.role === "admin" ? { adminId: dbUser._id } : "skip";
  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);
  const lotCode = (number: number) => formatLotCode(number, dbUser?.tenantKey);

  const buyers = useQuery(api.users.listBuyers, adminArgs) ?? [];
  const [selectedBuyerId, setSelectedBuyerId] = useState<Id<"users"> | null>(null);
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const buyerId: Id<"users"> | null = selectedBuyerId ?? buyers[0]?._id ?? null;
  const selectedBuyer = buyers.find((b) => String(b._id) === String(buyerId));
  const selectedBuyerHasExpenses = Array.isArray(selectedBuyer?.features)
    && selectedBuyer.features.includes("buyer_expenses");
  const activeLot = useQuery(
    api.lots.getActiveLot,
    dbUser ? { tenantKey: dbUser.tenantKey ?? "co" } : "skip"
  );

  const balance = useQuery(api.cashMovements.getBalanceByBuyer, buyerId ? { buyerId } : "skip");
  const movements = useQuery(api.cashMovements.listByBuyer, buyerId ? { buyerId } : "skip") ?? [];
  const latest = useQuery(
    api.purchases.listLatestByBuyer,
    buyerId ? { buyerId, limit: 5 } : "skip"
  ) ?? [];
  const allPurchases = useQuery(
    api.purchases.listLatestByBuyer,
    buyerId ? { buyerId, limit: 1000 } : "skip"
  ) ?? [];
  const pendingClosings = useQuery(api.closings.listPending, adminArgs) ?? [];
  const expenseSummary = useQuery(
    api.buyerExpenses.getExpenseSummaryByBuyer,
    buyerId && selectedBuyerHasExpenses && dbUser
      ? { buyerId, viewerId: dbUser._id }
      : "skip"
  );
  const lotExpenses = useQuery(
    api.buyerExpenses.listByLotForAdmin,
    buyerId && selectedBuyerHasExpenses && activeLot?._id && dbUser
      ? { adminId: dbUser._id, buyerId, lotId: activeLot._id }
      : "skip"
  ) ?? [];

  const addMovement = useMutation(api.cashMovements.addMovement);
  const openBase = useMutation(api.cashMovements.openBase);
  const deletePurchaseAsAdmin = useMutation(api.purchases.deletePurchaseAsAdmin);
  const approvePurchasesInClosing = useMutation(api.closings.approvePurchasesInClosing);
  const updateExpense = useMutation(api.buyerExpenses.updateExpense);
  const deleteExpense = useMutation(api.buyerExpenses.deleteExpense);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [approvingClosingId, setApprovingClosingId] = useState<string | null>(null);
  const [selectedApprovals, setSelectedApprovals] = useState<Record<string, string[]>>({});
  const [pmrValues, setPmrValues] = useState<Record<string, string>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<Id<"buyerExpenses"> | null>(null);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("gasolina");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expensePhotoPreview, setExpensePhotoPreview] = useState<string | null>(null);
  const [expensePhotoFile, setExpensePhotoFile] = useState<File | null>(null);
  const [showExpensePhotoOptions, setShowExpensePhotoOptions] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const expenseCameraInputRef = useRef<HTMLInputElement | null>(null);
  const expenseGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const sortedMovements = useMemo(
    () => [...movements].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [movements]
  );
  const visiblePendingClosings = useMemo(
    () =>
      pendingClosings.filter((closing) =>
        buyerId ? String(closing.buyerId) === String(buyerId) : true
      ),
    [pendingClosings, buyerId]
  );

  const purchaseList = showAllPurchases ? allPurchases : latest;
  const buyerName = buyers.find((b) => b._id === buyerId)?.name ?? "Comprador";

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseCategory("gasolina");
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseNotes("");
    setExpensePhotoPreview(null);
    setExpensePhotoFile(null);
    setShowExpensePhotoOptions(false);
  };

  const onExpensePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setExpensePhotoFile(file);
    setShowExpensePhotoOptions(false);

    if (!file) {
      setExpensePhotoPreview(null);
      return;
    }

    setExpensePhotoPreview(URL.createObjectURL(file));
  };

  const handleMovement = async (type: "fund" | "adjustment" | "expense") => {
    if (!dbUser) return alert("Usuario no registrado.");
    if (!buyerId) return alert("Selecciona un comprador.");
    if (!amount) return alert("Ingresa un monto.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric === 0) return alert("Monto inválido.");

    setLoading(true);
    try {
      await addMovement({
        buyerId,
        amount: numeric,
        type,
        notes: notes || undefined,
        createdBy: dbUser._id,
      });
      setAmount("");
      setNotes("");
      alert("Movimiento registrado.");
    } catch (e) {
      console.error(e);
      alert("Error registrando movimiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBase = async () => {
    if (!dbUser) return alert("Usuario no registrado.");
    if (!buyerId) return alert("Selecciona un comprador.");
    if (!amount) return alert("Ingresa un monto base.");

    const numeric = Number(amount);
    if (Number.isNaN(numeric) || numeric <= 0) return alert("Monto inválido.");

    const selectedBuyerName = buyers.find((b) => b._id === buyerId)?.name ?? "este comprador";
    const ok = confirm(
      `Se abrirá una NUEVA base para ${selectedBuyerName} por ${formatMoney(
        Math.abs(numeric)
      )}.\n\nNo se borra historial.`
    );
    if (!ok) return;

    setOpening(true);
    try {
      await openBase({
        buyerId,
        amount: Math.abs(numeric),
        notes: notes || "Apertura de base",
        createdBy: dbUser._id,
      });
      setAmount("");
      setNotes("");
      alert("Base abierta correctamente.");
    } catch (e) {
      console.error(e);
      alert("Error abriendo base.");
    } finally {
      setOpening(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: Id<"purchases">) => {
    if (!dbUser) return alert("Usuario no registrado.");
    const ok = confirm("¿Eliminar esta compra? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingPurchaseId(purchaseId);
    try {
      await deletePurchaseAsAdmin({
        purchaseId,
        adminId: dbUser._id,
      });
      alert("Compra eliminada.");
    } catch (e) {
      console.error(e);
      alert("Error eliminando compra.");
    } finally {
      setDeletingPurchaseId(null);
    }
  };

  const handleEditExpense = (expense: (typeof lotExpenses)[number]) => {
    setEditingExpenseId(expense._id);
    setExpenseCategory(expense.category as ExpenseCategory);
    setExpenseDescription(expense.description ?? "");
    setExpenseAmount(String(expense.amount ?? ""));
    setExpenseNotes(expense.notes ?? "");
    setExpensePhotoPreview(expense.receiptPhotoUrl ?? null);
    setExpensePhotoFile(null);
    setShowExpensePhotoOptions(false);
  };

  const handleSaveExpense = async () => {
    if (!dbUser || !editingExpenseId) return;

    const numericAmount = Number(expenseAmount);
    if (!expenseDescription.trim()) return alert("La descripción es obligatoria.");
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return alert("Monto inválido.");

    setSavingExpense(true);
    try {
      let receiptPhotoId: Id<"_storage"> | undefined = undefined;

      if (expensePhotoFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": expensePhotoFile.type },
          body: expensePhotoFile,
        });
        const { storageId } = await res.json();
        receiptPhotoId = storageId;
      }

      await updateExpense({
        expenseId: editingExpenseId,
        category: expenseCategory,
        description: expenseDescription.trim(),
        amount: numericAmount,
        notes: expenseNotes.trim() || undefined,
        receiptPhotoId,
        updatedBy: dbUser._id,
      });

      alert("Gasto actualizado.");
      resetExpenseForm();
    } catch (error) {
      console.error(error);
      alert("Error actualizando el gasto.");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: Id<"buyerExpenses">) => {
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
        resetExpenseForm();
      }
      alert("Gasto eliminado.");
    } catch (error) {
      console.error(error);
      alert("Error eliminando el gasto.");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const togglePurchaseSelection = (closingId: Id<"dayClosings">, purchaseId: Id<"purchases">) => {
    setSelectedApprovals((prev) => {
      const current = prev[closingId] ?? [];
      const exists = current.includes(purchaseId);
      return {
        ...prev,
        [closingId]: exists
          ? current.filter((id) => id !== purchaseId)
          : [...current, purchaseId],
      };
    });
  };

  const handleApproveClosing = async (closingId: Id<"dayClosings">) => {
    if (!dbUser) return alert("Usuario no registrado.");
    const selectedIds = selectedApprovals[closingId] ?? [];
    if (selectedIds.length === 0) {
      alert("Selecciona al menos una compra para aprobar.");
      return;
    }
    const isPanama = dbUser.tenantKey === "pa";
    const closing = visiblePendingClosings.find((item) => String(item._id) === String(closingId));
    const pmrCatalogValues: { purchaseId: Id<"purchases">; value: number }[] = [];

    if (isPanama) {
      for (const purchaseId of selectedIds) {
        const purchase = closing?.purchases?.find((row) => String(row._id) === String(purchaseId));
        const raw =
          (pmrValues[purchaseId] ?? "")
            .trim() || (purchase?.pmrCatalogValue ? String(purchase.pmrCatalogValue) : "");
        if (!raw) {
          alert("En Panamá debes ingresar valor PMR para cada compra seleccionada.");
          return;
        }
        const numeric = Number(raw);
        if (Number.isNaN(numeric) || numeric <= 0) {
          alert("Valor PMR inválido.");
          return;
        }
        pmrCatalogValues.push({
          purchaseId: purchaseId as Id<"purchases">,
          value: numeric,
        });
      }
    }

    const ok = confirm(`¿Aprobar ${selectedIds.length} compra(s) seleccionada(s)?`);
    if (!ok) return;

    setApprovingClosingId(closingId);
    try {
      const result = await approvePurchasesInClosing({
        closingId,
        adminId: dbUser._id,
        purchaseIds: selectedIds as Id<"purchases">[],
        pmrCatalogValues: isPanama ? pmrCatalogValues : undefined,
      });
      setSelectedApprovals((prev) => ({ ...prev, [closingId]: [] }));
      if (isPanama) {
        setPmrValues((prev) => {
          const next = { ...prev };
          for (const purchaseId of selectedIds) {
            delete next[purchaseId];
          }
          return next;
        });
      }
      alert(
        result.closingReceived
          ? "Compras aprobadas. Cierre completado."
          : `Compras aprobadas. Pendientes: ${Math.max(
              0,
              (result.totalPurchases ?? 0) - (result.approvedTotal ?? 0)
            )}.`
      );
    } catch (e) {
      console.error(e);
      alert("Error aprobando compras.");
    } finally {
      setApprovingClosingId(null);
    }
  };

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (dbUser.role !== "admin") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Administrador</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Administrador</h1>
      <p className="text-foreground-accent mt-2">
        Control de base de compras, gastos y saldo por comprador.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Compradores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {buyers.map((b) => (
              <button
                key={b._id}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  b._id === buyerId ? "bg-[#234c4b] text-white" : "hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedBuyerId(b._id);
                  setShowAllPurchases(false);
                }}
              >
                {b.name}
              </button>
            ))}
            {buyers.length === 0 && (
              <div className="text-sm text-muted-foreground">No hay compradores.</div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldo operativo de {buyerName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div>Base + movimientos desde última apertura: {formatMoney(balance?.totalFunds ?? 0)}</div>
              <div>
                Gastado aprobado (pagado + comisión): {formatMoney(balance?.totalSpent ?? 0)}
              </div>
              <div>Pendiente por aprobar: {formatMoney(balance?.pendingSpent ?? 0)}</div>
              {selectedBuyerHasExpenses ? (
                <div>Gastos operativos: {formatMoney(balance?.totalExpenses ?? 0)}</div>
              ) : null}
              <div className="text-lg font-semibold">Saldo actual: {formatMoney(balance?.balance ?? 0)}</div>
            </CardContent>
          </Card>

          {selectedBuyerHasExpenses ? (
            <Card>
              <CardHeader>
                <CardTitle>Gastos operativos de {buyerName}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Lote activo</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {expenseSummary?.activeLotNumber ?? activeLot?.number ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Total gastos lote activo</p>
                    <p className="mt-2 text-2xl font-semibold text-red-600">
                      {formatMoney(expenseSummary?.totalExpenses ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Cantidad de gastos</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {expenseSummary?.expenseCount ?? 0}
                    </p>
                  </div>
                </div>

                {editingExpenseId ? (
                  <div className="grid gap-4 rounded-xl border p-4">
                    <div className="flex justify-center">
                      <div className="w-fit">
                        <input
                          ref={expenseCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={onExpensePhotoChange}
                        />
                        <input
                          ref={expenseGalleryInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onExpensePhotoChange}
                        />

                        <button
                          type="button"
                          onClick={() => setShowExpensePhotoOptions((value) => !value)}
                          className="h-32 w-32 overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white text-gray-500"
                        >
                          {expensePhotoPreview ? (
                            <img
                              src={expensePhotoPreview}
                              alt="Recibo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-1">
                              <Camera className="h-12 w-12" />
                              <span className="text-xs">Toca para foto</span>
                            </div>
                          )}
                        </button>

                        {showExpensePhotoOptions ? (
                          <div className="mt-2 grid gap-2">
                            <Button type="button" variant="outline" onClick={() => expenseCameraInputRef.current?.click()}>
                              Tomar foto
                            </Button>
                            <Button type="button" variant="outline" onClick={() => expenseGalleryInputRef.current?.click()}>
                              Elegir de galería
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <Select value={expenseCategory} onValueChange={(value) => setExpenseCategory(value as ExpenseCategory)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} type="number" placeholder="Monto" />
                    <Input value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Descripción" />
                    <Textarea value={expenseNotes} onChange={(e) => setExpenseNotes(e.target.value)} placeholder="Notas" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                        onClick={handleSaveExpense}
                        disabled={savingExpense}
                      >
                        {savingExpense ? "Guardando..." : "Guardar cambios"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetExpenseForm} disabled={savingExpense}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3">
                  {lotExpenses.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No hay gastos operativos registrados.</div>
                  ) : (
                    lotExpenses.map((expense) => (
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
                        <div className="flex-1 text-sm">
                          <div className="font-medium">
                            {EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory]} — {expense.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(expense.createdAt).toLocaleDateString("es-PA")}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          {formatMoney(expense.amount ?? 0)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteExpense(expense._id)}
                            disabled={deletingExpenseId === expense._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Registrar movimiento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input
                placeholder="Monto (ej: 800000)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Input
                placeholder="Notas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                  onClick={() => handleMovement("fund")}
                  disabled={loading || opening}
                >
                  Agregar base
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMovement("adjustment")}
                  disabled={loading || opening}
                >
                  Ajustar saldo (-)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMovement("expense")}
                  disabled={loading || opening}
                >
                  Registrar gasto (-)
                </Button>
                <Button variant="destructive" onClick={handleOpenBase} disabled={loading || opening}>
                  {opening ? "Abriendo..." : "Abrir base nueva"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{showAllPurchases ? "Todas las compras" : "Últimas 5 compras"}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllPurchases((prev) => !prev)}
              >
                {showAllPurchases ? "Ver últimas 5" : "Ver todas"}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {purchaseList.length === 0 && (
                <div className="text-sm text-muted-foreground">No hay compras recientes.</div>
              )}
              {purchaseList.map((p) => (
                <div key={p._id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt="Compra" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{p.brand}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.type === "pieza" ? "Pieza completa" : "Material suelto"} · {formatMoney(p.total ?? 0)}
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
              {sortedMovements.length === 0 && (
                <div className="text-muted-foreground">No hay movimientos.</div>
              )}
              {sortedMovements.map((m) => (
                <div key={m._id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div>
                    <div className="font-medium">
                      {m.type === "opening"
                        ? "Apertura de base"
                        : m.type === "fund"
                        ? "Entrega"
                        : m.type === "expense"
                        ? "Gasto"
                        : m.type === "reset"
                        ? "Reset"
                        : "Ajuste"}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.notes ?? ""}</div>
                  </div>
                  <div
                    className={
                      m.type === "opening"
                        ? "text-blue-700"
                        : m.amount >= 0
                        ? "text-green-700"
                        : "text-red-600"
                    }
                  >
                    {formatMoney(m.amount)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cierres pendientes (aprobación admin)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {visiblePendingClosings.length === 0 && (
                <div className="text-muted-foreground">
                  {buyerId
                    ? "No hay cierres pendientes para este comprador."
                    : "No hay cierres pendientes."}
                </div>
              )}

              {visiblePendingClosings.map((closing) => (
                <div
                  key={closing._id}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="grid gap-2">
                    <div className="font-medium">
                      {closing.buyerName} ·{" "}
                      {closing.lotNumber ? `Lote ${lotCode(closing.lotNumber)}` : "Lote -"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fecha cierre: {closing.date} · Compras: {closing.purchaseIds.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total pagado: {formatMoney(closing.totalPaid)} · Comisión:{" "}
                      {formatMoney(closing.totalCommission)} · Total: {formatMoney(closing.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Aprobadas: {closing.approvedCount ?? 0} · Pendientes: {closing.pendingCount ?? 0}
                    </div>
                    <div className="mt-1 grid gap-2 rounded-md border bg-muted/20 p-2">
                      {(closing.purchases ?? []).map((purchase) => {
                        const isApproved = !!purchase.approvedAt;
                        const checked =
                          isApproved || (selectedApprovals[closing._id] ?? []).includes(purchase._id);
                        const pmrValueInput =
                          pmrValues[purchase._id] ??
                          (purchase.pmrCatalogValue ? String(purchase.pmrCatalogValue) : "");

                        return (
                          <label
                            key={purchase._id}
                            className={`flex items-start gap-2 rounded px-2 py-1 text-xs ${
                              isApproved ? "bg-emerald-50 text-emerald-800" : "hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              disabled={isApproved || approvingClosingId === closing._id}
                              onChange={() =>
                                togglePurchaseSelection(
                                  closing._id as Id<"dayClosings">,
                                  purchase._id as Id<"purchases">
                                )
                              }
                            />
                            <div className="grid flex-1 gap-1">
                              <span>
                                {purchase.clientName} ·{" "}
                                {purchase.type === "pieza"
                                  ? `Pieza ${purchase.brand}${purchase.model ? ` ${purchase.model}` : ""}`
                                  : `Suelto ${purchase.grams ?? 0}g`}
                                {" · "}
                                {formatMoney(purchase.total ?? 0)}
                                {isApproved ? " · Aprobada" : ""}
                              </span>
                              {dbUser.tenantKey === "pa" ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground">PMR value</span>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    className="h-7 w-32 text-xs"
                                    placeholder="USD"
                                    value={pmrValueInput}
                                    disabled={isApproved || approvingClosingId === closing._id}
                                    onChange={(e) =>
                                      setPmrValues((prev) => ({
                                        ...prev,
                                        [purchase._id]: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const pendingIds = (closing.purchases ?? [])
                          .filter((purchase) => !purchase.approvedAt)
                          .map((purchase) => purchase._id as string);
                        setSelectedApprovals((prev) => ({ ...prev, [closing._id]: pendingIds }));
                      }}
                      disabled={approvingClosingId === closing._id}
                    >
                      Seleccionar pendientes
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#234c4b] text-white hover:bg-[#1e3f3e] md:w-auto"
                      onClick={() => handleApproveClosing(closing._id)}
                      disabled={
                        approvingClosingId === closing._id ||
                        (selectedApprovals[closing._id]?.length ?? 0) === 0
                      }
                    >
                      {approvingClosingId === closing._id
                        ? "Aprobando..."
                        : `Aprobar seleccionadas (${selectedApprovals[closing._id]?.length ?? 0})`}
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
