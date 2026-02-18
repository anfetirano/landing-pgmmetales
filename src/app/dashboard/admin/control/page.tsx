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
  const stats = useQuery(
    api.purchases.getLotStats,
    activeLot?._id ? { lotId: activeLot._id } : "skip"
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Área de control</h1>
      <p className="text-foreground-accent mt-2">
        Resumen del lote actual.
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

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Total compras</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {stats?.totalPurchases ?? 0}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Piezas</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {stats?.totalPieces ?? 0}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Gramos</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {(stats?.totalGrams ?? 0).toLocaleString("es-CO")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Kilos</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {(stats?.totalKilos ?? 0).toLocaleString("es-CO", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 3,
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Invertido</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCop(stats?.totalInvested ?? 0)}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
