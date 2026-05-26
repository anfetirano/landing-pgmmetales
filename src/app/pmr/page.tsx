import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@convex/_generated/api";

import PmrMapSection from "./PmrMapSection";
import PmrLiveHeader from "./PmrLiveHeader";
import PmrClientsSection from "./PmrClientsSection";
import { formatMoneyByTenant } from "@/lib/currency";
import { formatLotCode } from "@/lib/lots";
import {
  PMR_COOKIE_NAME,
  createPmrSessionToken,
  isValidPmrPassword,
  isValidPmrSessionToken,
} from "@/lib/pmr-auth";

export const dynamic = "force-dynamic";
const PMR_INITIAL_CAPITAL_USD = 25000;
const PMR_INITIAL_CAPITAL_STATUS: "pending" | "received" = "received";
const PMR_DISPLAY_MARKUP_RATE = 0.2;
const PMR_DISPLAY_FIXED_ADJUSTMENT_USD = 1200;

async function loginPmr(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  if (!isValidPmrPassword(password)) {
    redirect("/pmr?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(PMR_COOKIE_NAME, createPmrSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/pmr");
}

async function logoutPmr() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(PMR_COOKIE_NAME);
  redirect("/pmr");
}

export default async function PmrPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const isAuthenticated = isValidPmrSessionToken(cookieStore.get(PMR_COOKIE_NAME)?.value);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e9f5f2] via-white to-[#f6faf9] px-4 py-14">
        <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#234c4b]">PMG Panama - PMR Control</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private access for Panama operational tracking.
          </p>

          <form action={loginPmr} className="mt-6 grid gap-3">
            <label className="text-sm font-medium" htmlFor="pmr-password">
              Password
            </label>
            <input
              id="pmr-password"
              name="password"
              type="password"
              required
              className="h-10 rounded-md border px-3 text-sm outline-none ring-[#234c4b] focus:ring-1"
              placeholder="Enter PMR access key"
            />
            {params.error ? (
              <p className="text-sm text-red-600">Incorrect password. Please try again.</p>
            ) : null}
            <button
              type="submit"
              className="mt-1 h-10 rounded-md bg-[#234c4b] text-sm font-semibold text-white hover:bg-[#1e3f3e]"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  const report = await fetchQuery(api.pmr.getPanamaControlData, {});
  const summary = report.summary;
  const pmrDisplayInvested =
    summary.totalInvested * (1 + PMR_DISPLAY_MARKUP_RATE) + PMR_DISPLAY_FIXED_ADJUSTMENT_USD;
  const remainingInitialCapital = PMR_INITIAL_CAPITAL_USD - pmrDisplayInvested;
  const initialLatestClients = report.clients.slice(0, 20).map((client) => ({
    _id: String(client._id),
    name: client.name,
    contactName: client.contactName,
    buyerName: client.buyerName,
    createdAt: client.createdAt,
  }));
  const mapClients = report.mapClients.map((client) => ({
    ...client,
    _id: String(client._id),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e9f5f2] via-white to-[#f6faf9] px-4 py-6 md:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#234c4b] md:text-3xl">PMR - Panama Control Area</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational and commercial growth view. Data isolated to Panama only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PmrLiveHeader initialLatestClients={initialLatestClients} />
          <p className="text-xs text-muted-foreground">
            Updated: {new Date(report.generatedAt).toLocaleString("en-US")}
          </p>
          <form action={logoutPmr}>
            <button
              type="submit"
              className="h-9 rounded-md border bg-white px-3 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-7xl grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total clients" value={`${summary.totalClients}`} />
        <StatCard label="Clients (30d)" value={`${summary.clientsAdded30d}`} />
        <StatCard label="Total purchases" value={`${summary.totalPurchases}`} />
        <StatCard label="Purchases (30d)" value={`${summary.purchases30d}`} />
        <StatCard
          label="Total ceramic (kg)"
          value={summary.totalLooseMaterialKilos.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          })}
        />
        <StatCard label="Active buyers" value={`${summary.buyersActive}`} />
      </div>

      <div className="mx-auto mt-3 grid w-full max-w-7xl grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          label={
            PMR_INITIAL_CAPITAL_STATUS === "pending"
              ? "Initial capital commitment (pending transfer)"
              : "Initial capital remaining"
          }
          value={formatMoneyByTenant(remainingInitialCapital, "pa")}
          tone={
            PMR_INITIAL_CAPITAL_STATUS === "pending"
              ? "pending"
              : remainingInitialCapital > 0
                ? "success"
                : "pending"
          }
        />
        <StatCard
          label="Total invested capital"
          value={formatMoneyByTenant(pmrDisplayInvested, "pa")}
        />
        <StatCard
          label="Total PMR deposits"
          value={formatMoneyByTenant(PMR_INITIAL_CAPITAL_USD, "pa")}
          tone={PMR_INITIAL_CAPITAL_STATUS === "pending" ? "pending" : "success"}
        />
      </div>
      <div className="mx-auto mt-3 grid w-full max-w-7xl grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          label="Total paid amount (field purchases)"
          value={formatMoneyByTenant(summary.totalPaidToClients, "pa")}
        />
        <StatCard
          label="Total PMR catalog value"
          value={formatMoneyByTenant(summary.totalPmrCatalogValue, "pa")}
        />
        <StatCard
          label="Purchases pending PMR value"
          value={`${summary.pendingPmrValuationCount}`}
          tone={summary.pendingPmrValuationCount > 0 ? "pending" : "success"}
        />
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr]">
        <PmrClientsSection
          clients={report.clients.map((client) => ({
            _id: String(client._id),
            name: client.name,
            contactName: client.contactName,
            buyerName: client.buyerName,
            phone: client.phone,
            photoUrl: client.photoUrl,
            createdAt: client.createdAt,
          }))}
        />

        <section className="flex flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm lg:h-[620px]">
          <h2 className="text-lg font-semibold text-[#234c4b]">Recent Purchases</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Purchase log with responsible buyer. Includes emergency and unlinked client records.
          </p>
          <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-2">
            {report.purchases.map((purchase) => (
              <article key={String(purchase._id)} className="rounded-xl border p-3">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-slate-100">
                    {purchase.photoUrl ? (
                      <img
                        src={purchase.photoUrl}
                        alt={`Purchase from ${purchase.clientName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{purchase.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          Recorded by: {purchase.buyerName}
                          {purchase.clientIsEmergency ? " · Emergency client" : ""}
                          {!purchase.clientRegistered ? " · Unlinked client record" : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[#234c4b]">
                        {formatMoneyByTenant(purchase.total ?? 0, "pa")}
                      </p>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {purchase.type === "pieza"
                        ? `Part ${purchase.brand}${purchase.model ? ` ${purchase.model}` : ""}`
                        : `Loose ${purchase.grams ?? 0}g - ${purchase.brand}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lot:{" "}
                      {purchase.lotNumber != null ? formatLotCode(purchase.lotNumber, "pa") : "No lot"}
                      {" · "}
                      {new Date(purchase.createdAt).toLocaleDateString("en-US")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid: {formatMoneyByTenant(purchase.pricePaid ?? 0, "pa")} · PMR value:{" "}
                      {typeof purchase.pmrCatalogValue === "number" && purchase.pmrCatalogValue > 0
                        ? formatMoneyByTenant(purchase.pmrCatalogValue, "pa")
                        : "Pending"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {report.purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchases registered yet.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mx-auto mt-6 w-full max-w-7xl rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#234c4b]">Client Growth Map (Panama)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Totals include all clients. The map displays clients with coordinates only.
        </p>
        <div className="mt-4">
          <PmrMapSection clients={mapClients} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "pending" | "success";
}) {
  const toneClass =
    tone === "pending"
      ? "border-slate-300 bg-slate-100"
      : tone === "success"
        ? "border-emerald-300 bg-emerald-50"
        : "border bg-white";

  return (
    <div className={`rounded-xl p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#234c4b] md:text-2xl">{value}</p>
    </div>
  );
}
