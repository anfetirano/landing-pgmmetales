"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  FolderKanban,
  Map as MapIcon,
  MessageCircle,
  ShoppingCart,
  Wallet,
  Waypoints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  demoBuyerRows,
  demoCampaignRows,
  demoCommercialRows,
  demoMapClients,
  demoPurchaseRows,
  presentacionSlides,
  type PresentationSlide,
} from "@/data/presentacion";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#edf2ef]" />,
});

type DeckVisualKey =
  | "intro"
  | "control"
  | "map"
  | "database"
  | "catalysts"
  | "buyers"
  | "campaigns"
  | "closing";

type DeckSlide = PresentationSlide & { visual: DeckVisualKey };

type FocusTransform = {
  scale: number;
  x: number;
  y: number;
};

type CalloutSpec = {
  title: string;
  detail?: string;
  x: string;
  y: string;
  width?: string;
};

type HighlightSpec = {
  x: string;
  y: string;
  width: string;
  height: string;
};

type SceneConfig = {
  railPosition: "left" | "right";
  focus: FocusTransform;
  callouts: CalloutSpec[];
  highlights: HighlightSpec[];
  caption: string;
};

const deckSlides = presentacionSlides as DeckSlide[];

const sceneTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const visualIcons: Record<DeckVisualKey, LucideIcon> = {
  intro: Waypoints,
  control: FolderKanban,
  map: MapIcon,
  database: FolderKanban,
  catalysts: ShoppingCart,
  buyers: Wallet,
  campaigns: MessageCircle,
  closing: Waypoints,
};

