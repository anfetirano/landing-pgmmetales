"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, ChevronDown, Cpu, MapPin, MessageSquareText, Network, PackageSearch, RadioTower, Route, ScanSearch, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  panamaNetworkMarkers,
  panamaOpportunityMarkers,
  presentacionSlides,
  type PresentationSlide,
} from "@/data/presentacion";

const PresentationPanamaMap = dynamic(() => import("./PresentationPanamaMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[360px] animate-pulse rounded-[24px] border border-[#d5dfda] bg-[#edf2ef]" />
  ),
});

const slideTransition = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const iconMap = {
  hero: RadioTower,
  "opportunity-map": MapPin,
  technology: Cpu,
  "network-map": Network,
  catalysts: PackageSearch,
  electronics: ScanSearch,
  dashboard: Users,
  campaigns: MessageSquareText,
  statement: ArrowDown,
  closing: Route,
};

function useAnimatedCount(target: number, active: boolean) {
  const [value, setValue] = useState(active ? target : 0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return value;
}

function AnimatedMetric({
  label,
  value,
  suffix = "",
  active,
}: {
  label: string;
  value: number;
  suffix?: string;
  active: boolean;
}) {
  const animated = useAnimatedCount(value, active);

  return (
    <div className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-4">
      <div className="text-[28px] font-semibold tracking-tight text-[#183330]">
        {animated}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-[#4b605a]">{label}</p>
    </div>
  );
}

function ScreenFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[22px] border border-[#d5dfda] bg-white shadow-[0_20px_60px_rgba(22,44,39,0.10)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-[#e2e8e4] bg-[#f4f7f5] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d7dfdb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d7dfdb]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d7dfdb]" />
        <span className="ml-3 text-sm font-medium text-[#35524c]">{title}</span>
      </div>
      {children}
    </div>
  );
}

function HeroVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="relative h-full min-h-[420px] overflow-hidden rounded-[32px] border border-[#d4ddd8] bg-[#1c3531] shadow-[0_24px_80px_rgba(16,34,30,0.18)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_30%),linear-gradient(135deg,_rgba(254,216,53,0.15),_transparent_40%),linear-gradient(180deg,_#234c4b_0%,_#162c28_100%)]" />
      <div className="absolute inset-y-0 right-0 w-[52%] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_96%,rgba(255,255,255,0.08)_96%),linear-gradient(90deg,transparent_96%,rgba(255,255,255,0.08)_96%)] bg-[size:54px_54px]" />

      <div className="relative flex h-full flex-col justify-between p-8 text-white md:p-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="max-w-[320px] text-sm leading-6 text-white/76">
              Operación organizada para abastecimiento, trazabilidad comercial y crecimiento disciplinado en Panamá.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/14 bg-white/8 p-4 backdrop-blur-[2px]">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Base</p>
                <p className="mt-3 text-xl font-semibold">Logística regional</p>
              </div>
              <div className="rounded-2xl border border-white/14 bg-white/8 p-4 backdrop-blur-[2px]">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Enfoque</p>
                <p className="mt-3 text-xl font-semibold">Relaciones de largo plazo</p>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-end">
            <div className="w-full max-w-[280px] rounded-[28px] border border-white/14 bg-white/8 p-5 backdrop-blur-[3px]">
              <p className="text-sm text-white/65">Panamá</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">Conectividad, orden y escala</p>
              <div className="mt-6 h-px bg-white/15" />
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/72">
                <div>
                  <p className="text-white/48">Modelo</p>
                  <p className="mt-1 font-medium text-white">Field + software</p>
                </div>
                <div>
                  <p className="text-white/48">Objetivo</p>
                  <p className="mt-1 font-medium text-white">Abastecimiento estable</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {["Tecnología propia", "Información centralizada", "Red comercial disciplinada"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4 text-sm text-white/84">
              {item}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TechnologyVisual({ active }: { active: boolean }) {
  const items = [
    "Seguimiento comercial",
    "Registro de compras",
    "Historial centralizado",
    "Relaciones comerciales",
    "Control operativo",
  ];

  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"
    >
      <ScreenFrame title="Relaciones y proceso" className="min-h-[360px]">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-[#e0e6e2] px-4 py-3"
              >
                <span className="text-[15px] text-[#1d3532]">{item}</span>
                <span className="text-sm text-[#5f746d]">{String(index + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[#234c4b] px-5 py-4 text-sm text-white/88">
            Tecnología al servicio de una operación tradicional que necesita orden, memoria y continuidad.
          </div>
        </div>
      </ScreenFrame>

      <ScreenFrame title="Estructura operativa" className="min-h-[360px]">
        <div className="grid h-full grid-rows-[1fr_auto] gap-0">
          <div className="grid grid-cols-2 gap-px bg-[#d8e0db]">
            {[
              "Contactos",
              "Compras",
              "Lotes",
              "Historial",
              "Proveedores",
              "Indicadores",
            ].map((cell) => (
              <div key={cell} className="flex items-end bg-white p-5 text-lg font-medium text-[#203934]">
                {cell}
              </div>
            ))}
          </div>
          <div className="border-t border-[#e0e6e2] bg-[#f5f8f6] px-6 py-5 text-sm leading-7 text-[#4f635d]">
            La información deja de estar dispersa y se convierte en una herramienta para decidir mejor dónde visitar, con quién insistir y cómo sostener el crecimiento.
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

function CatalystVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <ScreenFrame title="Red de catalizadores" className="min-h-[380px]">
        <div className="grid h-full gap-4 p-6 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-[#dce4df] bg-[linear-gradient(180deg,#f6f8f7_0%,#edf3ef_100%)] p-6">
            <div className="flex h-full flex-col justify-between">
              <img
                src="/icons/cata.png"
                alt="Catalizador"
                className="mx-auto mt-4 w-full max-w-[220px] object-contain opacity-95"
              />
              <div className="grid gap-2 text-sm text-[#46605a]">
                <div className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-3">OEM y aftermarket</div>
                <div className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-3">Talleres y centros de escape</div>
                <div className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-3">Recicladores y proveedores independientes</div>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[#dce4df] bg-white p-5">
              <p className="text-sm text-[#617670]">Registro</p>
              <p className="mt-2 text-2xl font-semibold text-[#1c3430]">Cada contacto administrado</p>
            </div>
            <div className="rounded-[24px] border border-[#dce4df] bg-[#234c4b] p-5 text-white">
              <p className="text-sm text-white/68">Relación comercial</p>
              <p className="mt-2 text-2xl font-semibold">Seguimiento sostenido y trazable</p>
            </div>
            <div className="rounded-[24px] border border-[#dce4df] bg-white p-5">
              <p className="text-sm text-[#617670]">Objetivo</p>
              <p className="mt-2 text-lg leading-7 text-[#29423d]">
                Convertir la recurrencia del proveedor en una ventaja operativa, no en una casualidad.
              </p>
            </div>
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

function CircuitBoardVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"
    >
      <ScreenFrame title="Tarjetas electrónicas" className="min-h-[400px]">
        <div className="grid h-full gap-4 p-6 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-[24px] border border-[#d8e1dc] bg-[#183330] p-5">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:38px_38px]" />
            <div className="relative grid h-full gap-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((col) => (
                    <div
                      key={`${row}-${col}`}
                      className="h-20 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#214742_0%,#17312d_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                    >
                      <div className="mx-auto mt-4 h-8 w-14 rounded-md bg-[#9fb9b2]/25" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {[
              "Relación directa con las áreas que generan el material.",
              "Lectura comercial por tipo de empresa y excedente.",
              "Conexión con compradores especializados sin intermediación innecesaria.",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-[#d7dfdb] bg-white px-5 py-5 text-[15px] leading-7 text-[#29413d]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

function DashboardVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4"
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ScreenFrame title="Área de control" className="min-h-[320px]">
          <div className="grid gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <AnimatedMetric label="Compras activas" value={184} active={active} />
              <AnimatedMetric label="Proveedores" value={67} active={active} />
              <AnimatedMetric label="Lotes trazados" value={24} active={active} />
            </div>
            <div className="rounded-2xl border border-[#d7dfdb] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-[#5f746d]">Capital invertido</p>
                  <p className="mt-2 text-3xl font-semibold text-[#183330]">$128k</p>
                </div>
                <div>
                  <p className="text-sm text-[#5f746d]">Historial operativo</p>
                  <div className="mt-3 h-2 rounded-full bg-[#e7ece9]">
                    <div className="h-2 w-[78%] rounded-full bg-[#234c4b]" />
                  </div>
                  <p className="mt-3 text-sm text-[#4c625b]">Lectura unificada de compras, kilos, pesos y lotes.</p>
                </div>
              </div>
            </div>
          </div>
        </ScreenFrame>

        <div className="grid gap-4">
          <ScreenFrame title="Administrador" className="min-h-[152px]">
            <div className="grid gap-3 p-5 text-sm text-[#28423d]">
              {["Proveedores", "Clientes", "Catálogo", "Precios metales"].map((item) => (
                <div key={item} className="rounded-xl border border-[#dbe2de] px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </ScreenFrame>

          <ScreenFrame title="Compradores" className="min-h-[152px]">
            <div className="grid gap-3 p-5">
              {[
                ["Kenny", "24 clientes activos"],
                ["Marlen", "18 visitas programadas"],
                ["Campo", "12 seguimientos hoy"],
              ].map(([name, stat]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-[#dbe2de] px-4 py-3 text-sm">
                  <span className="font-medium text-[#1e3733]">{name}</span>
                  <span className="text-[#60746d]">{stat}</span>
                </div>
              ))}
            </div>
          </ScreenFrame>
        </div>
      </div>
    </motion.div>
  );
}

function CampaignVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4"
    >
      <ScreenFrame title="Campañas WhatsApp" className="min-h-[420px]">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-[#e0e6e2] bg-[#f6f9f7] p-5 lg:border-b-0 lg:border-r">
            <p className="text-sm font-medium text-[#28423d]">Segmentos activos</p>
            <div className="mt-4 grid gap-3">
              {[
                ["Panamá", "42 contactos válidos"],
                ["Colón", "18 contactos válidos"],
                ["Interior", "26 contactos válidos"],
              ].map(([zone, total]) => (
                <div key={zone} className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-4">
                  <p className="font-medium text-[#1c3430]">{zone}</p>
                  <p className="mt-1 text-sm text-[#5f746d]">{total}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-[24px] border border-[#d8e1dc] bg-white p-5">
              <p className="text-sm font-medium text-[#24423d]">Vista previa de campaña</p>
              <div className="mt-4 space-y-3">
                <div className="max-w-[82%] rounded-[18px] bg-[#eff4f1] px-4 py-3 text-sm leading-6 text-[#2f4742]">
                  Hola, estamos organizando rutas de compra en tu zona y queremos mantenernos en contacto para próximos materiales disponibles.
                </div>
                <div className="ml-auto max-w-[80%] rounded-[18px] bg-[#234c4b] px-4 py-3 text-sm leading-6 text-white">
                  Seguimos activos en Panamá y Colón. Si tienes material, podemos programar visita o revisión comercial.
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#dde4e0] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#70827b]">Automatización</p>
                  <p className="mt-2 text-base text-[#213b37]">Mensajes por zona y tipo de audiencia.</p>
                </div>
                <div className="rounded-2xl border border-[#dde4e0] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#70827b]">Continuidad</p>
                  <p className="mt-2 text-base text-[#213b37]">Comunicación estable con la red comercial.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScreenFrame>
    </motion.div>
  );
}

function StatementVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-[#d6ded9] bg-white px-8 py-12 text-center shadow-[0_18px_50px_rgba(22,44,39,0.08)]"
    >
      <div className="max-w-4xl">
        <p className="text-4xl font-semibold leading-[1.12] tracking-tight text-[#183330] md:text-6xl">
          “No competimos por comprar una pieza más.
        </p>
        <p className="mt-6 text-2xl leading-[1.3] text-[#35504a] md:text-4xl">
          Construimos una red de abastecimiento basada en información, relaciones comerciales y procesos.”
        </p>
      </div>
    </motion.div>
  );
}

function ClosingVisual({ active }: { active: boolean }) {
  return (
    <motion.div
      variants={slideTransition}
      initial="hidden"
      animate={active ? "visible" : "hidden"}
      className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]"
    >
      <ScreenFrame title="Relación de largo plazo" className="min-h-[360px]">
        <div className="grid h-full gap-4 p-6">
          <div className="rounded-[24px] border border-[#d7dfdb] bg-[#f6f9f7] p-6">
            <p className="text-sm text-[#5f756e]">Propuesta</p>
            <p className="mt-3 text-3xl font-semibold leading-tight text-[#17322f]">
              Un aliado estratégico con visión compartida de crecimiento y disciplina operativa.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {["Tecnología", "Organización", "Relaciones comerciales"].map((item) => (
              <div key={item} className="rounded-2xl border border-[#d7dfdb] bg-white px-4 py-4 text-sm text-[#28413c]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </ScreenFrame>

      <div className="flex min-h-[360px] flex-col justify-between rounded-[30px] border border-[#d6ded9] bg-[#234c4b] p-8 text-white shadow-[0_20px_60px_rgba(16,34,30,0.14)]">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-white/62">PMG Metales Panama</p>
          <p className="mt-8 text-4xl font-semibold leading-tight">
            Construyendo el futuro del abastecimiento organizado.
          </p>
        </div>
        <div className="space-y-2 text-sm text-white/72">
          <p>PMG Metales Panamá</p>
          <p>Operación comercial respaldada por información y procesos.</p>
        </div>
      </div>
    </motion.div>
  );
}

function SlideBody({
  slide,
  active,
}: {
  slide: PresentationSlide;
  active: boolean;
}) {
  const Icon = iconMap[slide.visual];

  return (
    <div className="grid min-h-[100svh] gap-10 px-6 py-8 md:px-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,0.95fr)] lg:px-14 lg:py-10">
      <div className="flex min-w-0 flex-col justify-between py-4 lg:py-8">
        <motion.div
          variants={slideTransition}
          initial="hidden"
          animate={active ? "visible" : "hidden"}
          className="max-w-[720px]"
        >
          <div className="flex items-center justify-between gap-4">
            <img
              src="/images/Logos/pmg-logo-wordmark-desktop.svg"
              alt="PMG Metales"
              className="h-10 w-auto"
            />
            <div className="hidden items-center gap-3 rounded-full border border-[#d8e0db] bg-white px-4 py-2 text-sm text-[#49605a] shadow-sm md:flex">
              <Icon className="h-4 w-4 text-[#234c4b]" />
              <span>{slide.step} / 10</span>
            </div>
          </div>

          <h1 className="mt-8 max-w-[820px] text-[44px] font-semibold leading-[0.96] tracking-[-0.04em] text-[#15312e] sm:text-[56px] lg:text-[74px]">
            {slide.title}
          </h1>

          {slide.body ? (
            <div className="mt-8 grid gap-5 text-lg leading-8 text-[#36504a] md:text-[21px] md:leading-9">
              {slide.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {slide.bullets ? (
            <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-2">
              {slide.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-[#d8e0db] bg-white px-4 py-4 text-base text-[#28423d] shadow-sm"
                >
                  {bullet}
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>

        <div className="mt-10 flex items-center gap-3 text-sm text-[#60746d]">
          <ChevronDown className="h-4 w-4" />
          <span>Teclado, scroll y botones para navegar</span>
        </div>
      </div>

      <div className="flex items-center py-2 lg:py-8">{renderVisual(slide, active)}</div>
    </div>
  );
}

function renderVisual(slide: PresentationSlide, active: boolean) {
  switch (slide.visual) {
    case "hero":
      return <HeroVisual active={active} />;
    case "opportunity-map":
      return <PresentationPanamaMap markers={panamaOpportunityMarkers} />;
    case "technology":
      return <TechnologyVisual active={active} />;
    case "network-map":
      return <PresentationPanamaMap markers={panamaNetworkMarkers} network />;
    case "catalysts":
      return <CatalystVisual active={active} />;
    case "electronics":
      return <CircuitBoardVisual active={active} />;
    case "dashboard":
      return <DashboardVisual active={active} />;
    case "campaigns":
      return <CampaignVisual active={active} />;
    case "statement":
      return <StatementVisual active={active} />;
    case "closing":
      return <ClosingVisual active={active} />;
    default:
      return null;
  }
}

export default function PresentationDeck() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(index, presentacionSlides.length - 1));
    slideRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    const nodes = slideRefs.current.filter(Boolean) as HTMLElement[];
    if (!root || nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const index = Number((visibleEntry.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActiveIndex(index);
      },
      {
        root,
        threshold: [0.35, 0.55, 0.75],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, goToSlide]);

  const progressLabel = useMemo(
    () => `${String(activeIndex + 1).padStart(2, "0")} / ${String(presentacionSlides.length).padStart(2, "0")}`,
    [activeIndex],
  );

  return (
    <div className="relative h-[100svh] overflow-hidden bg-[#f6f8f6] text-[#17322f]">
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      >
        {presentacionSlides.map((slide, index) => (
          <section
            key={slide.id}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            data-index={index}
            className="snap-start border-b border-[#e5ebe7]"
          >
            <SlideBody slide={slide} active={index === activeIndex} />
          </section>
        ))}
      </div>

      <div className="pointer-events-none fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
        <div className="pointer-events-auto rounded-[22px] border border-[#d7dfdb] bg-white/92 px-3 py-4 shadow-[0_16px_40px_rgba(22,44,39,0.10)] backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            {presentacionSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-[#234c4b] text-white"
                    : "text-[#48605a] hover:bg-[#eff4f1]"
                }`}
              >
                <span className="w-6 font-medium">{slide.step}</span>
                <span className="max-w-[120px] truncate">{slide.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 px-4">
        <div className="pointer-events-auto mx-auto flex max-w-[1120px] items-center justify-between gap-3 rounded-[20px] border border-[#d7dfdb] bg-white/92 px-4 py-3 shadow-[0_16px_40px_rgba(22,44,39,0.10)] backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#15312e]">{presentacionSlides[activeIndex]?.title}</p>
            <p className="text-xs text-[#60746d]">{progressLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-[#d7dfdb] bg-white px-4 text-[#15312e] hover:bg-[#eff4f1]"
              onClick={() => goToSlide(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full bg-[#234c4b] px-4 text-white hover:bg-[#1c3c39]"
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
