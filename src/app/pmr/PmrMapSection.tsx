"use client";

import dynamic from "next/dynamic";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), { ssr: false });

type MapClient = {
  _id: string;
  name: string;
  contactName?: string;
  buyerName?: string;
  phone?: string;
  lat?: number;
  lng?: number;
};

export default function PmrMapSection({ clients }: { clients: MapClient[] }) {
  return <ClientsMap clients={clients} tenantKey="pa" />;
}