const sceneConfigs: Record<DeckVisualKey, SceneConfig> = {
  intro: {
    railPosition: "left",
    focus: { scale: 1.06, x: -48, y: 10 },
    callouts: [],
    highlights: [],
    caption: "La app real es el escenario principal de toda la demostración.",
  },
  control: {
    railPosition: "right",
    focus: { scale: 1.08, x: -54, y: 18 },
    callouts: [
      { title: "Lote activo", detail: "La operación se ordena desde un lote visible.", x: "26%", y: "20%" },
      { title: "Inversión registrada", detail: "Compras, kilos e inversión se leen en una sola vista.", x: "60%", y: "25%", width: "250px" },
      { title: "Historial por compra", detail: "Cada movimiento se relaciona con proveedor y lote.", x: "58%", y: "62%", width: "240px" },
    ],
    highlights: [
      { x: "22%", y: "16%", width: "56%", height: "25%" },
      { x: "20%", y: "53%", width: "42%", height: "19%" },
    ],
    caption: "Cada compra queda registrada dentro de una estructura operativa por lote.",
  },
  map: {
    railPosition: "left",
    focus: { scale: 1.12, x: 52, y: 8 },
    callouts: [
      { title: "Oportunidades georreferenciadas", detail: "La red se mira sobre territorio real.", x: "50%", y: "16%", width: "260px" },
      { title: "Rutas comerciales", detail: "La lista lateral organiza visitas y seguimiento.", x: "10%", y: "56%", width: "220px" },
      { title: "Popup operativo", detail: "WhatsApp, Waze y calle 360 desde el punto comercial.", x: "67%", y: "54%", width: "230px" },
    ],
    highlights: [
      { x: "34%", y: "12%", width: "55%", height: "72%" },
      { x: "66%", y: "18%", width: "23%", height: "18%" },
    ],
    caption: "La geografía nos permite planificar rutas, zonas de crecimiento y seguimiento comercial.",
  },
  database: {
    railPosition: "right",
    focus: { scale: 1.07, x: -38, y: 14 },
    callouts: [
      { title: "Base ordenada", detail: "Nombre, zona, contacto y tipo de proveedor.", x: "22%", y: "19%", width: "220px" },
      { title: "Seguimiento comercial", detail: "Cada fila deja visible el historial y el responsable.", x: "61%", y: "46%", width: "250px" },
    ],
    highlights: [
      { x: "18%", y: "15%", width: "52%", height: "12%" },
      { x: "15%", y: "30%", width: "72%", height: "42%" },
    ],
    caption: "No trabajamos con información dispersa. La base de datos sostiene la recompra y el crecimiento.",
  },
  catalysts: {
    railPosition: "left",
    focus: { scale: 1.09, x: 36, y: 18 },
    callouts: [
      { title: "Foto de compra", detail: "La evidencia visual entra con el registro.", x: "14%", y: "18%" },
      { title: "Proveedor y material", detail: "La compra nace vinculada a taller, pieza y lote.", x: "45%", y: "25%", width: "240px" },
      { title: "Lista reciente", detail: "El historial del día queda disponible para revisión.", x: "68%", y: "60%", width: "220px" },
    ],
    highlights: [
      { x: "10%", y: "14%", width: "27%", height: "40%" },
      { x: "42%", y: "16%", width: "25%", height: "31%" },
      { x: "54%", y: "47%", width: "34%", height: "31%" },
    ],
    caption: "Compras, fotos, materiales y lote quedan unidos en una misma operación.",
  },
  buyers: {
    railPosition: "right",
    focus: { scale: 1.07, x: -34, y: 8 },
    callouts: [
      { title: "Saldo operativo", detail: "La base y el gasto aprobado se controlan en tiempo real.", x: "18%", y: "21%", width: "230px" },
      { title: "Pendiente por aprobar", detail: "El supervisor ve lo que falta revisar.", x: "18%", y: "42%", width: "220px" },
      { title: "Últimas compras", detail: "Las compras recientes se cruzan con saldo y actividad.", x: "60%", y: "61%", width: "220px" },
    ],
    highlights: [
      { x: "14%", y: "17%", width: "44%", height: "18%" },
      { x: "13%", y: "53%", width: "74%", height: "27%" },
    ],
    caption: "Cada comprador opera con control financiero, historial y supervisión.",
  },
  campaigns: {
    railPosition: "left",
    focus: { scale: 1.08, x: 42, y: 14 },
    callouts: [
      { title: "Segmentos por zona", detail: "Panamá Metro, Colón, Arraiján y más.", x: "12%", y: "16%", width: "220px" },
      { title: "Plantilla y preview", detail: "La comunicación se prepara con estructura y contexto.", x: "50%", y: "28%", width: "240px" },
      { title: "Comunicación recurrente", detail: "Las campañas recientes quedan registradas.", x: "67%", y: "62%", width: "220px" },
    ],
    highlights: [
      { x: "10%", y: "13%", width: "34%", height: "63%" },
      { x: "46%", y: "16%", width: "31%", height: "48%" },
      { x: "66%", y: "50%", width: "22%", height: "28%" },
    ],
    caption: "La comunicación comercial también se opera con orden, trazabilidad y recurrencia.",
  },
  closing: {
    railPosition: "right",
    focus: { scale: 1.04, x: -28, y: 4 },
    callouts: [],
    highlights: [],
    caption: "La tecnología existe para sostener una operación comercial más disciplinada y escalable.",
  },
};

const adminNav = [
  { key: "control", label: "Área de control" },
  { key: "admin", label: "Administrador" },
  { key: "proveedores", label: "Proveedores" },
  { key: "clientes", label: "Clientes" },
  { key: "catalogo", label: "Catalogo" },
  { key: "campanas", label: "Campañas" },
];

const buyerNav = [
  { key: "dashboard", label: "Dashboard" },
  { key: "compras", label: "Compras" },
  { key: "clientes", label: "Clientes" },
  { key: "gastos", label: "Gastos" },
  { key: "cierre", label: "Cierre del día" },
];

const buyerLatestPurchases = [
  { title: "Toyota Hilux OEM", meta: "Modelo: Hilux · Taller Vía Brasil", amount: "$420" },
  { title: "Honeycomb mixto", meta: "Gramos: 18.6 kg · Recicladora Arraiján", amount: "$1,180" },
  { title: "Ford Ranger", meta: "Modelo: Ranger · Centro de Escape Chorrera", amount: "$330" },
];

