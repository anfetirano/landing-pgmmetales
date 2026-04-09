"use client";

import { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Pencil, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoneyByTenant } from "@/lib/currency";

type CatalogSource = "manual" | "pmr" | "ecotrade" | "confirmed_field";
type CatalogConfidence = "exact" | "probable" | "review_manually";

const SOURCE_LABELS: Record<CatalogSource, string> = {
  manual: "Manual",
  pmr: "PMR",
  ecotrade: "Ecotrade",
  confirmed_field: "Confirmada en campo",
};

const CONFIDENCE_LABELS: Record<CatalogConfidence, string> = {
  exact: "Alta",
  probable: "Media",
  review_manually: "Revisar",
};

export default function AdminCatalogoPage() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const adminArgs = dbUser && dbUser.role === "admin" ? { adminId: dbUser._id } : "skip";

  const [search, setSearch] = useState("");
  const pieces = useQuery(
    api.catalogPieces.listByAdmin,
    dbUser && dbUser.role === "admin"
      ? { adminId: dbUser._id, search: search.trim() || undefined }
      : "skip"
  ) ?? [];

  const savePiece = useMutation(api.catalogPieces.saveCatalogPieceAsAdmin);
  const deletePiece = useMutation(api.catalogPieces.deleteCatalogPieceAsAdmin);

  const [editingId, setEditingId] = useState<Id<"catalogPieces"> | null>(null);
  const [reference, setReference] = useState("");
  const [altReferences, setAltReferences] = useState("");
  const [brand, setBrand] = useState("");
  const [canonicalName, setCanonicalName] = useState("");
  const [internalPrice, setInternalPrice] = useState("");
  const [samplePhotoUrl, setSamplePhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState<CatalogSource>("manual");
  const [confidence, setConfidence] = useState<CatalogConfidence>("probable");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatMoney = (value: number) => formatMoneyByTenant(value, dbUser?.tenantKey);

  const resetForm = () => {
    setEditingId(null);
    setReference("");
    setAltReferences("");
    setBrand("");
    setCanonicalName("");
    setInternalPrice("");
    setSamplePhotoUrl("");
    setNotes("");
    setSource("manual");
    setConfidence("probable");
  };

  const handleEdit = (piece: (typeof pieces)[number]) => {
    setEditingId(piece._id);
    setReference(piece.reference ?? "");
    setAltReferences((piece.altReferences ?? []).join(", "));
    setBrand(piece.brand ?? "");
    setCanonicalName(piece.canonicalName ?? "");
    setInternalPrice(String(piece.internalPrice ?? ""));
    setSamplePhotoUrl(piece.samplePhotoUrl ?? "");
    setNotes(piece.notes ?? "");
    setSource(piece.source as CatalogSource);
    setConfidence(piece.confidence as CatalogConfidence);
  };

  const handleSave = async () => {
    if (!dbUser || dbUser.role !== "admin") return alert("No autorizado.");
    if (!canonicalName.trim()) return alert("El nombre de catálogo es obligatorio.");

    const price = Number(internalPrice);
    if (Number.isNaN(price) || price <= 0) return alert("Precio inválido.");

    setSaving(true);
    try {
      await savePiece({
        adminId: dbUser._id,
        pieceId: editingId ?? undefined,
        reference: reference.trim() || undefined,
        altReferences: altReferences
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        brand: brand.trim() || undefined,
        canonicalName: canonicalName.trim(),
        internalPrice: price,
        samplePhotoUrl: samplePhotoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        source,
        confidence,
      });
      resetForm();
      alert(editingId ? "Pieza actualizada." : "Pieza guardada en catálogo.");
    } catch (error) {
      console.error(error);
      alert("Error guardando la pieza del catálogo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pieceId: Id<"catalogPieces">) => {
    if (!dbUser || dbUser.role !== "admin") return;
    const ok = confirm("¿Eliminar esta pieza del catálogo?");
    if (!ok) return;

    setDeletingId(pieceId);
    try {
      await deletePiece({ adminId: dbUser._id, pieceId });
      if (editingId === pieceId) resetForm();
      alert("Pieza eliminada.");
    } catch (error) {
      console.error(error);
      alert("Error eliminando la pieza.");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = useMemo(() => {
    const exact = pieces.filter((piece) => piece.confidence === "exact").length;
    return {
      total: pieces.length,
      exact,
    };
  }, [pieces]);

  if (!dbUser) {
    return <div className="max-w-6xl">Cargando...</div>;
  }

  if (dbUser.role !== "admin") {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-[#234c4b]">Catalogo</h1>
        <p className="mt-2 text-red-600">No autorizado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-[#234c4b]">Catalogo</h1>
      <p className="mt-2 text-muted-foreground">
        Base interna de piezas recurrentes para {dbUser.tenantKey === "pa" ? "Panamá" : "Colombia"}.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{editingId ? "Editar pieza" : "Nueva pieza"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input
              placeholder="Referencia"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <Input
              placeholder="Referencias alternas (separadas por coma)"
              value={altReferences}
              onChange={(e) => setAltReferences(e.target.value)}
            />
            <Input
              placeholder="Marca"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            <Input
              placeholder="Nombre de catálogo"
              value={canonicalName}
              onChange={(e) => setCanonicalName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Precio al cliente (USD)"
              value={internalPrice}
              onChange={(e) => setInternalPrice(e.target.value)}
            />
            <Input
              placeholder="URL de foto de muestra"
              value={samplePhotoUrl}
              onChange={(e) => setSamplePhotoUrl(e.target.value)}
            />
            <Select value={source} onValueChange={(value) => setSource(value as CatalogSource)}>
              <SelectTrigger>
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={confidence}
              onValueChange={(value) => setConfidence(value as CatalogConfidence)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Confianza" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONFIDENCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Notas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1 bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : editingId ? "Actualizar pieza" : "Guardar pieza"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total en catálogo</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-[#234c4b]">
                {summary.total}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Coincidencias exactas</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-[#234c4b]">
                {summary.exact}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Piezas guardadas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input
                placeholder="Buscar por referencia, marca o nombre"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {pieces.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay piezas guardadas.</div>
              ) : null}

              {pieces.map((piece) => (
                <div
                  key={piece._id}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                    {piece.samplePhotoUrl ? (
                      <img
                        src={piece.samplePhotoUrl}
                        alt={piece.canonicalName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-[#234c4b]">{piece.canonicalName}</div>
                    <div className="text-muted-foreground">
                      {piece.brand ?? "Marca pendiente"} · {piece.reference ?? "Sin referencia"}
                    </div>
                    {piece.altReferences?.length ? (
                      <div className="text-xs text-muted-foreground">
                        Alternas: {piece.altReferences.join(", ")}
                      </div>
                    ) : null}
                    <div className="mt-1 text-xs text-muted-foreground">
                      {SOURCE_LABELS[piece.source as CatalogSource]} · {CONFIDENCE_LABELS[piece.confidence as CatalogConfidence]}
                    </div>
                    {piece.notes ? (
                      <div className="mt-1 text-xs text-muted-foreground">{piece.notes}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="min-w-[110px] text-right font-semibold text-[#234c4b]">
                      {formatMoney(piece.internalPrice)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(piece)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(piece._id)}
                      disabled={deletingId === piece._id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
