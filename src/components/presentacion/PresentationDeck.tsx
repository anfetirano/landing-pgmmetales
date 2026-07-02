"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  ChevronDown,
  CircleDot,
  Cpu,
  FolderKanban,
  MapPin,
  MessageCircle,
  Route,
  ShoppingCart,
  Wallet,
  Waypoints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildCommercialRowsFromClients,
  demoCampaignRows,
  demoCommercialRows,
  demoMapClients,
  demoPurchaseRows,
  presentacionSlides,
  type DemoMapClient,
  type PresentationSlide,
} from "@/data/presentacion";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#edf2ef]" />,
});

type DeckVisualKey =
  | "intro"
  | "catalysts"
  | "control"
  | "map"
  | "buyers"
  | "campaigns"
  | "database"
  | "technology"
  | "closing";

type DeckSlide = PresentationSlide & { visual: DeckVisualKey };

const deckSlides = presentacionSlides as DeckSlide[];

const visualIcons = {
  intro: Waypoints,
  catalysts: ShoppingCart,
  control: FolderKanban,
  map: Route,
  buyers: Wallet,
  campaigns: MessageCircle,
  database: MapPin,
  technology: Cpu,
  closing: Waypoints,
};

const processLabels = [
  "Proveedor",
  "Foto",
  "Peso",
  "Lote",
  "Mapa",
  "Comprador",
  "Campaña",
];

const replies = [
  "Taller Vía Brasil confirmó material para mañana.",
  "Soldaduras Pacífico respondió con nuevo contacto en Panamá Metro.",
  "Centro de Escape Chorrera reactivó conversación para recompra.",
];