const recentCampaignHistory = [
  { zone: "Panamá Metro", status: "42 contactos", detail: "Ruta de mañana enviada" },
  { zone: "Colón", status: "18 contactos", detail: "Seguimiento comercial semanal" },
  { zone: "Arraiján + La Chorrera", status: "26 contactos", detail: "Reactivación de talleres" },
];

function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#234c4b]">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-[#234c4b]" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold text-[#111827]">{value}</CardContent>
    </Card>
  );
}

function DemoSidebar({
  mode,
  active,
}: {
  mode: "admin" | "buyer";
  active: string;
}) {
  const items = mode === "admin" ? adminNav : buyerNav;
  const subtitle = mode === "admin" ? "Dashboard administrador" : "Dashboard comprador";
  const userName = mode === "admin" ? "Richard Moreno" : "Richard";

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-white px-4 py-6 md:flex">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#234c4b]">PMG Metales</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-lg px-3 py-2 ${
              item.key === active ? "bg-[#edf4f1] font-medium text-[#234c4b]" : "text-[#4f635d]"
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border bg-white px-3 py-3">
        <p className="text-sm font-medium text-[#234c4b]">{userName}</p>
        <p className="text-xs text-muted-foreground">
          {mode === "admin" ? "Administrador Panamá" : "Comprador"}
        </p>
      </div>
    </aside>
  );
}

