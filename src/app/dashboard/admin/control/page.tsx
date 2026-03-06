"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatCop = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function ControlAreaPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const activeLot = useQuery(api.lots.getActiveLot);
  const lots = useQuery(api.lots.listAllLots) ?? [];
  const closeAndOpenNextLot = useMutation(api.lots.closeAndOpenNextLot);
  const [selectedLotId, setSelectedLotId] = useState<Id<"lots"> | null>(null);
  const [closing, setClosing] = useState(false);
  const closeLockRef = useRef(false);

  useEffect(() => {
    if (!selectedLotId && activeLot?._id) {
      setSelectedLotId(activeLot._id);
    }
  }, [selectedLotId, activeLot?._id]);

  const viewingLotId = selectedLotId ?? activeLot?._id ?? null;
  const selectedLot = lots.find((l) => l._id === viewingLotId) ?? null;

  const lotStats = useQuery(
    api.purchases.getLotStats,
    viewingLotId ? { lotId: viewingLotId } : "skip"
  );

  const supplierStats = useQuery(
    api.supplierPurchases.getGlobalStats,
    viewingLotId ? { lotId: viewingLotId } : "skip"
  );
  const supplierFunds = useQuery(
    api.supplierMovements.getGlobalFundsStats,
    viewingLotId ? { lotId: viewingLotId } : "skip"
  );

  const totalPieces = (lotStats?.totalPieces ?? 0) + (supplierStats?.totalPieces ?? 0);
  const totalGrams = (lotStats?.totalGrams ?? 0) + (supplierStats?.totalGrams ?? 0);
  const totalKilos = totalGrams / 1000;
  const totalInvested = (lotStats?.totalInvested ?? 0) + (supplierStats?.totalPaid ?? 0);

  const handleCloseAndOpen = async () => {
    if (closeLockRef.current || closing) return;

    if (!dbUser || dbUser.role !== "admin") {
      alert("No autorizado.");
      return;
    }
    if (!activeLot?._id) {
      alert("No hay lote activo.");
      return;
    }

    const ok = confirm(
      `¿Está seguro que desea cerrar el lote #${activeLot.number} y abrir el lote #${activeLot.number + 1}?`
    );
    if (!ok) return;

    closeLockRef.current = true;
    setClosing(true);
    try {
      const result = await closeAndOpenNextLot({
        currentLotId: activeLot._id,
        adminId: dbUser._id,
      });
      setSelectedLotId(result.newLotId);
      alert(`Listo. Nuevo lote activo: #${result.nextNumber}`);
    } catch (e) {
      console.error(e);
      alert("Error cerrando y abriendo lote.");
    } finally {
      setClosing(false);
      closeLockRef.current = false;
    }
  };

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
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="text-sm text-muted-foreground">
              Lote activo: <span className="font-medium text-foreground">#{activeLot.number}</span>
            </div>
            <Button
              type="button"
              className="h-11 px-6 text-base bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCloseAndOpen}
              disabled={closing}
            >
              {closing
                ? "Cerrando y abriendo lote..."
                : `Cerrar lote #${activeLot.number} y abrir #${activeLot.number + 1}`}
            </Button>
          </div>

          <div className="mt-4 max-w-sm">
            <label className="mb-2 block text-sm font-medium">Ver lote</label>
            <Select
              value={selectedLotId ?? ""}
              onValueChange={(v) => setSelectedLotId(v as Id<"lots">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un lote" />
              </SelectTrigger>
              <SelectContent>
                {lots.map((lot) => (
                  <SelectItem key={lot._id} value={lot._id}>
                    {`Lote #${lot.number} (${lot.status === "open" ? "Activo" : "Cerrado"})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Viendo:{" "}
            <span className="font-medium text-foreground">
              {selectedLot ? `#${selectedLot.number}` : "Sin lote"}
            </span>
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
                <CardTitle className="text-sm text-muted-foreground">Por cobrar proveedores</CardTitle>
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
