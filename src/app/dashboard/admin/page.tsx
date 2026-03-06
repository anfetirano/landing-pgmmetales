"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@convex/_generated/dataModel";
import { Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminDashboardPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const adminArgs = dbUser && dbUser.role === "admin" ? { adminId: dbUser._id } : "skip";

  const buyers = useQuery(api.users.listBuyers, adminArgs) ?? [];
  const [selectedBuyerId, setSelectedBuyerId] = useState<Id<"users"> | null>(null);
  const [showAllPurchases, setShowAllPurchases] = useState(false);

  const buyerId: Id<"users"> | null = selectedBuyerId ?? buyers[0]?._id ?? null;

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

  const addMovement = useMutation(api.cashMovements.addMovement);
  const openBase = useMutation(api.cashMovements.openBase);
  const deletePurchaseAsAdmin = useMutation(api.purchases.deletePurchaseAsAdmin);
  const receiveClosing = useMutation(api.closings.receiveClosing);

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<string | null>(null);
  const [approvingClosingId, setApprovingClosingId] = useState<string | null>(null);

  const sortedMovements = useMemo(
    () => [...movements].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [movements]
  );

  const purchaseList = showAllPurchases ? allPurchases : latest;
  const buyerName = buyers.find((b) => b._id === buyerId)?.name ?? "Comprador";

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
      `Se abrirá una NUEVA base para ${selectedBuyerName} por ${formatCop(
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

  const handleApproveClosing = async (closingId: Id<"dayClosings">) => {
    if (!dbUser) return alert("Usuario no registrado.");
    const ok = confirm("¿Aprobar este cierre?");
    if (!ok) return;

    setApprovingClosingId(closingId);
    try {
      await receiveClosing({
        closingId,
        adminId: dbUser._id,
      });
      alert("Cierre aprobado.");
    } catch (e) {
      console.error(e);
      alert("Error aprobando cierre.");
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
              <div>Base + movimientos desde última apertura: {formatCop(balance?.totalFunds ?? 0)}</div>
              <div>
                Gastado aprobado (pagado + comisión): {formatCop(balance?.totalSpent ?? 0)}
              </div>
              <div>Pendiente por aprobar: {formatCop(balance?.pendingSpent ?? 0)}</div>
              <div className="text-lg font-semibold">Saldo actual: {formatCop(balance?.balance ?? 0)}</div>
            </CardContent>
          </Card>

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
                      {p.type === "pieza" ? "Pieza completa" : "Material suelto"} · {formatCop(p.total ?? 0)}
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
                    {formatCop(m.amount)}
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
              {pendingClosings.length === 0 && (
                <div className="text-muted-foreground">No hay cierres pendientes.</div>
              )}

              {pendingClosings.map((closing) => (
                <div
                  key={closing._id}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="grid gap-1">
                    <div className="font-medium">
                      {closing.buyerName} · Lote #{closing.lotNumber ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fecha cierre: {closing.date} · Compras: {closing.purchaseIds.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total pagado: {formatCop(closing.totalPaid)} · Comisión:{" "}
                      {formatCop(closing.totalCommission)} · Total: {formatCop(closing.totalAmount)}
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="bg-[#234c4b] text-white hover:bg-[#1e3f3e] md:w-auto"
                    onClick={() => handleApproveClosing(closing._id)}
                    disabled={approvingClosingId === closing._id}
                  >
                    {approvingClosingId === closing._id ? "Aprobando..." : "Aprobar cierre"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
