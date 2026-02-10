"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    value
  );

export default function DashboardHome() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const { startOfDay, endOfDay } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { startOfDay: start.getTime(), endOfDay: end.getTime() };
  }, []);

  const purchases =
    useQuery(
      api.purchases.listByBuyerAndDate,
      dbUser?._id
        ? { buyerId: dbUser._id, dateFrom: startOfDay, dateTo: endOfDay }
        : "skip"
    ) ?? [];

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

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Dashboard</h1>
      <p className="text-foreground-accent mt-2">
        Resumen del día y últimas compras registradas.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <CardContent className="text-2xl font-semibold">{formatCop(summary.totalPaid)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total comisiones</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCop(summary.totalCommission)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total gramos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalGrams}</CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#234c4b]">Últimas 5 compras</h2>
        <div className="mt-3 grid gap-4">
          {latest.length === 0 && (
            <p className="text-sm text-muted-foreground">Todavía no hay compras hoy.</p>
          )}
          {latest.map((p) => (
            <Card key={p._id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                    {formatCop(p.pricePaid)} + {formatCop(p.commission)}
                  </div>
                </div>
                <div className="text-sm font-semibold">{formatCop(p.total ?? 0)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
