"use client";

import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigation, Map, Pencil, MessageCircle, Camera } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), { ssr: false });

export default function ClientesPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const clients =
    useQuery(api.clients.listByBuyer, dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];
  const clientsWithLocation = clients.filter(
    (c) => typeof c.lat === "number" && typeof c.lng === "number"
  );

  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [cedula, setCedula] = useState("");
  const [phone, setPhone] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<Id<"clients"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [editingClientId, setEditingClientId] = useState<Id<"clients"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingContactName, setEditingContactName] = useState("");
  const [editingCedula, setEditingCedula] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const visibleClients = useMemo(() => {
    const sorted = [...clientsWithLocation].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" })
    );

    const term = searchTerm.trim().toLowerCase();
    if (!term) return sorted;

    return sorted.filter((c) => {
      const text = [c.name, c.contactName, c.cedula, c.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(term);
    });
  }, [clientsWithLocation, searchTerm]);

  useEffect(() => {
    if (!selectedClientId) return;
    const stillVisible = visibleClients.some((c) => c._id === selectedClientId);
    if (!stillVisible) setSelectedClientId(null);
  }, [selectedClientId, visibleClients]);

  const mapClients = useMemo(() => {
    if (!selectedClientId) return visibleClients;
    const selected = visibleClients.find((c) => c._id === selectedClientId);
    return selected ? [selected] : visibleClients;
  }, [visibleClients, selectedClientId]);

  const buildWazeUrl = (clientLat: number, clientLng: number) =>
    `https://waze.com/ul?ll=${clientLat},${clientLng}&navigate=yes`;
  const buildStreetViewUrl = (clientLat: number, clientLng: number) =>
    `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${clientLat},${clientLng}`;
  const buildWhatsAppUrl = (rawPhone: string) =>
    `https://wa.me/${rawPhone.replace(/\D/g, "")}`;

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setShowPhotoOptions(false);
    if (!file) {
      setPhotoPreview(null);
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!dbUser) return alert("Usuario no registrado.");
    if (!name) return alert("El nombre del cliente es obligatorio.");

    setSaving(true);
    try {
      let photoId: Id<"_storage"> | undefined = undefined;
      if (photoFile) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": photoFile.type },
          body: photoFile,
        });
        const { storageId } = await res.json();
        photoId = storageId;
      }

      await createClient({
        name,
        contactName: contactName || undefined,
        cedula: cedula || undefined,
        phone: phone || undefined,
        photoId,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        buyerId: dbUser._id,
      });
      setName("");
      setContactName("");
      setCedula("");
      setPhone("");
      setPhotoPreview(null);
      setPhotoFile(null);
      setShowPhotoOptions(false);
      setLat("");
      setLng("");
      alert("Cliente guardado.");
    } catch (e) {
      console.error(e);
      alert("Error guardando cliente.");
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        alert("No se pudo obtener la ubicación.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startEditing = (client: (typeof visibleClients)[number]) => {
    setEditingClientId(client._id);
    setEditingName(client.name ?? "");
    setEditingContactName(client.contactName ?? "");
    setEditingCedula(client.cedula ?? "");
    setEditingPhone(client.phone ?? "");
  };

  const toggleSelectedClient = (clientId: Id<"clients">) => {
    setSelectedClientId((prev) => (prev === clientId ? null : clientId));
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
      await updateClient({
        clientId: editingClientId,
        buyerId: dbUser._id,
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

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Clientes</h1>
      <p className="text-foreground-accent mt-2">
        Agrega talleres y visualízalos en el mapa.
      </p>

      <div className="mt-6 grid gap-6">
        <div className="flex justify-center">
          <div className="w-fit">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />

            <button
              type="button"
              onClick={() => setShowPhotoOptions((v) => !v)}
              className="h-28 w-28 rounded-xl border border-dashed border-gray-300 bg-white text-gray-500 overflow-hidden flex flex-col items-center justify-center gap-1"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Vista previa" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Camera className="h-14 w-14" />
                  <span className="text-xs">Toca para foto</span>
                </>
              )}
            </button>

            {showPhotoOptions && (
              <div className="mt-2 grid justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-40"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Tomar foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-40"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Elegir de galería
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="Nombre del taller / cliente" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Nombre de contacto" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Input placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
            <Input placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input placeholder="Latitud (ej: 6.2442)" value={lat} onChange={(e) => setLat(e.target.value)} />
            <Input placeholder="Longitud (ej: -75.5812)" value={lng} onChange={(e) => setLng(e.target.value)} />
            <Button type="button" variant="outline" onClick={handleUseLocation} disabled={locating}>
              {locating ? "Ubicando..." : "Usar mi ubicación"}
            </Button>
            <Button className="bg-[#234c4b] text-white hover:bg-[#1e3f3e]" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cliente"}
            </Button>
          </CardContent>
        </Card>

        <ClientsMap clients={mapClients} tenantKey={dbUser?.tenantKey} />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Buscar cliente</label>
          <Input
            placeholder="Nombre, contacto, cédula o WhatsApp"
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
            const hasCoords = typeof c.lat === "number" && typeof c.lng === "number";
            const isEditing = editingClientId === c._id;

            return (
              <Card
                key={c._id}
                onClick={() => toggleSelectedClient(c._id)}
                className={
                  selectedClientId === c._id
                    ? "cursor-pointer ring-2 ring-[#234c4b]/40 shadow-[0_10px_24px_rgba(35,76,75,0.22)]"
                    : "cursor-pointer"
                }
              >
                <CardContent className="relative grid gap-3 p-4 pr-32">
                  <div className="absolute right-4 top-4 h-24 w-24 overflow-hidden rounded border bg-muted">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Cliente:</span>{" "}
                    {isEditing ? (
                      <Input className="mt-2" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      <span>{c.name}</span>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Contacto:</span>{" "}
                    {isEditing ? (
                      <Input
                        className="mt-2"
                        value={editingContactName}
                        onChange={(e) => setEditingContactName(e.target.value)}
                      />
                    ) : (
                      <span>{c.contactName ?? "-"}</span>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Cédula:</span>{" "}
                    {isEditing ? (
                      <Input className="mt-2" value={editingCedula} onChange={(e) => setEditingCedula(e.target.value)} />
                    ) : (
                      <span>{c.cedula ?? "-"}</span>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">WhatsApp:</span>{" "}
                    {isEditing ? (
                      <Input className="mt-2" value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} />
                    ) : (
                      <span>{c.phone ?? "-"}</span>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Ubicación:</span>{" "}
                    <span>{hasCoords ? `${c.lat?.toFixed(6)}, ${c.lng?.toFixed(6)}` : "Sin ubicación"}</span>
                  </div>

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
                      {hasCoords ? (
                        <>
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
                        </>
                      ) : null}
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
                  <td className="px-4 py-4 text-muted-foreground" colSpan={6}>
                    No hay clientes con ubicación guardada.
                  </td>
                </tr>
              )}
              {visibleClients.map((c) => {
                const hasCoords = typeof c.lat === "number" && typeof c.lng === "number";
                const isEditing = editingClientId === c._id;
                return (
                  <tr
                    key={c._id}
                    onClick={() => toggleSelectedClient(c._id)}
                    className={
                      selectedClientId === c._id
                        ? "cursor-pointer border-t bg-[#234c4b]/5"
                        : "cursor-pointer border-t"
                    }
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : null}
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
                      {isEditing ? (
                        <Input value={editingContactName} onChange={(e) => setEditingContactName(e.target.value)} />
                      ) : (
                        c.contactName ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Input value={editingCedula} onChange={(e) => setEditingCedula(e.target.value)} />
                      ) : (
                        c.cedula ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
                        <Input value={editingPhone} onChange={(e) => setEditingPhone(e.target.value)} />
                      ) : (
                        <div className="flex items-center gap-2">
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
                    <td className="px-4 py-3">
                      {hasCoords ? `${c.lat?.toFixed(6)}, ${c.lng?.toFixed(6)}` : "Sin ubicación"}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-2">
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
                      ) : hasCoords ? (
                        <div className="flex flex-wrap gap-2">
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
                      ) : (
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
