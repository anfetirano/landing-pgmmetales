"use client";

import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), { ssr: false });

export default function ClientesPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const clients =
    useQuery(api.clients.listByBuyer, dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];

  const createClient = useMutation(api.clients.createClient);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [cedula, setCedula] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleSave = async () => {
    if (!dbUser) return alert("Usuario no registrado.");
    if (!name) return alert("El nombre del cliente es obligatorio.");

    setSaving(true);
    try {
      await createClient({
        name,
        contactName: contactName || undefined,
        cedula: cedula || undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        buyerId: dbUser._id,
      });
      setName("");
      setContactName("");
      setCedula("");
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

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Clientes</h1>
      <p className="text-foreground-accent mt-2">
        Agrega talleres y visualízalos en el mapa.
      </p>

      <div className="mt-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="Nombre del taller / cliente" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Nombre de contacto (opcional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            <Input placeholder="Cédula (opcional)" value={cedula} onChange={(e) => setCedula(e.target.value)} />
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

        <ClientsMap clients={clients} />

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
              {clients.map((c) => {
                const hasCoords = typeof c.lat === "number" && typeof c.lng === "number";
                return (
                  <tr key={c._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.contactName ?? "-"}</td>
                    <td className="px-4 py-3">{c.cedula ?? "-"}</td>
                    <td className="px-4 py-3">
                      {hasCoords ? `${c.lat?.toFixed(6)}, ${c.lng?.toFixed(6)}` : "Sin ubicación"}
                    </td>
                    <td className="px-4 py-3">
                      {hasCoords ? (
                        <a
                          className="inline-flex items-center rounded-md bg-[#234c4b] px-3 py-1.5 text-white hover:bg-[#1e3f3e]"
                          href={`https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ir por el cliente
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
