"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyByTenant } from "@/lib/currency";

export default function DashboardHome() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);
  const buyerId = dbUser?.role === "buyer" ? dbUser._id : undefined;
  const hasBuyerExpenses =
    dbUser?.role === "buyer" &&
    dbUser?.tenantKey === "pa" &&
    Array.isArray(dbUser?.features) &&
    dbUser.features.includes("buyer_expenses");

  const purchases =
    useQuery(api.purchases.listOpenByBuyer, buyerId ? { buyerId } : "skip") ?? [];

  const balance = useQuery(
    api.cashMovements.getBalanceByBuyer,
    buyerId ? { buyerId } : "skip"
  );
  const expenseSummary = useQuery(
    api.buyerExpenses.getExpenseSummaryByBuyer,
    buyerId && hasBuyerExpenses ? { buyerId, viewerId: buyerId } : "skip"
  );

  const summary = useMemo(() => {
    const totalPaid = purchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = purchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalGrams = purchases.reduce((s, p) => s + (p.grams ?? 0), 0);
    const totalPurchases = purchases.length;
    return { totalPaid, totalCommission, totalGrams, totalPurchases };
  }, [purchases]);

  const latest = useMemo(
    () =>
      [...purchases]
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        .slice(0, 5),
    [purchases]
  );

  // Admin: esta ruta no muestra datos (se redirige desde layout a /dashboard/admin/control)
  if (dbUser?.role === "admin") {
    return <div className="max-w-5xl" />;
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Dashboard</h1>
      <p className="text-foreground-accent mt-2">
        Resumen de compras pendientes, últimas compras y saldo operativo.
      </p>

      {/* Tarjetas de dinero (base/saldo) */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Base asignada</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(balance?.totalFunds ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Gastado aprobado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(balance?.totalSpent ?? 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo disponible</CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-semibold ${
              (balance?.balance ?? 0) >= 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {formatMoney(balance?.balance ?? 0)}
          </CardContent>
        </Card>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Pendiente por aprobar: {formatMoney(balance?.pendingSpent ?? 0)}
      </div>
      {hasBuyerExpenses ? (
        <div className="mt-2 text-xs text-muted-foreground">
          Gastos operativos del lote activo: {formatMoney(balance?.totalExpenses ?? 0)}
        </div>
      ) : null}

      {/* Tarjetas de resumen de compras */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total compras</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalPurchases}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total pagado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(summary.totalPaid)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total comisiones</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(summary.totalCommission)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total gramos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalGrams}</CardContent>
        </Card>
      </div>

      {hasBuyerExpenses ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#234c4b]">Gastos operativos</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Total gastos lote activo</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-red-600">
                {formatMoney(expenseSummary?.totalExpenses ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Cantidad de gastos</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {expenseSummary?.expenseCount ?? 0}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Lote activo</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {expenseSummary?.activeLotNumber ?? "-"}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4">
            {(expenseSummary?.latestExpenses ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay gastos registrados.</p>
            ) : (
              (expenseSummary?.latestExpenses ?? []).map((expense) => (
                <Card key={expense._id}>
                  <CardContent className="flex items-center gap-4 p-4">
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
                        {expense.category} — {expense.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(expense.createdAt).toLocaleDateString("es-PA")}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-red-600">
                      {formatMoney(expense.amount ?? 0)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#234c4b]">Últimas 5 compras</h2>
        <div className="mt-3 grid gap-4">
          {latest.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay compras pendientes.</p>
          )}
          {latest.map((p) => (
            <Card key={p._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="Compra" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {p.type === "pieza" ? "Pieza completa" : "Material suelto"} — {p.brand}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.model ? `Modelo: ${p.model} · ` : ""}
                    {p.grams ? `Gramos: ${p.grams} · ` : ""}
                    {formatMoney(p.pricePaid)} + {formatMoney(p.commission)}
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatMoney(p.total ?? 0)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
