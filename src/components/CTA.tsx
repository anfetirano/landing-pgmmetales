// src/components/CTA.tsx
"use client";

import { useState } from "react";
import { ctaDetails } from "@/data/cta";
import QuoteModal from "./QuoteModal";

const CTA: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <section id="cta" className="mt-10 mb-5 lg:my-20">
      <div className="relative z-10 mx-auto py-12 sm:py-20">
        {/* Fondo cuadriculado con color corporativo */}
        <div
          className="
            rounded-3xl opacity-95 absolute inset-0 -z-10 h-full w-full
            bg-[#234c4b]
            bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]
            bg-[size:6rem_4rem]
          "
        >
          <div className="rounded-3xl absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_500px,rgba(255,255,255,0.1),transparent)]" />
        </div>

        <div className="flex flex-col items-center justify-center text-white text-center px-5">
          <h2 className="text-2xl sm:text-3xl md:text-5xl md:leading-tight font-semibold mb-4 max-w-3xl">
            {ctaDetails.heading}
          </h2>

          <p className="mx-auto max-w-2xl md:px-5">
            {ctaDetails.subheading}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-white/95 text-[#234c4b] hover:bg-white px-8 py-3 md:px-10 md:py-4 font-medium transition-colors shadow-sm"
            >
              Cotizar ahora
            </button>
          </div>
        </div>
      </div>

      {/* Modal de cotización */}
      <QuoteModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
};

export default CTA;
