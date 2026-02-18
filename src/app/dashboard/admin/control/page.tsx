"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function ControlAreaPage() {
  const activeLot = useQuery(api.lots.getActiveLot);

  const lotStats = useQuery(
    api.purchases.getLotStats,
    activeLot?._id ? { lotId: activeLot._id } : "skip"
  );

  const supplierStats = useQuery(api.supplierPurchases.getGlobalStats, {});
  const supplierFunds = useQuery(api.supplierMovements.getGlobalFundsStats, {});

  const totalPieces = (lotStats?.totalPieces ?? 0) + (supplierStats?.totalPieces ?? 0);
  const totalGrams = (lotStats?.totalGrams ?? 0) + (supplierStats?.totalGrams ?? 0);
  const totalKilos = totalGrams / 1000;
  const totalInvested = (lotStats?.totalInvested ?? 0) + (supplierStats?.totalPaid ?? 0);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Área de control</h1>
      <p className="text-foreground-accent mt-2">
        Resumen combinado de lote y proveedores.
      </p>

      {!activeLot?._id && (
        <Card className="mt-6">
          <CardContent className="py-6 text-sm text-muted-foreground">
            No hay lote activo en este momento.
          </CardContent>
        </Card>
      )}

      {activeLot?._id && (
        <>
          <div className="mt-6 text-sm text-muted-foreground">
            Lote activo: <span className="font-medium text-foreground">#{activeLot.number}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Compras lote</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {lotStats?.totalPurchases ?? 0}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Ingresos proveedores</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {supplierStats?.totalEntries ?? 0}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Piezas (total)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{totalPieces}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Gramos (total)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {totalGrams.toLocaleString("es-CO")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Kilos (total)</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {totalKilos.toLocaleString("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Invertido total</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCop(totalInvested)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Base entregada proveedores</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCop(supplierFunds?.totalPositive ?? 0)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Saldo neto proveedores</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCop(supplierFunds?.net ?? 0)}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
