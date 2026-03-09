"use client";

import { useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Camera } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const normalizeTextKey = (value: string | undefined | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export default function ComprasPage() {
  const { user } = useUser();

  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const activeLot = useQuery(
    api.lots.getActiveLot,
    dbUser ? { tenantKey: dbUser.tenantKey ?? "co" } : "skip"
  );

  const clients =
    useQuery(api.clients.listByBuyer, dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];
  const getPrimaryClientName = (client: (typeof clients)[number]) =>
    (client.contactName ?? "").trim() || (client.name ?? "").trim();
  const getWorkshopName = (client: (typeof clients)[number]) =>
    ((client.name ?? "").trim() || null);
  const getClientOptionLabel = (client: (typeof clients)[number]) => {
    const primary = getPrimaryClientName(client);
    const workshop = getWorkshopName(client);
    if (primary && workshop && normalizeTextKey(primary) !== normalizeTextKey(workshop)) {
      return `${primary} — ${workshop}`;
    }
    return primary || workshop || "Cliente";
  };

  const selectableClients = useMemo(
    () => {
      const byKey = new Map<string, (typeof clients)[number]>();

      for (const client of clients) {
        if (typeof client.lat !== "number" || typeof client.lng !== "number") continue;
        if (client.isEmergency === true) continue;

        const primaryName = getPrimaryClientName(client);
        const workshopName = getWorkshopName(client);
        if (!primaryName || /^\d+$/.test(primaryName)) continue;

        const key = `${normalizeTextKey(primaryName)}|${normalizeTextKey(workshopName)}`;
        const existing = byKey.get(key);
        if (!existing || client._creationTime > existing._creationTime) {
          byKey.set(key, client);
        }
      }

      return [...byKey.values()].sort((a, b) =>
        getPrimaryClientName(a).localeCompare(getPrimaryClientName(b), "es", {
          sensitivity: "base",
        })
      );
    },
    [clients]
  );

  const createClient = useMutation(api.clients.createClient);
  const createPurchase = useMutation(api.purchases.createPurchase);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [type, setType] = useState<"pieza" | "suelto">("pieza");
  const [taller, setTaller] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [gramos, setGramos] = useState("");
  const [valorPagado, setValorPagado] = useState("");
  const [comision, setComision] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const clientsByLetter = useMemo(() => {
    const groups = new Map<string, (typeof selectableClients)>();

    for (const client of selectableClients) {
      const first = normalizeTextKey(getPrimaryClientName(client)).charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(first) ? first : "#";
      const group = groups.get(letter) ?? [];
      group.push(client);
      groups.set(letter, group);
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
  }, [selectableClients]);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setShowPhotoOptions(false);

    if (!file) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSave = async () => {
    if (!dbUser) {
      alert("Usuario no registrado en el sistema.");
      return;
    }
    if (!activeLot?._id) {
      alert("No hay lote activo. Pídele al admin abrir un lote.");
      return;
    }
    if (!marca || !valorPagado || !comision) {
      alert("Completa los campos obligatorios.");
      return;
    }
    if (!selectedClientId && !taller.trim()) {
      alert("Selecciona un cliente o usa Taller / Cliente solo en emergencia.");
      return;
    }

    setLoading(true);
    try {
      const emergencyClientName = taller.trim();
      const clientId = selectedClientId
        ? (selectedClientId as Id<"clients">)
        : await createClient({
            name: emergencyClientName,
            isEmergency: true,
            buyerId: dbUser._id,
          });

      let photoId: string | undefined = undefined;

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

      await createPurchase({
        buyerId: dbUser._id,
        clientId,
        lotId: activeLot._id,
        type,
        brand: marca,
        model: type === "pieza" ? modelo || undefined : undefined,
        grams: type === "suelto" ? Number(gramos || 0) : undefined,
        pricePaid: Number(valorPagado),
        commission: Number(comision),
        notes: notas || undefined,
        photoId: photoId as any,
      });

      // reset
      setTaller("");
      setSelectedClientId("");
      setMarca("");
      setModelo("");
      setGramos("");
      setValorPagado("");
      setComision("");
      setNotas("");
      setPhotoPreview(null);
      setPhotoFile(null);
      setShowPhotoOptions(false);

      alert("Compra guardada.");
    } catch (e) {
      console.error(e);
      alert("Error guardando la compra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Compras del día</h1>
      <p className="text-foreground-accent mt-2">
        Registra compras y revisa tu cierre diario.
      </p>

      <div className="mt-8 grid gap-6">
        {/* Foto */}
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
              className="h-42 w-42 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-500 overflow-hidden bg-white"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <Camera className="h-20 w-20" />
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

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Nueva compra</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tipo de compra</label>
              <Select value={type} onValueChange={(v) => setType(v as "pieza" | "suelto")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieza">Pieza completa</SelectItem>
                  <SelectItem value="suelto">Material suelto (gramos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de clientes guardados */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Seleccionar cliente</label>
              <Select
                value={selectedClientId}
                onValueChange={(id) => {
                  setSelectedClientId(id);
                  setTaller("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente con ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {clientsByLetter.map(([letter, group], index) => (
                    <div key={letter}>
                      <SelectGroup>
                        <SelectLabel>{letter}</SelectLabel>
                        {group.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {getClientOptionLabel(c)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {index < clientsByLetter.length - 1 ? <SelectSeparator /> : null}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {selectableClients.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tienes clientes con ubicación. Agrégalos en Clientes.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Taller / Cliente</label>
              <Input
                value={taller}
                onChange={(e) => setTaller(e.target.value)}
                placeholder="Solo usar en emergencia"
                disabled={!!selectedClientId}
              />
              <p className="text-xs text-muted-foreground">
                Solo usar en emergencia. Estas compras no quedarán en la hoja del cliente normal.
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Marca</label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ej: Toyota" />
            </div>

            {type === "pieza" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Modelo</label>
                <Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ej: Corolla 2018" />
              </div>
            )}

            {type === "suelto" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Gramos</label>
                <Input type="number" value={gramos} onChange={(e) => setGramos(e.target.value)} placeholder="Ej: 150" />
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">Valor pagado al cliente</label>
              <Input type="number" value={valorPagado} onChange={(e) => setValorPagado(e.target.value)} placeholder="Ej: 150000" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Comisión comprador</label>
              <Input type="number" value={comision} onChange={(e) => setComision(e.target.value)} placeholder="Ej: 30000" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones..." />
            </div>

            <Button
              type="button"
              className="w-full bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar compra"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