function PurchasePhotoFrame({
  title,
  category,
  note,
  imageSrc,
  className = "",
}: {
  title: string;
  category: string;
  note: string;
  imageSrc: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-3 ${className}`}>
      <div className="relative aspect-[1.08/1] overflow-hidden rounded-md border bg-[#eef3f1]">
        <img
          src={imageSrc}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#60746d]">
          {category}
        </div>
        <div className="text-sm font-medium text-[#17322f]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[#60746d]">{note}</div>
      </div>
    </div>
  );
}

function PurchaseMiniThumb({
  src,
  item,
}: {
  src: string;
  item: string;
}) {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-[#eef3f1]">
      <img
        src={src}
        alt={item}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function formatPurchaseMeta(row: (typeof demoPurchaseRows)[number]) {
  return `${row.supplier} · ${row.measurement} · ${row.lot}`;
}

function ProcessTrack({
  activeIndex,
  dark = false,
}: {
  activeIndex: number;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
      {processLabels.map((label, index) => {
        const active = index <= activeIndex;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  active
                    ? dark
                      ? "bg-[#FED835]"
                      : "bg-[#234c4b]"
                    : dark
                      ? "bg-white/25"
                      : "bg-[#cfd8d4]"
                }`}
              />
              <span
                className={`text-xs ${
                  dark
                    ? active
                      ? "text-white"
                      : "text-white/45"
                    : active
                      ? "text-[#17322f]"
                      : "text-[#7b8b84]"
                }`}
              >
                {label}
              </span>
            </div>
            {index < processLabels.length - 1 ? (
              <div className={`h-px w-8 ${dark ? "bg-white/15" : "bg-[#d9e1dd]"}`} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SceneText({
  slide,
  dark = false,
  className = "",
  compact = false,
}: {
  slide: DeckSlide;
  dark?: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border shadow-[0_8px_24px_rgba(16,31,27,0.10)] ${
        dark
          ? "border-white/10 bg-[#101614]/92 text-white"
          : "border-[#d7dfdb] bg-white/96 text-[#17322f]"
      } ${compact ? "px-4 py-4" : "px-5 py-5"} ${className}`}
    >
      <div className={`text-xs ${dark ? "text-white/55" : "text-[#7b8b84]"}`}>
        {slide.step} / {String(deckSlides.length).padStart(2, "0")}
      </div>
      <h2
        className={`mt-3 font-semibold tracking-[-0.04em] ${dark ? "text-white" : "text-[#17322f]"} ${
          compact ? "text-[28px] leading-[1]" : "text-[32px] leading-[0.96]"
        }`}
      >
        {slide.title}
      </h2>
      <p className={`mt-4 ${compact ? "text-sm leading-6" : "text-base leading-7"} ${dark ? "text-white/78" : "text-[#38514b]"}`}>
        {slide.summary}
      </p>
      {slide.paragraphs?.length && !compact ? (
        <p className={`mt-4 text-sm leading-7 ${dark ? "text-white/62" : "text-[#60746d]"}`}>
          {slide.paragraphs[0]}
        </p>
      ) : null}
    </div>
  );
}

function FocusChip({
  title,
  detail,
  className = "",
}: {
  title: string;
  detail: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-[#d7dfdb] bg-white/96 px-3 py-3 shadow-[0_8px_24px_rgba(16,31,27,0.10)] ${className}`}>
      <p className="text-sm font-medium text-[#17322f]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[#60746d]">{detail}</p>
    </div>
  );
}

function Stage({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`relative min-h-0 flex-1 overflow-hidden rounded-xl border ${
        dark
          ? "border-[#1c2824] bg-[#0c1210]"
          : "border-[#d8e0dc] bg-white"
      } shadow-[0_14px_40px_rgba(16,31,27,0.10)]`}
    >
      {children}
    </div>
  );
}

function TopBar({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  const Icon = visualIcons[slide.visual];

  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-3 text-sm text-[#60746d]">
        <Icon className="h-4 w-4 text-[#234c4b]" />
        <span>
          {slide.step} / {String(deckSlides.length).padStart(2, "0")}
        </span>
      </div>
      <motion.div
        initial={false}
        animate={{ opacity: active ? 1 : 0.6 }}
        className="hidden items-center gap-3 text-sm text-[#60746d] md:flex"
      >
        <ChevronDown className="h-4 w-4" />
        <span>Scroll, teclado o botones para avanzar</span>
      </motion.div>
    </div>
  );
}

function IntroScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage dark>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(35,76,75,0.32),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(254,216,53,0.10),transparent_28%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative flex h-full flex-col px-8 py-8 md:px-12 md:py-10">
        <ProcessTrack activeIndex={-1} dark />

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.img
            initial={false}
            animate={{ opacity: active ? 1 : 0.7, y: active ? 0 : 10 }}
            transition={{ duration: 0.5 }}
            src="/images/Logos/pmg-logo-wordmark-desktop.svg"
            alt="PMG Metales"
            className="h-16 w-auto opacity-95 md:h-20"
          />
          <motion.h1
            initial={false}
            animate={{ opacity: active ? 1 : 0.75, y: active ? 0 : 10 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-10 max-w-4xl text-[54px] font-semibold leading-[0.92] tracking-[-0.05em] text-white md:text-[82px]"
          >
            {slide.title}
          </motion.h1>
          <motion.p
            initial={false}
            animate={{ opacity: active ? 1 : 0.7, y: active ? 0 : 10 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-8 max-w-3xl text-lg leading-8 text-white/70"
          >
            {slide.summary}
          </motion.p>
        </div>

        <div className="mx-auto max-w-4xl text-center text-sm leading-7 text-white/50">
          {slide.paragraphs?.[0]}
        </div>
      </div>
    </Stage>
  );
}

function PurchaseFlowScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  const looseMaterial = demoPurchaseRows[0];
  const fullCatalyst = demoPurchaseRows[1];
  const purchaseSequence = [
    {
      title: "Material suelto documentado",
      detail: `${looseMaterial.supplier} · ${looseMaterial.measurement}`,
    },
    {
      title: "Catalizador completo fotografiado",
      detail: `${fullCatalyst.supplier} · ${fullCatalyst.item}`,
    },
    {
      title: "Valor registrado",
      detail: `${looseMaterial.price} + ${fullCatalyst.price}`,
    },
    {
      title: "Lote asignado",
      detail: looseMaterial.lot,
    },
  ];

  return (
    <Stage>
      <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)]">
        <div className="border-b bg-[#f7f8fb] px-8 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <ProcessTrack activeIndex={3} />

          <motion.div
            initial={false}
            animate={{ opacity: active ? 1 : 0.82, y: active ? 0 : 8 }}
            transition={{ duration: 0.5 }}
            className="mt-6 rounded-lg border bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#7b8b84]">Registro de compras en campo</div>
                <div className="mt-1 text-2xl font-semibold text-[#17322f]">Lote {looseMaterial.lot}</div>
                <div className="mt-2 text-sm text-[#60746d]">
                  Material suelto y catalizador completo registrados con fotos reales.
                </div>
              </div>
              <div className="rounded-md border px-3 py-2 text-sm text-[#17322f]">
                Datos reales de base operativa
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <PurchasePhotoFrame
                  title={looseMaterial.item}
                  category={looseMaterial.category}
                  note={`${looseMaterial.supplier} · ${looseMaterial.measurement} · ${looseMaterial.price}`}
                  imageSrc={looseMaterial.photoUrl}
                />
                <PurchasePhotoFrame
                  title={fullCatalyst.item}
                  category={fullCatalyst.category}
                  note={`${fullCatalyst.supplier} · ${fullCatalyst.measurement} · ${fullCatalyst.price}`}
                  imageSrc={fullCatalyst.photoUrl}
                />
              </div>

              <div className="grid gap-3">
                <div className="rounded-lg border bg-[#fbfcfc] p-4">
                  <div className="text-sm font-medium text-[#17322f]">Compras documentadas</div>
                  <div className="mt-4 grid gap-3">
                    {[looseMaterial, fullCatalyst].map((row) => (
                      <div key={row.item} className="rounded-md border bg-white px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-[#17322f]">{row.item}</div>
                          <div className="text-sm font-semibold text-[#17322f]">{row.price}</div>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-[#60746d] md:grid-cols-2">
                          <div>Tipo: {row.category}</div>
                          <div>Proveedor: {row.supplier}</div>
                          <div>Medida: {row.measurement}</div>
                          <div>Lote: {row.lot}</div>
                          <div>{row.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Textarea
                  value="Registro real de dos materiales distintos: una compra de material suelto y un catalizador completo, ambos con foto, proveedor, valor y lote vinculados desde campo."
                  readOnly
                  className="min-h-[118px] bg-white"
                />
              </div>
            </div>
          </motion.div>

          <FocusChip
            title="La compra ya tiene evidencia"
            detail="Una pieza suelta y una pieza completa quedan visibles con su foto real, valor registrado y lote asociado."
            className="mt-6 max-w-[380px]"
          />
        </div>

        <div className="flex h-full flex-col bg-white px-8 py-8 lg:px-10 lg:py-10">
          <div>
            <div className="text-xs text-[#7b8b84]">
              {slide.step} / {String(deckSlides.length).padStart(2, "0")}
            </div>
            <h3 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#17322f]">
              {slide.title}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#4f635d]">
              {slide.summary}
            </p>
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: active ? 1 : 0.82, scale: active ? 1 : 0.98 }}
            transition={{ duration: 0.45 }}
            className="mt-5 rounded-lg border bg-[#f7f8fb] p-4"
          >
            <div className="text-sm text-[#7b8b84]">Secuencia operativa</div>
            <div className="mt-3 grid gap-3">
              {purchaseSequence.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={false}
                  animate={{
                    opacity: active ? 1 : 0.7,
                    x: active ? 0 : 8,
                  }}
                  transition={{ duration: 0.28, delay: active ? 0.08 * index : 0 }}
                  className="flex items-start gap-3 rounded-md border bg-white px-4 py-2.5"
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#234c4b]" />
                  <div>
                    <div className="text-sm font-medium text-[#17322f]">{item.title}</div>
                    <div className="mt-1 text-xs text-[#60746d]">{item.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              opacity: active ? 1 : 0.78,
              y: active ? 0 : 14,
              boxShadow: active
                ? [
                    "0 0 0 rgba(35,76,75,0)",
                    "0 0 0 10px rgba(35,76,75,0.08)",
                    "0 0 0 rgba(35,76,75,0)",
                  ]
                : "0 0 0 rgba(35,76,75,0)",
            }}
            transition={{ duration: 1.8, repeat: active ? Infinity : 0 }}
            className="mt-5 rounded-lg border border-[#234c4b] bg-[#234c4b] p-4 text-white"
          >
            <div className="text-sm text-white/65">Lote real de compra</div>
            <div className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">{looseMaterial.lot}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3">
                <div className="text-white/60">Registros</div>
                <div className="mt-1 text-xl font-medium">2</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 px-3 py-3">
                <div className="text-white/60">Valor visible</div>
                <div className="mt-1 text-xl font-medium">$122</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Stage>
  );
}

function ControlScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage>
      <div className="grid h-full grid-cols-[240px_minmax(0,1fr)]">
        <div className="border-r bg-white px-4 py-6">
          <div className="text-lg font-bold text-[#234c4b]">PMG Metales</div>
          <div className="mt-1 text-xs text-[#7b8b84]">Dashboard administrador</div>
          <div className="mt-6 grid gap-2 text-sm">
            {["Área de control", "Administrador", "Proveedores", "Clientes", "Campañas"].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 ${
                  index === 0 ? "bg-[#edf4f1] font-medium text-[#234c4b]" : "text-[#4f635d]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-[#f7f8fb] px-8 py-8">
          <ProcessTrack activeIndex={3} />

          <div className="mt-8 max-w-6xl">
            <div>
              <h3 className="text-[34px] font-semibold tracking-[-0.04em] text-[#17322f]">Área de control</h3>
              <p className="mt-2 text-sm text-[#60746d]">Resumen combinado de lote y proveedores.</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-sm text-[#60746d]">
                Lote activo: <span className="font-medium text-[#17322f]">PA-042</span>
              </div>
              <div className="rounded-md border bg-white px-4 py-2 text-sm text-[#17322f]">
                Ver lote PA-042
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[
                ["Compras lote", "48"],
                ["Ingresos proveedores", "19"],
                ["Piezas (total)", "312"],
                ["Gramos (total)", "1,842"],
                ["Kilos (total)", "1.84"],
                ["Invertido total", "$18,450"],
                ["Por cobrar proveedores", "$2,840"],
                ["Saldo neto proveedores", "$7,120"],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  initial={false}
                  animate={{
                    opacity: active ? 1 : 0.78,
                    scale: active && index === 0 ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 1.2, repeat: active && index === 0 ? Infinity : 0 }}
                  className={`rounded-lg border bg-white p-5 ${
                    label === "Compras lote" || label === "Invertido total" ? "border-[#234c4b]" : ""
                  }`}
                >
                  <div className="text-sm text-[#7b8b84]">{label}</div>
                  <div className="mt-5 text-[38px] font-semibold tracking-[-0.04em] text-[#17322f]">{value}</div>
                </motion.div>
              ))}
            </div>

            <FocusChip
              title="El lote ya cambió"
              detail="La compra alteró volumen, kilos e inversión dentro del área de control."
              className="absolute bottom-24 left-8 max-w-[320px]"
            />

            <SceneText slide={slide} className="absolute bottom-24 right-8 w-[360px]" />
          </div>
        </div>
      </div>
    </Stage>
  );
}

function NetworkScene({
  slide,
  active,
  mapClients,
}: {
  slide: DeckSlide;
  active: boolean;
  mapClients: DemoMapClient[];
}) {
  const networkMapClients = useMemo(
    () =>
      mapClients.map((client) => ({
        ...client,
        zone:
          client.zone === "panama"
            ? "Panamá Metro"
            : client.zone === "colon"
              ? "Colón"
              : client.zone === "chorrera"
                ? "Arraiján + La Chorrera"
                : client.zone === "david"
                  ? "David"
                  : client.zone === "interior"
                    ? "Interior"
                    : client.zone ?? "Panamá Metro",
      })),
    [mapClients]
  );
  const commercialRows = useMemo(
    () => buildCommercialRowsFromClients(networkMapClients),
    [networkMapClients]
  );

  return (
    <Stage>
      <div className="grid h-full grid-cols-1 bg-[#f7f8fb] xl:grid-cols-[minmax(0,0.42fr)_minmax(360px,0.58fr)]">
        <div className="border-b bg-white px-8 py-8 xl:border-b-0 xl:border-r xl:px-10">
          <ProcessTrack activeIndex={4} />

          <div className="mt-8 overflow-hidden rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-medium text-[#17322f]">Base comercial PMG</div>
              <div className="text-xs text-[#60746d]">{commercialRows.length} proveedores visibles</div>
            </div>
            <div className="max-h-[540px] overflow-y-auto">
              {commercialRows.map((row, index) => (
                <div
                  key={`${row.name}-${index}`}
                  className={`border-b px-4 py-3 last:border-b-0 ${index === 0 ? "bg-[#f7fbfa]" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#17322f]">{row.name}</div>
                      <div className="mt-1 text-xs text-[#60746d]">
                        {row.zone} · {row.status} · {row.history}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs font-medium text-[#38514b]">{row.buyer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-[#fbfcfc] px-4 py-4 text-sm text-[#4f635d]">
            La lista mantiene solo una fracción visible, pero la escena carga la base completa para que el CRM se sienta activo y continuo.
          </div>
        </div>

        <div className="flex h-full flex-col bg-[#f7f8fb] px-8 py-8">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-[#17322f]">Mapa de Panamá y red comercial activa</div>
                <div className="mt-1 text-xs text-[#60746d]">
                  {networkMapClients.length} puntos activos en la red
                </div>
              </div>
              <div className="rounded-md border bg-[#f7fbfa] px-3 py-2 text-xs text-[#38514b]">
                Base completa visible
              </div>
            </div>
            <div className="relative h-[420px] overflow-hidden rounded-md border md:h-[520px]">
              <ClientsMap
                clients={networkMapClients}
                tenantKey="pa"
                heightClassName="h-full w-full"
                showFullscreenToggle={false}
                enableClustering={false}
              />
            </div>
          </div>

          <div className="mt-6 xl:mt-auto">
            <SceneText slide={slide} compact className="max-w-[420px] xl:mb-16" />
          </div>
        </div>
      </div>
    </Stage>
  );
}

function BuyerScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage>
      <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-r bg-white px-4 py-6">
          <div className="text-lg font-bold text-[#234c4b]">PMG Metales</div>
          <div className="mt-1 text-xs text-[#7b8b84]">Dashboard comprador</div>
          <div className="mt-6 grid gap-2 text-sm">
            {["Dashboard", "Compras", "Clientes", "Gastos", "Cierre del día"].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 ${
                  index === 0 ? "bg-[#edf4f1] font-medium text-[#234c4b]" : "text-[#4f635d]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-[#f7f8fb] px-8 py-8">
          <ProcessTrack activeIndex={5} />

          <div className="mt-8">
            <div className="rounded-md border bg-white px-4 py-3 text-sm text-[#17322f]">
              Comprador visible: <span className="font-medium">Richard</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["Base asignada", "$6,450"],
                ["Gastado aprobado", "$1,800"],
                ["Saldo disponible", "$4,650"],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  initial={false}
                  animate={{
                    opacity: active ? 1 : 0.78,
                    y: active ? 0 : 10,
                    scale: active && index === 0 ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 1.2, repeat: active && index === 0 ? Infinity : 0 }}
                  className={`rounded-lg border p-5 ${
                    index === 0 ? "border-[#234c4b]" : ""
                  } ${index === 0 ? "bg-[#edf4f1]" : "bg-white"}`}
                >
                  <div className="text-sm text-[#7b8b84]">{label}</div>
                  <div className="mt-5 text-[38px] font-semibold tracking-[-0.04em] text-[#17322f]">{value}</div>
                  {index === 0 ? (
                    <div className="mt-2 text-xs leading-5 text-[#4f635d]">
                      Base asignada al comprador para compras activas del lote PA-042.
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>

            <div className="mt-2 text-xs text-[#60746d]">Pendiente por aprobar: $320</div>

            <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
              {[
                ["Total compras", "18"],
                ["Total pagado", "$5,980"],
                ["Total comisiones", "$420"],
                ["Total gramos", "1,240"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <div className="text-sm text-[#7b8b84]">{label}</div>
                  <div className="mt-4 text-[34px] font-semibold tracking-[-0.04em] text-[#17322f]">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
              <div className="overflow-hidden rounded-lg border bg-white">
                <div className="border-b px-4 py-3 text-sm font-medium text-[#17322f]">Últimas 5 compras</div>
                <div className="grid gap-0">
                  {demoPurchaseRows.slice(0, 5).map((row, index) => (
                    <div key={row.item} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#17322f]">{row.item}</div>
                          <div className="mt-1 text-xs text-[#60746d]">{formatPurchaseMeta(row)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <PurchaseMiniThumb src={row.photoUrl} item={row.item} />
                          <div className="text-sm font-semibold text-[#17322f]">{row.price}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <SceneText slide={slide} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function CampaignScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage>
      <div className="grid h-full grid-cols-[240px_minmax(0,1fr)]">
        <div className="border-r bg-white px-4 py-6">
          <div className="text-lg font-bold text-[#234c4b]">PMG Metales</div>
          <div className="mt-1 text-xs text-[#7b8b84]">Dashboard administrador</div>
          <div className="mt-6 grid gap-2 text-sm">
            {["Área de control", "Administrador", "Proveedores", "Clientes", "Campañas"].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 ${
                  index === 4 ? "bg-[#edf4f1] font-medium text-[#234c4b]" : "text-[#4f635d]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-[#f7f8fb] px-8 py-8">
          <ProcessTrack activeIndex={6} />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border bg-white p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border px-3 py-2 text-sm">Panamá Metro</div>
                <div className="rounded-md border px-3 py-2 text-sm">Ruta comercial</div>
              </div>

              <div className="mt-4 rounded-lg border bg-[#f7fbfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#17322f]">Audience preview</span>
                  <span className="text-xs text-[#60746d]">42 contactos válidos</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#60746d]">
                  <span className="rounded-md border bg-white px-2 py-1">Taller Vía Brasil</span>
                  <span className="rounded-md border bg-white px-2 py-1">Soldaduras Pacífico</span>
                  <span className="rounded-md border bg-white px-2 py-1">Centro de Escape Chorrera</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <Textarea
                  value={demoCampaignRows[0].message}
                  readOnly
                  className="min-h-[150px]"
                />
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-sm font-medium text-[#17322f]">Previsualización</div>
                  <p className="mt-3 text-sm leading-7 text-[#4f635d]">{demoCampaignRows[0].message}</p>
                </div>
              </div>

              <div className="mt-4 inline-flex h-10 items-center rounded-md bg-[#234c4b] px-4 text-sm font-medium text-white">
                Enviar campaña
              </div>
            </div>

            <div className="relative rounded-lg border bg-white p-5">
              <div className="text-sm font-medium text-[#17322f]">Segmentos activos y respuestas</div>
              <div className="mt-4 grid gap-3">
                {demoCampaignRows.slice(0, 4).map((row, index) => (
                  <div
                    key={row.zone}
                    className={`rounded-md border px-3 py-3 ${
                      index === 0 ? "bg-[#edf4f1] border-[#234c4b]" : "bg-white"
                    }`}
                  >
                    <div className="text-sm font-medium text-[#17322f]">{row.zone}</div>
                    <div className="mt-1 text-xs text-[#60746d]">{row.audience}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t pt-4">
                <div className="text-sm font-medium text-[#17322f]">Respuestas que reactivan abastecimiento</div>
                <div className="mt-3 grid gap-3">
                  {replies.map((reply, index) => (
                    <motion.div
                      key={reply}
                      initial={false}
                      animate={{
                        opacity: active ? 1 : 0.72,
                        x: active ? 0 : 8,
                      }}
                      transition={{ duration: 0.28, delay: active ? 0.08 * index : 0 }}
                      className="flex items-start gap-3 rounded-md border bg-[#f7fbfa] px-3 py-3"
                    >
                      <CircleDot className="mt-0.5 h-4 w-4 text-[#234c4b]" />
                      <div className="text-sm leading-6 text-[#4f635d]">{reply}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <SceneText slide={slide} className="absolute bottom-24 left-8 w-[360px]" />
        </div>
      </div>
    </Stage>
  );
}

function MemoryScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage>
      <div className="grid h-full grid-cols-1 bg-[#f7f8fb] lg:grid-cols-[0.58fr_0.42fr]">
        <div className="relative border-b bg-white px-8 py-8 lg:border-b-0 lg:border-r lg:px-10">
          <ProcessTrack activeIndex={6} />

          <div className="mt-8 grid gap-5">
            <div className="rounded-lg border bg-white">
              <div className="border-b px-4 py-3 text-sm font-medium text-[#17322f]">Historial comercial</div>
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
                  {demoCommercialRows.slice(0, 9).map((row, index) => (
                    <tr key={row.name} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                      <td className="px-4 py-3 font-medium text-[#17322f]">{row.name}</td>
                      <td className="px-4 py-3">{row.zone}</td>
                      <td className="px-4 py-3">{row.buyer}</td>
                      <td className="px-4 py-3">{row.history}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-white p-4">
                <div className="text-sm font-medium text-[#17322f]">Últimas compras</div>
                <div className="mt-3 grid gap-3">
                  {demoPurchaseRows.slice(0, 3).map((row) => (
                    <div key={row.item} className="flex items-center justify-between gap-3 rounded-md border px-3 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#17322f]">{row.item}</div>
                        <div className="mt-1 text-xs text-[#60746d]">{formatPurchaseMeta(row)}</div>
                      </div>
                      <PurchaseMiniThumb src={row.photoUrl} item={row.item} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <div className="text-sm font-medium text-[#17322f]">Campañas recientes</div>
                <div className="mt-3 grid gap-3">
                  {demoCampaignRows.slice(0, 3).map((row) => (
                    <div key={row.zone} className="rounded-md border px-3 py-3">
                      <div className="text-sm font-medium text-[#17322f]">{row.zone}</div>
                      <div className="mt-1 text-xs text-[#60746d]">{row.audience}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FocusChip
              title="La empresa recuerda"
              detail="La siguiente compra parte del historial, no de cero."
              className="max-w-[270px]"
            />
          </div>
        </div>

        <div className="bg-[#f7f8fb] px-8 py-8">
          <motion.div
            initial={false}
            animate={{
              opacity: active ? 1 : 0.8,
              y: active ? 0 : 10,
            }}
            transition={{ duration: 0.4 }}
            className="rounded-lg border bg-white p-5"
          >
            <div className="text-sm font-medium text-[#17322f]">Memoria operativa</div>
            <div className="mt-5 grid gap-4">
              {[
                "Proveedor localizado y guardado",
                "Comprador responsable visible",
                "Historial de compras acumulado",
                "Zona y ruta comercial definidas",
                "Campañas ligadas a la base de datos",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md border bg-[#fbfcfc] px-4 py-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#234c4b]" />
                  <div className="text-sm leading-6 text-[#4f635d]">{item}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <SceneText slide={slide} className="mt-6 w-full" />
        </div>
      </div>
    </Stage>
  );
}

function ClosingScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  return (
    <Stage dark>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(35,76,75,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(254,216,53,0.08),transparent_26%)]" />
      <div className="relative flex h-full flex-col px-8 py-8 md:px-12 md:py-10">
        <ProcessTrack activeIndex={6} dark />

        <div className="mt-8 grid flex-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Lote activo", "PA-042"],
                ["Compras registradas", "48"],
                ["Saldo operativo", "$4,650"],
              ].map(([label, value], index) => (
                <motion.div
                  key={label}
                  initial={false}
                  animate={{ opacity: active ? 1 : 0.76, y: active ? 0 : 10 }}
                  transition={{ duration: 0.35, delay: active ? 0.06 * index : 0 }}
                  className="rounded-lg border border-white/12 bg-white/[0.07] p-5"
                >
                  <div className="text-sm text-white/80">{label}</div>
                  <div className="mt-5 text-[38px] font-semibold tracking-[-0.04em] text-white">{value}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/12 bg-white/[0.07] p-5">
                <div className="text-sm font-medium text-white">Proveedor</div>
                <div className="mt-3 text-lg text-white">Taller Vía Brasil</div>
                <div className="mt-1 text-sm text-white/80">Panamá Metro · Richard</div>
              </div>
              <div className="rounded-lg border border-white/12 bg-white/[0.07] p-5">
                <div className="text-sm font-medium text-white">Campaña</div>
                <div className="mt-3 text-lg text-white">Panamá Metro activa</div>
                <div className="mt-1 text-sm text-white/80">42 contactos válidos</div>
              </div>
            </div>

            <div className="rounded-lg border border-white/16 bg-[#1a2320] p-5">
              <div className="text-sm font-medium text-white/90">Resultado</div>
              <p className="mt-3 max-w-2xl text-[17px] leading-8 text-white">
                El proveedor se registra, la compra entra al lote, el comprador la opera,
                la base de datos la recuerda y la campaña sostiene la continuidad.
              </p>
            </div>
          </div>

          <div className="relative flex flex-col justify-center overflow-hidden rounded-lg bg-[linear-gradient(180deg,rgba(26,59,54,0.42),rgba(19,28,25,0.18)_48%,rgba(16,22,20,0))] px-4 py-6">
            <div className="relative mb-8 flex min-h-[148px] items-center justify-center">
              <div className="absolute top-1/2 h-20 w-64 -translate-y-1/2 rounded-full bg-[#2a5953]/38 blur-3xl" />
              <img
                src="/images/Logos/pmg-logo-wordmark-desktop.svg"
                alt="PMG Metales"
                className="relative h-14 w-auto opacity-100 md:h-[72px]"
              />
            </div>
            <SceneText slide={slide} dark className="border-white/10 bg-[#101614]/92 shadow-none" />
            <motion.p
              initial={false}
              animate={{ opacity: active ? 1 : 0.76, y: active ? 0 : 10 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="mt-8 max-w-xl text-[40px] font-semibold leading-[0.98] tracking-[-0.05em] text-white md:text-[58px]"
            >
              La empresa está viva. La interfaz solo la hace visible.
            </motion.p>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function TechnologyScene({
  slide,
  active,
}: {
  slide: DeckSlide;
  active: boolean;
}) {
  const cards = [
    {
      title: "Tarjetas electrónicas",
      icon: Cpu,
    },
    {
      title: "Empresas, Recicladores",
      icon: Building2,
    },
    {
      title: "Panamá oportunidad de negocio",
      icon: BarChart3,
    },
  ];

  return (
    <Stage dark>
      <img
        src="/images/fondopre.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,14,12,0.74)_0%,rgba(9,17,15,0.68)_30%,rgba(10,18,16,0.44)_56%,rgba(10,18,16,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_42%,rgba(44,89,81,0.10),transparent_34%),radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.08),transparent_28%)]" />

      <div className="relative flex h-full flex-col px-8 py-8 md:px-12 md:py-10">
        <div className="flex items-start justify-between gap-6">
          <img
            src="/images/Logos/pmg-logo-wordmark-desktop.svg"
            alt="PMG Metales"
            className="h-12 w-auto opacity-95 md:h-14"
          />
          <div className="text-sm text-white/60">
            {slide.step} / {String(deckSlides.length).padStart(2, "0")}
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="grid max-w-[760px] gap-8">
            <motion.div
              initial={false}
              animate={{ opacity: active ? 1 : 0.84, y: active ? 0 : 10 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="max-w-[640px] text-[52px] font-semibold leading-[0.96] tracking-[-0.06em] text-white md:text-[66px]">
                <span className="block">Adicional a la compra</span>
                <span className="block">de catalizadores</span>
                <span className="mt-3 block text-[#6fa992]">
                  consideramos a Panamá con un gran potencial para la tarjeta electrónica.
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: active ? 1 : 0.82, y: active ? 0 : 10 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="grid max-w-[640px] gap-5 rounded-lg border border-white/10 bg-black/16 px-5 py-5 text-[17px] leading-8 text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.38)]"
            >
              <p>
                Panamá también presenta una oportunidad importante en el mercado de tarjetas electrónicas y materiales tecnológicos con valor recuperable.
              </p>
              <p>
                Nuestra experiencia en Panamá nos permite ampliar la operación hacia tarjetas electrónicas, componentes de alto valor y relaciones con empresas y recicladores dentro de una estructura trazable y profesional.
              </p>
            </motion.div>

            <div className="grid max-w-[640px] gap-4 pt-2 md:grid-cols-3">
              {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={false}
                    animate={{ opacity: active ? 1 : 0.8, y: active ? 0 : 10 }}
                    transition={{ duration: 0.35, delay: active ? 0.08 * index : 0 }}
                    className="rounded-lg border border-white/12 bg-[#101614]/78 px-5 py-5"
                  >
                    <Icon className="h-7 w-7 text-[#6fa992]" />
                    <div className="mt-4 text-[19px] font-medium leading-7 text-white">
                      {card.title}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function renderScene(
  slide: DeckSlide,
  active: boolean,
  mapClients: DemoMapClient[]
) {
  switch (slide.visual) {
    case "intro":
      return <IntroScene slide={slide} active={active} />;
    case "catalysts":
      return <PurchaseFlowScene slide={slide} active={active} />;
    case "control":
      return <ControlScene slide={slide} active={active} />;
    case "map":
      return <NetworkScene slide={slide} active={active} mapClients={mapClients} />;
    case "buyers":
      return <BuyerScene slide={slide} active={active} />;
    case "campaigns":
      return <CampaignScene slide={slide} active={active} />;
    case "database":
      return <MemoryScene slide={slide} active={active} />;
    case "technology":
      return <TechnologyScene slide={slide} active={active} />;
    case "closing":
      return <ClosingScene slide={slide} active={active} />;
    default:
      return null;
  }
}

function SlideSection({
  slide,
  active,
  mapClients,
}: {
  slide: DeckSlide;
  active: boolean;
  mapClients: DemoMapClient[];
}) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0.85 }}
      className="min-h-[100svh] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8"
    >
      <div className="mx-auto flex h-[calc(100svh-2rem)] max-w-[1560px] flex-col">
        <TopBar slide={slide} active={active} />
        {renderScene(slide, active, mapClients)}
      </div>
    </motion.div>
  );
}

export default function PresentationDeck({
  liveMapClients,
}: {
  liveMapClients?: DemoMapClient[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const mapClients = liveMapClients?.length ? liveMapClients : demoMapClients;

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
            <SlideSection
              slide={slide}
              active={index === activeIndex}
              mapClients={mapClients}
            />
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
