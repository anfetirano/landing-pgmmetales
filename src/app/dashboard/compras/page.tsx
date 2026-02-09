"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Camera } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ComprasPage() {
  const { user } = useUser();

  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const activeLot = useQuery(api.lots.getActiveLot);

  const clients =
    useQuery(api.clients.listByBuyer, dbUser?._id ? { buyerId: dbUser._id } : "skip") ?? [];

  const createClient = useMutation(api.clients.createClient);
  const createPurchase = useMutation(api.purchases.createPurchase);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [type, setType] = useState<"pieza" | "suelto">("pieza");
  const [taller, setTaller] = useState("");
  const [contactName, setContactName] = useState("");
  const [cedula, setCedula] = useState("");
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

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
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
    if (!taller || !marca || !valorPagado || !comision) {
      alert("Completa los campos obligatorios.");
      return;
    }
    if (!cedula) {
      const ok = confirm("¿Seguro que no deseas anotar la cédula? Esto ayuda para la DIAN.");
      if (!ok) return;
    }

    setLoading(true);
    try {
      const clientId = await createClient({
        name: taller,
        contactName: contactName || undefined,
        cedula: cedula || undefined,
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
      setContactName("");
      setCedula("");
      setSelectedClientId("");
      setMarca("");
      setModelo("");
      setGramos("");
      setValorPagado("");
      setComision("");
      setNotas("");
      setPhotoPreview(null);
      setPhotoFile(null);

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
          <label className="block">
            <span className="sr-only">Agregar foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onPhotoChange}
            />
            <div className="h-42 w-42 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-500 overflow-hidden">
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
            </div>
          </label>
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

            {/* Selector de clientes guardados (autocompleta) */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Seleccionar cliente</label>
              <Select
                value={selectedClientId}
                onValueChange={(id) => {
                  setSelectedClientId(id);
                  const c = clients.find((x) => x._id === id);
                  if (c) {
                    setTaller(c.name ?? "");
                    setContactName(c.contactName ?? "");
                    setCedula(c.cedula ?? "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}{c.contactName ? ` — ${c.contactName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Taller / Cliente</label>
              <Input value={taller} onChange={(e) => setTaller(e.target.value)} placeholder="Nombre del taller" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre de contacto (opcional)</label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ej: Juan Pérez" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Cédula (opcional)</label>
              <Input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="CC / NIT" />
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
