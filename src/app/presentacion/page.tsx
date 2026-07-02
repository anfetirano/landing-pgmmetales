import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

import PresentationDeck from "@/components/presentacion/PresentationDeck";
import type { DemoMapClient } from "@/data/presentacion";

export const metadata: Metadata = {
  title: "PMG Metales Panama | Presentacion",
  description:
    "Presentacion corporativa fullscreen para proveedores internacionales de PMG Metales Panama.",
};

export const dynamic = "force-dynamic";

export default async function PresentacionPage() {
  const report = await fetchQuery(api.pmr.getPanamaControlData, {});
  const liveMapClients: DemoMapClient[] = report.mapClients.reduce<DemoMapClient[]>(
    (acc, client) => {
      if (typeof client.lat !== "number" || typeof client.lng !== "number") {
        return acc;
      }

      acc.push({
        _id: String(client._id),
        name: client.name,
        contactName: client.contactName,
        buyerName: client.buyerName,
        phone: client.phone,
        zone: client.zone,
        lat: client.lat,
        lng: client.lng,
      });

      return acc;
    },
    []
  );

  return <PresentationDeck liveMapClients={liveMapClients} />;
}
