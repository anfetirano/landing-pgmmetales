"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoneyByTenant } from "@/lib/currency";
import { formatLotCode } from "@/lib/lots";

export default function ControlAreaPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);
  const lotCode = (number: number) => formatLotCode(number, dbUser?.tenantKey);
  const tenantArgs = dbUser ? { tenantKey: dbUser.tenantKey ?? "co" } : "skip";

  const activeLot = useQuery(api.lots.getActiveLot, tenantArgs);
  const lots = useQuery(api.lots.listAllLots, tenantArgs) ?? [];
  const createLot = useMutation(api.lots.createLot);
  const closeAndOpenNextLot = useMutation(api.lots.closeAndOpenNextLot);
  const [selectedLotId, setSelectedLotId] = useState<Id<"lots"> | null>(null);
  const [closing, setClosing] = useState(false);
  const [openingFirstLot, setOpeningFirstLot] = useState(false);
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
    viewingLotId && dbUser?.role === "admin"
      ? { lotId: viewingLotId, adminId: dbUser._id }
      : "skip"
  );
  const supplierFunds = useQuery(
    api.supplierMovements.getGlobalFundsStats,
    viewingLotId && dbUser?.role === "admin"
      ? { lotId: viewingLotId, adminId: dbUser._id }
      : "skip"
  );

  const totalPieces = (lotStats?.totalPieces ?? 0) + (supplierStats?.totalPieces ?? 0);
  const totalGrams = (lotStats?.totalGrams ?? 0) + (supplierStats?.totalGrams ?? 0);
  const totalKilos = totalGrams / 1000;
  const totalInvested = (lotStats?.totalInvested ?? 0) + (supplierStats?.totalPaid ?? 0);

  const handleOpenFirstLot = async () => {
    if (!dbUser || dbUser.role !== "admin") {
      alert("No autorizado.");
      return;
    }
    if (openingFirstLot) return;

    const nextNumber = (lots[0]?.number ?? 0) + 1;
    setOpeningFirstLot(true);
    try {
      const lotId = await createLot({
        adminId: dbUser._id,
        number: nextNumber,
        notes: "Apertura inicial",
      });
      setSelectedLotId(lotId);
      alert(`Lote ${lotCode(nextNumber)} abierto.`);
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el lote.");
    } finally {
      setOpeningFirstLot(false);
    }
  };

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
      `¿Está seguro que desea cerrar el lote ${lotCode(activeLot.number)} y abrir el lote ${lotCode(activeLot.number + 1)}?`
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
      alert(`Listo. Nuevo lote activo: ${lotCode(result.nextNumber)}`);
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
          <CardContent className="py-6 text-sm text-muted-foreground grid gap-3">
            <div>No hay lote activo en este momento.</div>
            {dbUser?.role === "admin" && (
              <Button
                type="button"
                className="w-fit bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                onClick={handleOpenFirstLot}
                disabled={openingFirstLot}
              >
                {openingFirstLot
                  ? "Abriendo lote..."
                  : `Abrir lote ${lotCode((lots[0]?.number ?? 0) + 1)}`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {activeLot?._id && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="text-sm text-muted-foreground">
              Lote activo: <span className="font-medium text-foreground">{lotCode(activeLot.number)}</span>
            </div>
            <Button
              type="button"
              className="h-11 px-6 text-base bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCloseAndOpen}
              disabled={closing}
            >
              {closing
                ? "Cerrando y abriendo lote..."
                : `Cerrar lote ${lotCode(activeLot.number)} y abrir ${lotCode(activeLot.number + 1)}`}
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
                    {`Lote ${lotCode(lot.number)} (${lot.status === "open" ? "Activo" : "Cerrado"})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Viendo:{" "}
            <span className="font-medium text-foreground">
              {selectedLot ? lotCode(selectedLot.number) : "Sin lote"}
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
                {formatMoney(totalInvested)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Por cobrar proveedores</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(supplierFunds?.totalPositive ?? 0)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Saldo neto proveedores</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatMoney(supplierFunds?.net ?? 0)}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
