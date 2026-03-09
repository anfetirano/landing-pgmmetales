"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { formatMoneyByTenant } from "@/lib/currency";
import { formatLotCode } from "@/lib/lots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClienteSheetPage() {
  const { user } = useUser();
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId as Id<"clients"> | undefined;

  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const sheet = useQuery(
    api.purchases.getClientSheetByBuyer,
    dbUser?._id && clientId ? { buyerId: dbUser._id, clientId } : "skip"
  );

  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);
  const lotCode = (number: number) => formatLotCode(number, dbUser?.tenantKey);
  const lotGroups = useMemo(() => {
    if (!sheet) return [];

    type PurchaseRow = (typeof sheet.purchases)[number];
    type LotGroup = {
      key: string;
      lotNumber: number | null;
      purchases: PurchaseRow[];
      totalAmount: number;
      totalPaid: number;
      totalCommission: number;
      totalGrams: number;
      totalPieces: number;
    };

    const map = new Map<string, LotGroup>();

    for (const purchase of sheet.purchases) {
      const key = purchase.lotNumber != null ? String(purchase.lotNumber) : "sin-lote";
      if (!map.has(key)) {
        map.set(key, {
          key,
          lotNumber: purchase.lotNumber ?? null,
          purchases: [],
          totalAmount: 0,
          totalPaid: 0,
          totalCommission: 0,
          totalGrams: 0,
          totalPieces: 0,
        });
      }

      const group = map.get(key)!;
      group.purchases.push(purchase);
      group.totalPaid += purchase.pricePaid ?? 0;
      group.totalCommission += purchase.commission ?? 0;
      group.totalAmount += purchase.total ?? 0;
      group.totalGrams += purchase.grams ?? 0;
      if (purchase.type === "pieza") group.totalPieces += 1;
    }

    return [...map.values()].sort((a, b) => {
      const av = a.lotNumber ?? -1;
      const bv = b.lotNumber ?? -1;
      return bv - av;
    });
  }, [sheet]);

  if (!dbUser) {
    return <div className="max-w-5xl">Cargando...</div>;
  }

  if (dbUser.role !== "buyer") {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Hoja del cliente</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="max-w-5xl grid gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#234c4b]">Hoja del cliente</h1>
          <p className="text-foreground-accent mt-2">
            Historial completo de compras y resumen acumulado.
          </p>
        </div>
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Cargando información...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#234c4b]">Hoja del cliente</h1>
          <p className="text-foreground-accent mt-2">
            Historial completo de compras y resumen acumulado.
          </p>
        </div>
        <Link href="/dashboard/clientes">
          <Button type="button" variant="outline">Volver a clientes</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{sheet.client.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>Contacto: {sheet.client.contactName ?? "-"}</div>
          <div>Cédula: {sheet.client.cedula ?? "-"}</div>
          <div>WhatsApp: {sheet.client.phone ?? "-"}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Compras totales</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{sheet.summary.totalPurchases}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total pagado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(sheet.summary.totalPaid)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total comisión</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(sheet.summary.totalCommission)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total vendido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(sheet.summary.totalAmount)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Piezas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{sheet.summary.totalPieces}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Gramos acumulados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{sheet.summary.totalGrams}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen por lote</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {lotGroups.length === 0 && (
            <div className="text-muted-foreground">Sin compras registradas por lote.</div>
          )}
          {lotGroups.map((group) => (
            <div key={group.key} className="rounded-md border p-3">
              <div className="font-medium">
                {group.lotNumber != null ? `Lote ${lotCode(group.lotNumber)}` : "Sin lote"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Compras: {group.purchases.length} · Piezas: {group.totalPieces} · Gramos: {group.totalGrams}
              </div>
              <div className="text-xs text-muted-foreground">
                Pagado: {formatMoney(group.totalPaid)} · Comisión: {formatMoney(group.totalCommission)} · Total: {formatMoney(group.totalAmount)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de compras por lote</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {sheet.purchases.length === 0 && (
            <div className="text-sm text-muted-foreground">Este cliente aún no tiene compras.</div>
          )}

          {lotGroups.map((group) => (
            <div key={`hist-${group.key}`} className="rounded-md border p-3">
              <div className="mb-2 font-medium">
                {group.lotNumber != null ? `Lote ${lotCode(group.lotNumber)}` : "Sin lote"}
              </div>

              <div className="grid gap-3">
                {group.purchases.map((purchase) => (
                  <div
                    key={purchase._id}
                    className="flex items-center gap-3 border-b pb-2 text-sm last:border-b-0"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                      {purchase.photoUrl ? (
                        <img src={purchase.photoUrl} alt="Compra" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {purchase.type === "pieza"
                          ? `Pieza ${purchase.brand}${purchase.model ? ` ${purchase.model}` : ""}`
                          : `Suelto ${purchase.grams ?? 0}g · ${purchase.brand}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString("es-CO")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pagado: {formatMoney(purchase.pricePaid)} · Comisión: {formatMoney(purchase.commission)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{formatMoney(purchase.total ?? 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
