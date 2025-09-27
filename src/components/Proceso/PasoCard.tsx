import React from "react";
import { FiMessageSquare, FiTruck, FiCreditCard, FiFileText } from "react-icons/fi";
import type { ProcessStep } from "@/data/proceso";

const ICONS: Record<ProcessStep["icon"], React.ComponentType<{ className?: string }>> = {
  quote: FiMessageSquare,
  collection: FiTruck,
  payment: FiCreditCard,
  certificate: FiFileText,
};

interface Props {
  step: ProcessStep;
  index: number;
}

const PasoCard: React.FC<Props> = ({ step, index }) => {
  const Icon = ICONS[step.icon];
  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      className="
        relative mx-auto w-full max-w-sm lg:max-w-full
        rounded-2xl border border-[#234c4b]/15 bg-white/90 backdrop-blur-sm
        p-6 shadow-sm hover:shadow-md transition-shadow
      "
    >
      {/* punto conector (desktop) */}
      <div className="pointer-events-none absolute left-1/2 top-0 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
        <span className="block h-3 w-3 rounded-full border border-[#234c4b]/30 bg-white shadow" />
      </div>

      {/* encabezado con icono y número */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#234c4b]/20 bg-[#234c4b]/5">
          <Icon className="h-6 w-6 text-[#234c4b]" />
        </div>
        <div>
          <p className="text-xs tracking-widest text-[#234c4b]/70">PASO</p>
          <p className="text-xl font-extrabold text-[#234c4b]">{num}</p>
        </div>
      </div>

      {/* contenido */}
      <h3 className="mt-4 text-lg md:text-xl font-semibold text-[#234c4b]">
        {step.name}
      </h3>
      <p className="mt-2 leading-relaxed text-foreground/80">
        {step.description}
      </p>
    </div>
  );
};

export default PasoCard;
