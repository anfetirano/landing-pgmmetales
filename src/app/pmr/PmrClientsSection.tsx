"use client";

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
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm lg:h-[620px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#234c4b]">Added Clients (Panama)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest registered clients with buyer attribution.
          </p>
        </div>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
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