function DemoWorkspace({
  mode,
  activeNav,
  children,
}: {
  mode: "admin" | "buyer";
  activeNav: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full overflow-hidden bg-[#f7f8fb]">
      <DemoSidebar mode={mode} active={activeNav} />
      <main className="min-w-0 flex-1 px-5 py-6 md:px-8">{children}</main>
    </div>
  );
}

function ControlVisual() {
  return (
    <DemoWorkspace mode="admin" activeNav="control">
      <div className="max-w-6xl">
        <PageHeading title="Área de control" subtitle="Resumen combinado de lote y proveedores." />

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="text-sm text-muted-foreground">
            Lote activo: <span className="font-medium text-[#17322f]">PA-042</span>
          </div>
          <div className="rounded-md border bg-white px-4 py-2 text-sm text-[#17322f]">
            Ver lote PA-042
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Compras lote" value="48" accent />
          <MetricCard label="Ingresos proveedores" value="19" />
          <MetricCard label="Piezas (total)" value="312" />
          <MetricCard label="Gramos (total)" value="1,842" />
          <MetricCard label="Kilos (total)" value="1.84" />
          <MetricCard label="Invertido total" value="$18,450" accent />
          <MetricCard label="Por cobrar proveedores" value="$2,840" />
          <MetricCard label="Saldo neto proveedores" value="$7,120" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Lote visible</p>
                <p className="mt-2 font-medium text-[#17322f]">PA-042</p>
              </div>
              <div className="rounded-md border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Último cierre</p>
                <p className="mt-2 font-medium text-[#17322f]">Actualizado hace 2 horas</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4 text-sm leading-7 text-[#4f635d]">
            Cada compra y cada movimiento financiero quedan vinculados a lote, proveedor y
            continuidad operativa.
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function MapVisual() {
  return (
    <DemoWorkspace mode="buyer" activeNav="clientes">
      <div className="max-w-none">
        <PageHeading title="Clientes" subtitle="Agrega talleres y visualízalos en el mapa." />

        <div className="mt-6 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="grid gap-3">
            <Input value="Panamá Metro" readOnly />
            {demoCommercialRows.slice(0, 4).map((row, index) => (
              <div
                key={row.name}
                className={`rounded-lg border px-4 py-3 ${
                  index === 0 ? "border-[#234c4b] bg-[#edf4f1]" : "bg-white"
                }`}
              >
                <p className="font-medium text-[#17322f]">{row.name}</p>
                <p className="mt-1 text-sm text-[#4f635d]">
                  {row.zone} · {row.contact}
                </p>
              </div>
            ))}
          </div>

          <div className="relative h-[560px] overflow-hidden rounded-lg border bg-white">
            <ClientsMap
              clients={demoMapClients}
              tenantKey="pa"
              heightClassName="h-full w-full"
              showFullscreenToggle={false}
            />
            <div className="absolute right-4 top-4 w-64 rounded-lg border bg-white/96 p-3 shadow-[0_6px_18px_rgba(22,44,39,0.12)]">
              <p className="font-medium text-[#17322f]">Taller Vía Brasil</p>
              <p className="mt-1 text-sm text-[#4f635d]">Carlos Mena · Panamá Metro</p>
              <p className="mt-3 text-xs text-muted-foreground">
                WhatsApp · Waze · calle 360
              </p>
            </div>
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function DatabaseVisual() {
  return (
    <DemoWorkspace mode="admin" activeNav="clientes">
      <div className="max-w-6xl">
        <PageHeading
          title="Clientes"
          subtitle="Base de datos comercial organizada por zona, tipo y seguimiento."
        />

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input value="Buscar por nombre, zona o contacto" readOnly />
          <div className="rounded-md border bg-white px-3 py-2 text-sm text-[#17322f]">
            5 resultados activos
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f7f8fb] text-[#60746d]">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Historial</th>
              </tr>
            </thead>
            <tbody>
              {demoCommercialRows.map((row, index) => (
                <tr key={row.name} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                  <td className="px-4 py-4 font-medium text-[#17322f]">{row.name}</td>
                  <td className="px-4 py-4">{row.zone}</td>
                  <td className="px-4 py-4">{row.contact}</td>
                  <td className="px-4 py-4">{row.type}</td>
                  <td className="px-4 py-4">{row.buyer}</td>
                  <td className="px-4 py-4">{row.history}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function PurchasesVisual() {
  return (
    <DemoWorkspace mode="buyer" activeNav="compras">
      <div className="max-w-6xl">
        <PageHeading title="Compras del día" subtitle="Registra compras y revisa tu cierre diario." />

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex aspect-[4/3] items-center justify-center rounded-md border bg-[#f7f8fb] text-center text-sm text-muted-foreground">
                <div>
                  <Camera className="mx-auto h-7 w-7 text-[#234c4b]" />
                  <p className="mt-2">Foto de la compra</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input value="Taller Vía Brasil" readOnly />
              <Input value="Toyota Hilux OEM" readOnly />
              <Input value="4.8 kg" readOnly />
              <Input value="$420" readOnly />
            </div>

            <Textarea
              value="Compra vinculada a lote PA-042 con proveedor, foto y observación operativa."
              readOnly
              className="min-h-[120px]"
            />
          </div>

          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f8fb] text-[#60746d]">
                <tr>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Ítem</th>
                  <th className="px-4 py-3">Peso</th>
                  <th className="px-4 py-3">Pagado</th>
                  <th className="px-4 py-3">Lote</th>
                </tr>
              </thead>
              <tbody>
                {demoPurchaseRows.map((row, index) => (
                  <tr key={`${row.supplier}-${row.item}`} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                    <td className="px-4 py-4 font-medium text-[#17322f]">{row.supplier}</td>
                    <td className="px-4 py-4">{row.category}</td>
                    <td className="px-4 py-4">{row.item}</td>
                    <td className="px-4 py-4">{row.weight}</td>
                    <td className="px-4 py-4">{row.price}</td>
                    <td className="px-4 py-4">{row.lot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function BuyerDashboardVisual() {
  return (
    <DemoWorkspace mode="buyer" activeNav="dashboard">
      <div className="max-w-5xl">
        <PageHeading
          title="Dashboard"
          subtitle="Resumen de compras pendientes, últimas compras y saldo operativo."
        />

        <div className="mt-6 rounded-lg border bg-white px-4 py-3 text-sm text-[#17322f]">
          Comprador visible: <span className="font-medium">Richard</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Base asignada" value="$6,450" accent />
          <MetricCard label="Gastado aprobado" value="$1,800" />
          <MetricCard label="Saldo disponible" value="$4,650" />
        </div>

        <div className="mt-2 text-xs text-muted-foreground">Pendiente por aprobar: $320</div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total compras" value="18" />
          <MetricCard label="Total pagado" value="$5,980" />
          <MetricCard label="Total comisiones" value="$420" />
          <MetricCard label="Total gramos" value="1,240" />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#234c4b]">Últimas 5 compras</h2>
          <div className="mt-3 grid gap-4">
            {buyerLatestPurchases.map((purchase) => (
              <Card key={purchase.title}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#17322f]">{purchase.title}</div>
                    <div className="text-xs text-muted-foreground">{purchase.meta}</div>
                  </div>
                  <div className="text-sm font-semibold text-[#17322f]">{purchase.amount}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function CampaignsVisual() {
  return (
    <DemoWorkspace mode="admin" activeNav="campanas">
      <div className="max-w-6xl">
        <PageHeading
          title="Campañas WhatsApp"
          subtitle="Envía campañas manuales de WhatsApp a clientes de Panamá con zona asignada."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border bg-white p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Segmento
                <div className="rounded-md border px-3 py-2 text-sm font-normal">Panamá Metro</div>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Plantilla base
                <div className="rounded-md border px-3 py-2 text-sm font-normal">Ruta comercial</div>
              </label>
            </div>

            <div className="mt-4 rounded-lg border bg-[#f7fbfa] p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-[#17322f]">Audience preview</span>
                <span className="text-xs text-muted-foreground">42 contactos válidos</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border bg-white px-2 py-1">Taller Vía Brasil</span>
                <span className="rounded-full border bg-white px-2 py-1">Soldaduras Pacífico</span>
                <span className="rounded-full border bg-white px-2 py-1">Centro de Escape Chorrera</span>
              </div>
            </div>

            <label className="mt-4 grid gap-2 text-sm font-medium">
              Mensaje base
              <Textarea
                value={demoCampaignRows[0].message}
                readOnly
                className="min-h-[140px]"
              />
            </label>

            <div className="mt-4 rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-[#234c4b]">Previsualización</p>
              <p className="mt-3 text-sm leading-7 text-[#4f635d]">{demoCampaignRows[0].message}</p>
            </div>

            <div className="mt-4 inline-flex h-10 items-center rounded-md bg-[#234c4b] px-4 text-sm font-medium text-white">
              Enviar campaña
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-[#17322f]">Segmentos activos</p>
              <div className="mt-3 grid gap-2">
                {demoCampaignRows.map((row, index) => (
                  <div
                    key={row.zone}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      index === 0 ? "border-[#234c4b] bg-[#edf4f1]" : "bg-white"
                    }`}
                  >
                    <div className="font-medium text-[#17322f]">{row.zone}</div>
                    <div className="text-xs text-muted-foreground">{row.audience}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-[#17322f]">Campañas recientes</p>
              <div className="mt-3 grid gap-2">
                {recentCampaignHistory.map((campaign) => (
                  <div key={campaign.zone} className="rounded-md border px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[#17322f]">{campaign.zone}</span>
                      <span className="text-xs text-muted-foreground">{campaign.status}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{campaign.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function ClosingVisual() {
  return (
    <DemoWorkspace mode="admin" activeNav="control">
      <div className="max-w-none">
        <PageHeading
          title="Operación PMG Metales Panamá"
          subtitle="Clientes, compras, lotes, compradores, campañas y seguimiento comercial."
        />

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Lote activo" value="PA-042" accent />
              <MetricCard label="Compras registradas" value="48" />
              <MetricCard label="Saldo operativo" value="$4,650" />
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8fb] text-[#60746d]">
                  <tr>
                    <th className="px-4 py-3">Proveedor</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Comprador</th>
                    <th className="px-4 py-3">Historial</th>
                  </tr>
                </thead>
                <tbody>
                  {demoCommercialRows.slice(0, 4).map((row, index) => (
                    <tr key={row.name} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                      <td className="px-4 py-4 font-medium text-[#17322f]">{row.name}</td>
                      <td className="px-4 py-4">{row.zone}</td>
                      <td className="px-4 py-4">{row.buyer}</td>
                      <td className="px-4 py-4">{row.history}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-[#17322f]">Compradores y campañas</p>
              <div className="mt-3 grid gap-3">
                {demoBuyerRows.map((buyer) => (
                  <div key={buyer.buyer} className="rounded-md border px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[#17322f]">{buyer.buyer}</span>
                      <span className="text-xs text-muted-foreground">{buyer.balance}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Última compra: {buyer.lastPurchase}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm font-medium text-[#17322f]">Comunicación activa</p>
              <p className="mt-3 text-sm leading-7 text-[#4f635d]">{demoCampaignRows[0].message}</p>
            </div>
          </div>
        </div>
      </div>
    </DemoWorkspace>
  );
}

function renderVisual(slide: DeckSlide) {
  switch (slide.visual) {
    case "intro":
      return <ControlVisual />;
    case "control":
      return <ControlVisual />;
    case "map":
      return <MapVisual />;
    case "database":
      return <DatabaseVisual />;
    case "catalysts":
      return <PurchasesVisual />;
    case "buyers":
      return <BuyerDashboardVisual />;
    case "campaigns":
      return <CampaignsVisual />;
    case "closing":
      return <ClosingVisual />;
    default:
      return null;
  }
}

function NarrationRail({
  slide,
  caption,
}: {
  slide: DeckSlide;
  caption: string;
}) {
  const isIntro = slide.visual === "intro";
  const isClosing = slide.visual === "closing";

  return (
    <aside className="flex h-full flex-col rounded-xl border border-[#d7dfdb] bg-white px-5 py-5 shadow-[0_6px_18px_rgba(22,44,39,0.08)]">
      <div className="text-sm text-[#60746d]">
        {slide.step} / {String(deckSlides.length).padStart(2, "0")}
      </div>

      <h1
        className={`mt-4 font-semibold tracking-[-0.04em] text-[#132e2b] ${
          isIntro || isClosing ? "text-[34px] leading-[0.95]" : "text-[28px] leading-[1]"
        }`}
      >
        {slide.title}
      </h1>

      <p className="mt-4 text-base leading-7 text-[#38514b]">{slide.summary}</p>

      {slide.paragraphs ? (
        <div className="mt-5 grid gap-3 text-sm leading-7 text-[#52655f]">
          {slide.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-auto border-t pt-4 text-sm leading-7 text-[#60746d]">{caption}</div>
    </aside>
  );
}

function Callout({
  callout,
  active,
  index,
}: {
  callout: CalloutSpec;
  active: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={false}
      animate={
        active
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 10, scale: 0.98 }
      }
      transition={{ duration: 0.28, delay: active ? 0.14 + index * 0.08 : 0 }}
      className="absolute rounded-lg border border-[#d7dfdb] bg-white/96 px-3 py-3 shadow-[0_6px_18px_rgba(22,44,39,0.12)]"
      style={{
        left: callout.x,
        top: callout.y,
        width: callout.width ?? "210px",
      }}
    >
      <p className="text-sm font-medium text-[#17322f]">{callout.title}</p>
      {callout.detail ? (
        <p className="mt-1 text-xs leading-6 text-[#60746d]">{callout.detail}</p>
      ) : null}
    </motion.div>
  );
}

function Highlight({
  item,
  active,
}: {
  item: HighlightSpec;
  active: boolean;
}) {
  return (
    <motion.div
      animate={
        active
          ? {
              opacity: 1,
              boxShadow: [
                "0 0 0 0 rgba(254,216,53,0.55)",
                "0 0 0 8px rgba(254,216,53,0)",
                "0 0 0 0 rgba(254,216,53,0.55)",
              ],
            }
          : { opacity: 0.4, boxShadow: "0 0 0 0 rgba(254,216,53,0)" }
      }
      transition={{ duration: 1.8, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      className="absolute rounded-lg border-2 border-[#fed835] bg-[#fed835]/10"
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
      }}
    />
  );
}

function CinematicDemoScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  const config = sceneConfigs[slide.visual];
  const Icon = visualIcons[slide.visual];
  const visual = renderVisual(slide);
  const rail = <NarrationRail slide={slide} caption={config.caption} />;
  const introOrClosing = slide.visual === "intro" || slide.visual === "closing";

  return (
    <motion.div
      variants={sceneTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="min-h-[100svh] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8"
    >
      <div className="mx-auto flex h-[calc(100svh-2rem)] max-w-[1500px] flex-col">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3 text-sm text-[#60746d]">
            <Icon className="h-4 w-4 text-[#234c4b]" />
            <span>
              {slide.step} / {String(deckSlides.length).padStart(2, "0")}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-sm text-[#60746d] md:flex">
            <ChevronDown className="h-4 w-4" />
            <span>Scroll, teclado o botones para avanzar</span>
          </div>
        </div>

        <div
          className={`grid min-h-0 flex-1 gap-5 ${
            config.railPosition === "left"
              ? "lg:grid-cols-[320px_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)_320px]"
          }`}
        >
          {config.railPosition === "left" ? rail : null}

          <div className="relative min-h-[58vh] overflow-hidden rounded-xl border border-[#d7dfdb] bg-white shadow-[0_8px_24px_rgba(22,44,39,0.10)]">
            <motion.div
              animate={
                active
                  ? {
                      scale: config.focus.scale,
                      x: config.focus.x,
                      y: config.focus.y,
                    }
                  : { scale: 1, x: 0, y: 0 }
              }
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full origin-center ${introOrClosing ? "opacity-70" : ""}`}
            >
              {visual}
            </motion.div>

            <div className="pointer-events-none absolute inset-0">
              {!introOrClosing
                ? config.highlights.map((item) => (
                    <Highlight key={`${item.x}-${item.y}`} item={item} active={active} />
                  ))
                : null}
              {!introOrClosing
                ? config.callouts.map((callout, index) => (
                    <Callout
                      key={`${callout.title}-${callout.x}`}
                      callout={callout}
                      active={active}
                      index={index}
                    />
                  ))
                : null}
              {introOrClosing ? (
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.38))]" />
              ) : null}
            </div>
          </div>

          {config.railPosition === "right" ? rail : null}
        </div>
      </div>
    </motion.div>
  );
}

export default function PresentationDeck() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, deckSlides.length - 1));
    slideRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const root = containerRef.current;
    const nodes = slideRefs.current.filter(Boolean) as HTMLElement[];
    if (!root || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActiveIndex(index);
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        goToSlide(activeIndex + 1);
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goToSlide(activeIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);

  return (
    <div className="relative h-[100svh] overflow-hidden bg-[#edf1ee] text-[#17322f]">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {deckSlides.map((slide, index) => (
          <section
            key={slide.id}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            data-index={index}
            className="snap-start border-b border-[#dfe6e1]"
          >
            <CinematicDemoScene slide={slide} active={index === activeIndex} />
          </section>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 px-4">
        <div className="pointer-events-auto mx-auto flex max-w-[1320px] items-center justify-between gap-3 rounded-lg border border-[#d7dfdb] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(22,44,39,0.10)]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#15312e]">{deckSlides[activeIndex]?.title}</p>
            <p className="text-xs text-[#60746d]">
              {String(activeIndex + 1).padStart(2, "0")} / {String(deckSlides.length).padStart(2, "0")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg border-[#d7dfdb] bg-white px-4 text-[#15312e] hover:bg-[#eff4f1]"
              onClick={() => goToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              className="h-10 rounded-lg bg-[#234c4b] px-4 text-white hover:bg-[#1d3d39]"
              onClick={() => goToSlide(activeIndex + 1)}
              disabled={activeIndex === deckSlides.length - 1}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
