"use client";

import { useMemo, useState } from "react";

type PmrClientCard = {
  _id: string;
  name: string;
  contactName?: string;
  buyerName: string;
  phone?: string;
  photoUrl?: string | null;
  createdAt: number;
};

export default function PmrClientsSection({
  clients,
}: {
  clients: PmrClientCard[];
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleClients = useMemo(
    () => (expanded ? clients : clients.slice(0, 3)),
    [clients, expanded]
  );

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#234c4b]">Added Clients (Panama)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest registered clients with buyer attribution.
          </p>
        </div>
        {clients.length > 3 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-sm font-medium text-[#234c4b] underline-offset-4 hover:underline"
          >
            {expanded ? "Show less" : "View more"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleClients.map((client) => (
          <article
            key={client._id}
            className="flex items-start gap-3 rounded-xl border p-3"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-slate-100">
              {client.photoUrl ? (
                <img
                  src={client.photoUrl}
                  alt={client.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{client.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {client.contactName || "No contact"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Buyer: {client.buyerName}</p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date(client.createdAt).toLocaleDateString("en-US")}
              </p>
            </div>
          </article>
        ))}

        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clients registered yet.</p>
        ) : null}
      </div>
    </section>
  );
}
