"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import type { Id } from "@convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminDashboard() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const buyers = useQuery(api.users.listBuyers) ?? [];
  const [selectedBuyerId, setSelectedBuyerId] = useState<Id<"users"> | null>(null);

  const buyerId: Id<"users"> | null = selectedBuyerId ?? buyers[0]?._id ?? null;

  const balance = useQuery(api.cashMovements.getBalanceByBuyer, buyerId ? { buyerId } : "skip");
  const movements = useQuery(api.cashMovements.listByBuyer, buyerId ? { buyerId } : "skip") ?? [];
  const latest = useQuery(api.purchases.listLatestByBuyer, buyerId ? { buyerId, limit: 5 } : "skip") ?? [];

  const addMovement = useMutation(api.cashMovements.addMovement);

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFund = async (type: "fund" | "adjustment") => {
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

  const buyerName = buyers.find((b) => b._id === buyerId)?.name ?? "Comprador";

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Administrador</h1>
      <p className="text-foreground-accent mt-2">
        Control de saldos, movimientos y compras por comprador.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar compradores */}
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
                onClick={() => setSelectedBuyerId(b._id)}
              >
                {b.name}
              </button>
            ))}
            {buyers.length === 0 && (
              <div className="text-sm text-muted-foreground">No hay compradores.</div>
            )}
          </CardContent>
        </Card>

        {/* Panel derecho */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldo de {buyerName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div>Fondos entregados: {formatCop(balance?.totalFunds ?? 0)}</div>
              <div>Gastado (pagado + comisión): {formatCop(balance?.totalSpent ?? 0)}</div>
              <div className="text-lg font-semibold">Saldo actual: {formatCop(balance?.balance ?? 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrar movimiento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Monto (ej: 2000000 o -500000)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                  onClick={() => handleFund("fund")}
                  disabled={loading}
                >
                  Agregar fondos
                </Button>
                <Button variant="outline" onClick={() => handleFund("adjustment")} disabled={loading}>
                  Ajuste
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas 5 compras</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {latest.length === 0 && (
                <div className="text-sm text-muted-foreground">No hay compras recientes.</div>
              )}
              {latest.map((p) => (
                <div key={p._id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photoUrl} alt="Compra" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{p.brand}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.type === "pieza" ? "Pieza completa" : "Material suelto"} · {formatCop(p.total ?? 0)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Movimientos de caja</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {movements.length === 0 && (
                <div className="text-muted-foreground">No hay movimientos.</div>
              )}
              {movements.map((m) => (
                <div key={m._id} className="flex justify-between border-b pb-2 last:border-b-0">
                  <div>
                    <div className="font-medium">{m.type === "fund" ? "Entrega" : "Ajuste"}</div>
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
