"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CierrePage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const purchases =
    useQuery(api.purchases.listOpenByBuyer, dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];

  const createClosing = useMutation(api.closings.createClosing);
  const deleteOpenPurchase = useMutation(api.purchases.deleteOpenPurchase);
  const activeLot = useQuery(api.lots.getActiveLot);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const totalPaid = purchases.reduce((s, p) => s + (p.pricePaid ?? 0), 0);
    const totalCommission = purchases.reduce((s, p) => s + (p.commission ?? 0), 0);
    const totalAmount = totalPaid + totalCommission;
    const totalGrams = purchases.reduce((s, p) => s + (p.grams ?? 0), 0);
    const piezas = purchases.filter((p) => p.type === "pieza").length;
    const suelto = purchases.filter((p) => p.type === "suelto").length;

    return { totalPaid, totalCommission, totalAmount, totalGrams, piezas, suelto };
  }, [purchases]);

  const handleDeletePurchase = async (purchaseId: Id<"purchases">) => {
    if (!dbUser) return alert("Usuario no registrado en el sistema.");

    const ok = confirm("¿Eliminar esta compra? Esta acción no se puede deshacer.");
    if (!ok) return;

    setDeletingId(purchaseId);
    try {
      await deleteOpenPurchase({
        purchaseId,
        buyerId: dbUser._id,
      });
      alert("Compra eliminada.");
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la compra.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseDay = async () => {
    if (!dbUser) {
      alert("Usuario no registrado en el sistema.");
      return;
    }
    if (!activeLot?._id) {
      alert("No hay lote activo.");
      return;
    }
    if (purchases.length === 0) {
      alert("No hay compras pendientes para cerrar.");
      return;
    }

    setLoading(true);
    try {
      await createClosing({
        buyerId: dbUser._id,
        lotId: activeLot._id,
        date: new Date().toISOString().slice(0, 10),
        purchaseIds: purchases.map((p) => p._id),
        totalPaid: totals.totalPaid,
        totalCommission: totals.totalCommission,
        totalAmount: totals.totalAmount,
      });
      alert("Cierre generado.");
    } catch (e) {
      console.error(e);
      alert("Error generando cierre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Cierre del día</h1>
      <p className="text-foreground-accent mt-2">
        Revisa compras pendientes y genera el cierre cuando corresponda.
      </p>

      <div className="mt-6 grid gap-4">
        {purchases.map((p) => (
          <Card key={p._id}>
            <CardContent className="py-4 flex gap-4 items-center">
              <div className="h-16 w-16 rounded-lg border border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Sin foto</span>
                )}
              </div>

              <div className="flex-1 text-sm text-foreground-accent grid gap-1">
                <div className="font-medium text-[#234c4b]">
                  {p.type === "pieza" ? "Pieza completa" : "Material suelto"} — {p.brand}
                </div>
                {p.model && <div>Modelo: {p.model}</div>}
                {p.grams ? <div>Gramos: {p.grams}</div> : null}
                <div>Pagado: ${p.pricePaid.toLocaleString("es-CO")}</div>
                <div>Comisión: ${p.commission.toLocaleString("es-CO")}</div>
                <div>Total: ${(p.total ?? 0).toLocaleString("es-CO")}</div>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDeletePurchase(p._id)}
                disabled={deletingId === p._id || loading}
              >
                {deletingId === p._id ? "Eliminando..." : "Eliminar"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-2 text-sm">
        <div>Piezas completas: {totals.piezas}</div>
        <div>Material suelto: {totals.suelto}</div>
        <div>Total gramos: {totals.totalGrams}</div>
        <div>Total pagado: ${totals.totalPaid.toLocaleString("es-CO")}</div>
        <div>Total comisiones: ${totals.totalCommission.toLocaleString("es-CO")}</div>
        <div>Total pendiente: ${totals.totalAmount.toLocaleString("es-CO")}</div>
      </div>

      <Button
        className="mt-6 bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
        onClick={handleCloseDay}
        disabled={loading}
      >
        {loading ? "Generando..." : "Cerrar compras pendientes"}
      </Button>
    </div>
  );
}
