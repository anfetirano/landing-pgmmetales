"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  FolderKanban,
  Map,
  MessageCircle,
  Package,
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
  demoElectronicsRows,
  demoMapClients,
  demoPurchaseRows,
  presentacionSlides,
  type PresentationSlide,
} from "@/data/presentacion";

const ClientsMap = dynamic(() => import("@/components/ClientsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-xl border bg-[#eef2f0]" />
  ),
});

const slideTransition = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const visualIcons = {
  intro: Waypoints,
  control: FolderKanban,
  map: Map,
  database: FolderKanban,
  catalysts: ShoppingCart,
  buyers: Wallet,
  campaigns: MessageCircle,
  electronics: Package,
  technology: Camera,
  closing: Waypoints,
};

function DemoSidebar({ active }: { active: string }) {
  const items = [
    { key: "control", label: "Área de control" },
    { key: "clientes", label: "Clientes" },
    { key: "compras", label: "Compras" },
    { key: "proveedores", label: "Proveedores" },
    { key: "campanas", label: "Campañas" },
    { key: "catalogo", label: "Catalogo" },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-white px-4 py-6 md:flex">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#234c4b]">PMG Metales</h2>
        <p className="text-xs text-muted-foreground">Dashboard administrador</p>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => (
          <div
            key={item.key}
            className={`rounded-lg px-3 py-2 ${
              item.key === active ? "bg-[#edf4f1] font-medium text-[#234c4b]" : "text-[#4e625d]"
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border bg-white px-3 py-3">
        <p className="text-sm font-medium text-[#234c4b]">Richard Moreno</p>
        <p className="text-xs text-muted-foreground">Administrador Panamá</p>
      </div>
    </aside>
  );
}

function DemoTopbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b bg-white px-5 py-4">
      <h3 className="text-2xl font-bold text-[#234c4b]">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DemoShell({
  activeNav,
  title,
  subtitle,
  children,
  frameClassName = "",
}: {
  activeNav: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  frameClassName?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#dbe3df] bg-[#f7f8fb] shadow-[0_14px_40px_rgba(12,34,29,0.10)] ${frameClassName}`}
    >
      <div className="flex min-h-[510px]">
        <DemoSidebar active={activeNav} />
        <div className="min-w-0 flex-1">
          <DemoTopbar title={title} subtitle={subtitle} />
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FocusCard({
  title,
  value,
  active,
}: {
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <motion.div
      animate={
        active
          ? {
              scale: [1, 1.03, 1],
              boxShadow: [
                "0 2px 8px rgba(0,0,0,0.08)",
                "0 0 0 2px rgba(254,216,53,0.65), 0 12px 30px rgba(35,76,75,0.12)",
                "0 2px 8px rgba(0,0,0,0.08)",
              ],
            }
          : { scale: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
      }
      transition={{ duration: 1.1, ease: "easeInOut" }}
      className="rounded-xl border bg-white p-5"
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-[#111827]">{value}</p>
    </motion.div>
  );
}

function IntroScene({ active }: { active: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dbe3df] bg-white shadow-[0_14px_40px_rgba(12,34,29,0.08)]">
      <div className="absolute inset-0 scale-[1.02] blur-[6px] opacity-60">
        <DemoShell
          activeNav="control"
          title="Área de control"
          subtitle="Resumen combinado de lote y proveedores."
          frameClassName="h-full rounded-none border-0 shadow-none"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <FocusCard title="Compras lote" value="48" />
            <FocusCard title="Piezas" value="312" />
            <FocusCard title="Invertido total" value="$18,450" />
          </div>
        </DemoShell>
      </div>
      <div className="relative flex min-h-[560px] flex-col justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.88))] p-8 md:p-10">
        <div className="flex items-center justify-between">
          <img
            src="/images/Logos/pmg-logo-wordmark-desktop.svg"
            alt="PMG Metales"
            className="h-10 w-auto"
          />
          <div className="rounded-full border px-4 py-2 text-sm text-[#45615a]">
            Demo operativa
          </div>
        </div>
        <div className="max-w-xl rounded-xl border border-white/70 bg-white/72 px-6 py-5 backdrop-blur-sm">
          <p className="text-sm leading-7 text-[#52655f]">
            Esta vista abre la operación en modo demo y deja a la aplicación real como protagonista.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#60746d]">
          <ChevronDown className="h-4 w-4" />
          <span>Recorrido guiado por la operación</span>
        </div>
      </div>
    </div>
  );
}

function ControlScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="control"
        title="Área de control"
        subtitle="Resumen combinado de lote y proveedores."
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FocusCard title="Lote activo" value="PA-042" active={active} />
            <FocusCard title="Compras lote" value="48" active={active} />
            <FocusCard title="Piezas (total)" value="312" />
            <FocusCard title="Gramos (total)" value="1,842" />
            <FocusCard title="Kilos (total)" value="1.84 kg" active={active} />
            <FocusCard title="Invertido total" value="$18,450" active={active} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Vista del lote</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 pt-0 text-sm text-[#334741]">
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span>Lote activo</span>
                  <span className="font-medium text-[#234c4b]">PA-042</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-muted-foreground">Saldo proveedores</p>
                    <p className="mt-2 text-xl font-semibold text-[#111827]">$7,120</p>
                  </div>
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-muted-foreground">Por cobrar</p>
                    <p className="mt-2 text-xl font-semibold text-[#111827]">$2,840</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Lectura operativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm leading-7 text-[#455a54]">
                <p>Cada compra queda ordenada por lote, comprador y proveedor.</p>
                <p>La operación se mide por volumen, inversión, historial y continuidad de abastecimiento.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function MapScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="clientes"
        title="Clientes"
        subtitle="Agrega talleres y visualízalos en el mapa."
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-xl border bg-white">
            <ClientsMap clients={demoMapClients} tenantKey="pa" />
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Proveedor resaltado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm text-[#334741]">
                <p className="text-lg font-semibold text-[#111827]">Taller Vía Brasil</p>
                <p>Contacto: Carlos Mena</p>
                <p>Zona: Panamá Metro</p>
                <p>Canales: WhatsApp, Waze, calle 360</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Uso del mapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm leading-7 text-[#455a54]">
                <p>Visualizamos puntos comerciales reales o en seguimiento.</p>
                <p>La geografía organiza rutas, frecuencia de visita y crecimiento por zona.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function DatabaseScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="clientes"
        title="Clientes"
        subtitle="Base de datos comercial organizada por zona, tipo y seguimiento."
      >
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
            <Input value="Panamá" readOnly />
            <div className="rounded-md border bg-white px-3 py-2 text-sm text-[#52655f]">
              Ver todos en mapa
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border bg-white">
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
                  <tr
                    key={row.name}
                    className={index === 0 ? "bg-[#edf4f1]" : "border-t"}
                  >
                    <td className="px-4 py-4 font-medium text-[#132e2b]">{row.name}</td>
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
      </DemoShell>
    </motion.div>
  );
}

function CatalystsScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="compras"
        title="Compras del día"
        subtitle="Registro de compras por proveedor, lote y material."
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#234c4b]">Nueva compra</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              <div className="rounded-xl border bg-[#fafbfc] p-4">
                <img src="/icons/cata.png" alt="Catalizador" className="mx-auto h-28 w-28 object-contain" />
              </div>
              <Input value="Taller Vía Brasil" readOnly />
              <Input value="Toyota Hilux OEM" readOnly />
              <div className="grid gap-3 md:grid-cols-2">
                <Input value="4.8 kg" readOnly />
                <Input value="$420" readOnly />
              </div>
              <Textarea value="Compra registrada con foto, lote y proveedor asociado." readOnly />
            </CardContent>
          </Card>
          <div className="overflow-hidden rounded-xl border bg-white">
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
                    <td className="px-4 py-4 font-medium text-[#132e2b]">{row.supplier}</td>
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
      </DemoShell>
    </motion.div>
  );
}

function BuyersScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="proveedores"
        title="Administrador"
        subtitle="Control de compradores, saldos y últimos movimientos."
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {demoBuyerRows.map((row) => (
              <Card key={row.buyer} className={row.buyer === "Richard" ? "border-[#234c4b]" : undefined}>
                <CardHeader>
                  <CardTitle className="text-base text-[#234c4b]">{row.buyer}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pt-0 text-sm text-[#334741]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-muted-foreground">Saldo operativo</p>
                      <p className="mt-2 text-lg font-semibold text-[#111827]">{row.balance}</p>
                    </div>
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-muted-foreground">Pendiente</p>
                      <p className="mt-2 text-lg font-semibold text-[#111827]">{row.pending}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-muted-foreground">Última compra</p>
                    <p className="mt-2 font-medium text-[#132e2b]">{row.lastPurchase}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Registro de movimiento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 md:grid-cols-[1fr_1fr_1fr_auto]">
              <Input value="Richard" readOnly />
              <Input value="$250" readOnly />
              <Input value="Viático operativo" readOnly />
              <div className="rounded-md bg-[#234c4b] px-4 py-2 text-center text-sm font-medium text-white">
                Registrar
              </div>
            </CardContent>
          </Card>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function CampaignsScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="campanas"
        title="Campañas WhatsApp"
        subtitle="Seguimiento comercial segmentado por zonas de Panamá."
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#234c4b]">Segmentos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              {demoCampaignRows.map((row, index) => (
                <div
                  key={row.zone}
                  className={`rounded-lg border px-4 py-3 ${
                    index === 0 ? "border-[#234c4b] bg-[#edf4f1]" : "bg-white"
                  }`}
                >
                  <p className="font-medium text-[#132e2b]">{row.zone}</p>
                  <p className="mt-1 text-sm text-[#60746d]">{row.audience}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#234c4b]">Vista previa del mensaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="rounded-2xl border bg-[#f7fbfa] p-4 text-sm leading-7 text-[#29423d]">
                {demoCampaignRows[0].message}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border px-4 py-4 text-sm text-[#455a54]">
                  Zona activa: Panamá Metro
                </div>
                <div className="rounded-lg border px-4 py-4 text-sm text-[#455a54]">
                  Audiencia: 42 contactos válidos
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function ElectronicsScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="clientes"
        title="Expansión a tarjetas electrónicas"
        subtitle="Seguimiento comercial para materiales industriales y residuos electrónicos."
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f7f8fb] text-[#60746d]">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {demoElectronicsRows.map((row, index) => (
                  <tr key={row.company} className={index === 0 ? "bg-[#edf4f1]" : "border-t"}>
                    <td className="px-4 py-4 font-medium text-[#132e2b]">{row.company}</td>
                    <td className="px-4 py-4">{row.area}</td>
                    <td className="px-4 py-4">{row.material}</td>
                    <td className="px-4 py-4">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3">
            {["Gestión ambiental", "Bienes y excedentes", "Tecnología", "Activos fijos", "Compras", "Mantenimiento"].map(
              (item) => (
                <div key={item} className="rounded-xl border bg-white px-4 py-4 text-sm text-[#334741]">
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function TechnologyScene({ active }: { active: boolean }) {
  return (
    <motion.div variants={slideTransition} initial="hidden" animate={active ? "visible" : "hidden"}>
      <DemoShell
        activeNav="control"
        title="Sistema interno"
        subtitle="Tecnología propia para operar mejor, no para vender software."
      >
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#234c4b]">Módulos que sostienen la operación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
              {[
                "Clientes",
                "Compras",
                "Proveedores",
                "Lotes",
                "Campañas",
                "Control",
                "Catálogo",
                "Indicadores",
              ].map((item) => (
                <div key={item} className="rounded-lg border px-4 py-3 text-sm text-[#29423d]">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-[#234c4b]">Mensaje central</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-sm leading-7 text-[#455a54]">
              <p>La plataforma organiza relaciones comerciales, compras, lotes, compradores y campañas.</p>
              <p>No es un producto comercial. Es la herramienta que nos permite operar con control y memoria.</p>
              <p>La tecnología hace posible una red de abastecimiento más ordenada, medible y escalable.</p>
            </CardContent>
          </Card>
        </div>
      </DemoShell>
    </motion.div>
  );
}

function ClosingScene({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="flex min-h-[560px] flex-col justify-between rounded-2xl border border-[#dbe3df] bg-white p-8 shadow-[0_14px_40px_rgba(12,34,29,0.08)] md:p-10"
    >
      <div>
        <img
          src="/images/Logos/pmg-logo-wordmark-desktop.svg"
          alt="PMG Metales"
          className="h-10 w-auto"
        />
      </div>
      <div className="max-w-4xl">
        <p className="text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-[#132e2b] md:text-[66px]">
          No competimos por comprar una pieza más.
        </p>
        <p className="mt-5 text-2xl leading-[1.35] text-[#35504a] md:text-[34px]">
          Construimos una red de abastecimiento basada en información, relaciones comerciales y procesos.
        </p>
        <p className="mt-10 max-w-3xl text-lg leading-8 text-[#52655f]">
          Buscamos un aliado estratégico para desarrollar una relación comercial de largo plazo en catalizadores usados y tarjetas electrónicas.
        </p>
      </div>
      <div className="text-sm text-[#61756f]">PMG Metales Panamá</div>
    </motion.div>
  );
}

function renderScene(slide: PresentationSlide, active: boolean) {
  switch (slide.visual) {
    case "intro":
      return <IntroScene active={active} />;
    case "control":
      return <ControlScene active={active} />;
    case "map":
      return <MapScene active={active} />;
    case "database":
      return <DatabaseScene active={active} />;
    case "catalysts":
      return <CatalystsScene active={active} />;
    case "buyers":
      return <BuyersScene active={active} />;
    case "campaigns":
      return <CampaignsScene active={active} />;
    case "electronics":
      return <ElectronicsScene active={active} />;
    case "technology":
      return <TechnologyScene active={active} />;
    case "closing":
      return <ClosingScene active={active} />;
    default:
      return null;
  }
}

function SlideSection({
  slide,
  active,
}: {
  slide: PresentationSlide;
  active: boolean;
}) {
  const Icon = visualIcons[slide.visual];
  const showOverlay = slide.visual !== "closing";

  return (
    <div className="min-h-[100svh] px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex h-[calc(100svh-2rem)] max-w-[1480px] flex-col">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3 text-sm text-[#60746d]">
            <Icon className="h-4 w-4 text-[#234c4b]" />
            <span>
              {slide.step} / {String(presentacionSlides.length).padStart(2, "0")}
            </span>
          </div>
          <div className="hidden items-center gap-3 text-sm text-[#60746d] md:flex">
            <ChevronDown className="h-4 w-4" />
            <span>Scroll, teclado o botones para avanzar</span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center">
          <div className="w-full">{renderScene(slide, active)}</div>

          {showOverlay ? (
            <motion.div
              variants={slideTransition}
              initial="hidden"
              animate={active ? "visible" : "hidden"}
              className={`pointer-events-none absolute z-10 max-w-[380px] rounded-xl border border-[#d7dfdb] bg-white/96 p-5 shadow-[0_10px_30px_rgba(22,44,39,0.10)] backdrop-blur-sm ${
                slide.visual === "intro"
                  ? "left-5 top-1/2 -translate-y-1/2 md:left-10"
                  : "left-5 top-5 md:left-8 md:top-8"
              }`}
            >
              <h1 className="text-[30px] font-semibold leading-[1] tracking-[-0.04em] text-[#132e2b] md:text-[36px]">
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

              {slide.bullets ? (
                <div className="mt-5 grid gap-2">
                  {slide.bullets.map((item) => (
                    <div key={item} className="rounded-lg border bg-[#f9fbfa] px-3 py-2 text-sm text-[#334741]">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function PresentationDeck() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, presentacionSlides.length - 1));
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
    <div className="relative h-[100svh] overflow-hidden bg-[#f4f6f4] text-[#17322f]">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {presentacionSlides.map((slide, index) => (
          <section
            key={slide.id}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            data-index={index}
            className="snap-start border-b border-[#e5ebe7]"
          >
            <SlideSection slide={slide} active={index === activeIndex} />
          </section>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 px-4">
        <div className="pointer-events-auto mx-auto flex max-w-[1280px] items-center justify-between gap-3 rounded-xl border border-[#d7dfdb] bg-white/94 px-4 py-3 shadow-[0_10px_30px_rgba(22,44,39,0.10)]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#15312e]">{presentacionSlides[activeIndex]?.title}</p>
            <p className="text-xs text-[#60746d]">
              {String(activeIndex + 1).padStart(2, "0")} / {String(presentacionSlides.length).padStart(2, "0")}
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
              disabled={activeIndex === presentacionSlides.length - 1}
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
