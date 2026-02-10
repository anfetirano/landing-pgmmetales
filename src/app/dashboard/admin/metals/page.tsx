"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MetalsPage() {
  const [prices, setPrices] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch("/api/kitco/latest")
      .then((r) => r.json())
      .then((data) => {
        const list = data?.PreciousMetals?.PM ?? [];
        const map: Record<string, any> = {};
        list.forEach((m: any) => {
          map[m.Symbol] = m;
        });
        setPrices(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Precios metales</h1>
      <p className="text-foreground-accent mt-2">
        Valores actuales desde Kitco (prueba).
      </p>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Precios actuales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Oro (AU)</div>
              <div className="text-xl font-semibold">{prices.AU?.current_bid ?? "-"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Plata (AG)</div>
              <div className="text-xl font-semibold">{prices.AG?.current_bid ?? "-"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Platino (PT)</div>
              <div className="text-xl font-semibold">{prices.PT?.current_bid ?? "-"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Paladio (PD)</div>
              <div className="text-xl font-semibold">{prices.PD?.current_bid ?? "-"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-muted-foreground">Rodio (RH)</div>
              <div className="text-xl font-semibold">{prices.RH?.current_bid ?? "-"}</div>
            </div>
          </CardContent>
        </Card>

        <a
          href="https://www.kitco.com/price/precious-metals"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center rounded-md bg-[#234c4b] px-4 py-2 text-white hover:bg-[#1e3f3e]"
        >
          Ver más precios en Kitco
        </a>
      </div>
    </div>
  );
}
