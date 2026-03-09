"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FileText, Map, MessageCircle, Navigation, Pencil } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), { ssr: false });

export default function AdminClientsPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");

  const clients =
    useQuery(api.clients.listAllForAdmin, dbUser?._id ? { adminId: dbUser._id } : "skip") ?? [];
  const updateClientAsAdmin = useMutation(api.clients.updateClientAsAdmin);

  const clientsWithLocation = clients.filter(
    (c) => typeof c.lat === "number" && typeof c.lng === "number"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null);
  const [editingClientId, setEditingClientId] = useState<Id<"clients"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingContactName, setEditingContactName] = useState("");
  const [editingCedula, setEditingCedula] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const visibleClients = useMemo(() => {
    const sorted = [...clientsWithLocation].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    );

    const term = searchTerm.trim().toLowerCase();
    if (!term) return sorted;

    return sorted.filter((c) => {
      const text = [c.name, c.contactName, c.cedula, c.phone, c.buyerName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [clientsWithLocation, searchTerm]);

  const mapClients = useMemo(() => {
    if (!selectedClientId) return visibleClients;
    const selected = visibleClients.find((c) => c._id === selectedClientId);
    return selected ? [selected] : visibleClients;
  }, [visibleClients, selectedClientId]);

  useEffect(() => {
    if (!selectedClientId) return;
    const stillVisible = visibleClients.some((c) => c._id === selectedClientId);
    if (!stillVisible) setSelectedClientId(null);
  }, [selectedClientId, visibleClients]);

  const buildWazeUrl = (clientLat: number, clientLng: number) =>
    `https://waze.com/ul?ll=${clientLat},${clientLng}&navigate=yes`;
  const buildStreetViewUrl = (clientLat: number, clientLng: number) =>
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${clientLat},${clientLng}`;
  const buildWhatsAppUrl = (rawPhone: string) =>
    `https://wa.me/${rawPhone.replace(/\D/g, "")}`;

  const toggleSelectedClient = (clientId: Id<"clients">) => {
    setSelectedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const getBuyerTone = (buyerName?: string) => {
    const key = (buyerName ?? "").trim().toLowerCase();
    if (key.includes("marlen")) {
      return {
        cardBaseClass: "border-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.18)]",
        cardSelectedClass: "ring-2 ring-emerald-400/50 border-emerald-300 shadow-[0_12px_24px_rgba(16,185,129,0.28)]",
        rowBaseClass: "bg-emerald-50/35",
        rowSelectedClass: "bg-emerald-100/70",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    }
    if (key.includes("kenny")) {
      return {
        cardBaseClass: "border-rose-200 shadow-[0_8px_18px_rgba(239,68,68,0.18)]",
        cardSelectedClass: "ring-2 ring-rose-400/50 border-rose-300 shadow-[0_12px_24px_rgba(239,68,68,0.28)]",
        rowBaseClass: "bg-rose-50/35",
        rowSelectedClass: "bg-rose-100/70",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
      };
    }
    return {
      cardBaseClass: "",
      cardSelectedClass: "ring-2 ring-[#234c4b]/40 shadow-[0_10px_24px_rgba(35,76,75,0.22)]",
      rowBaseClass: "",
      rowSelectedClass: "bg-[#234c4b]/5",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    };
  };

  const startEditing = (client: (typeof visibleClients)[number]) => {
    setEditingClientId(client._id);
    setEditingName(client.name ?? "");
    setEditingContactName(client.contactName ?? "");
    setEditingCedula(client.cedula ?? "");
    setEditingPhone(client.phone ?? "");
  };

  const cancelEditing = () => {
    setEditingClientId(null);
    setEditingName("");
    setEditingContactName("");
    setEditingCedula("");
    setEditingPhone("");
  };

  const saveEditing = async () => {
    if (!dbUser) return alert("Usuario no registrado.");
    if (!editingClientId) return;
    if (!editingName.trim()) return alert("El nombre del cliente es obligatorio.");

    setSavingEdit(true);
    try {
      await updateClientAsAdmin({
        clientId: editingClientId,
        adminId: dbUser._id,
        name: editingName,
        contactName: editingContactName || undefined,
        cedula: editingCedula || undefined,
        phone: editingPhone || undefined,
      });
      cancelEditing();
      alert("Cliente actualizado.");
    } catch (e) {
      console.error(e);
      alert("Error actualizando cliente.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (dbUser.role !== "admin") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Clientes</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Clientes</h1>
      <p className="text-foreground-accent mt-2">
        Vista global de clientes registrados por todos los compradores.
      </p>

      <div className="mt-6 grid gap-6">
        <ClientsMap clients={mapClients} tenantKey={dbUser?.tenantKey} />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Buscar cliente</label>
          <Input
            placeholder="Nombre, contacto, cédula, WhatsApp o comprador"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {selectedClientId ? (
            <Button type="button" variant="outline" className="w-fit" onClick={() => setSelectedClientId(null)}>
              Ver todos en mapa
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 md:hidden">
          {visibleClients.length === 0 && (
            <div className="rounded-xl border bg-white px-4 py-4 text-sm text-muted-foreground">
              No hay clientes con ubicación guardada.
            </div>
          )}

          {visibleClients.map((c) => {
            const isEditing = editingClientId === c._id;
            const tone = getBuyerTone(c.buyerName);
            return (
              <Card
                key={c._id}
                onClick={() => toggleSelectedClient(c._id)}
                className={
                  selectedClientId === c._id
                    ? `cursor-pointer ${tone.cardSelectedClass}`
                    : `cursor-pointer ${tone.cardBaseClass}`
                }
              >
                <CardContent className="relative grid gap-2 p-4 pr-32 text-sm">
                <div className="absolute right-4 top-4 h-24 w-24 overflow-hidden rounded border bg-muted">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                  <div>
                    <span className="font-medium">Cliente:</span>{" "}
                    {isEditing ? (
                      <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      c.name
                    )}
                  </div>
                <div>
                  <span className="font-medium">Comprador:</span>{" "}
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs ${tone.badgeClass}`}>
                    {c.buyerName ?? "-"}
                  </span>
                </div>
                  <div>
                    <span className="font-medium">Contacto:</span>{" "}
                    {isEditing ? (
                      <Input value={editingContactName} onChange={(e) => setEditingContactName(e.target.value)} />
                    ) : (
                      c.contactName ?? "-"
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Cédula:</span>{" "}
                    {isEditing ? (
                      <Input value={editingCedula} onChange={(e) => setEditingCedula(e.target.value)} />
                    ) : (
                      c.cedula ?? "-"
                    )}
                  </div>
                  <div>
                    <span className="font-medium">WhatsApp:</span>{" "}
                    {isEditing ? (
                      <Input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} />
                    ) : (
                      c.phone ?? "-"
                    )}
                  </div>
                <div>
                  <span className="font-medium">Ubicación:</span>{" "}
                  {typeof c.lat === "number" && typeof c.lng === "number"
                    ? `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`
                    : "Sin ubicación"}
                </div>

                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                        onClick={saveEditing}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelEditing} disabled={savingEdit}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/dashboard/admin/clientes/${c._id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                        title="Ver hoja del cliente"
                        aria-label="Ver hoja del cliente"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => startEditing(c)}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <a
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                        href={buildWazeUrl(c.lat as number, c.lng as number)}
                        target="_blank"
                        rel="noreferrer"
                        title="Ir por el cliente"
                        aria-label="Ir por el cliente"
                      >
                        <Navigation className="h-4 w-4" />
                      </a>
                      <a
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                        href={buildStreetViewUrl(c.lat as number, c.lng as number)}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver calle 360"
                        aria-label="Ver calle 360"
                      >
                        <Map className="h-4 w-4" />
                      </a>
                      {c.phone ? (
                        <a
                          href={buildWhatsAppUrl(c.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                          title="Abrir WhatsApp"
                          aria-label="Abrir WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border bg-white md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Comprador</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={7}>
                    No hay clientes con ubicación guardada.
                  </td>
                </tr>
              )}
              {visibleClients.map((c) => {
                const isEditing = editingClientId === c._id;
                const tone = getBuyerTone(c.buyerName);
                return (
                  <tr
                    key={c._id}
                    onClick={() => toggleSelectedClient(c._id)}
                    className={
                      selectedClientId === c._id
                        ? `cursor-pointer border-t ${tone.rowSelectedClass}`
                        : `cursor-pointer border-t ${tone.rowBaseClass}`
                    }
                  >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                        {c.photoUrl ? <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" /> : null}
                      </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                          ) : (
                            c.name
                          )}
                        </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs ${tone.badgeClass}`}>
                      {c.buyerName ?? "-"}
                    </span>
                  </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input value={editingContactName} onChange={(e) => setEditingContactName(e.target.value)} />
                      ) : (
                        c.contactName ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Input value={editingCedula} onChange={(e) => setEditingCedula(e.target.value)} />
                      ) : (
                        c.cedula ?? "-"
                      )}
                    </td>
                  <td className="px-4 py-3">
                      {isEditing ? (
                        <Input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} />
                      ) : (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span>{c.phone ?? "-"}</span>
                          {c.phone ? (
                            <a
                              href={buildWhatsAppUrl(c.phone)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted"
                              title="Abrir WhatsApp"
                              aria-label="Abrir WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      )}
                  </td>
                  <td className="px-4 py-3">{`${(c.lat as number).toFixed(6)}, ${(c.lng as number).toFixed(6)}`}</td>
                  <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                            onClick={saveEditing}
                            disabled={savingEdit}
                          >
                            {savingEdit ? "Guardando..." : "Guardar"}
                          </Button>
                          <Button type="button" variant="outline" onClick={cancelEditing} disabled={savingEdit}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/dashboard/admin/clientes/${c._id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                            title="Ver hoja del cliente"
                            aria-label="Ver hoja del cliente"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => startEditing(c)}
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <a
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                            href={buildWazeUrl(c.lat as number, c.lng as number)}
                            target="_blank"
                            rel="noreferrer"
                            title="Ir por el cliente"
                            aria-label="Ir por el cliente"
                          >
                            <Navigation className="h-4 w-4" />
                          </a>
                          <a
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
                            href={buildStreetViewUrl(c.lat as number, c.lng as number)}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver calle 360"
                            aria-label="Ver calle 360"
                          >
                            <Map className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
