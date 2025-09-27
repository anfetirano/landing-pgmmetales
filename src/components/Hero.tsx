import React from "react";

import { heroDetails, type HeroDetails } from "@/data/hero";
import { footerDetails } from "@/data/footer";

const Hero: React.FC = () => {
  const details: HeroDetails = heroDetails;

  const showCenterImage = details.showCenterImage ?? true;

  // WhatsApp desde el teléfono del footer
  const tel = (footerDetails.telephone ?? "").replace(/\D/g, "");
  const waHref =
    `https://wa.me/${tel}?text=` +
    encodeURIComponent("Hola, quiero cotizar mi catalizador. (Pt, Pd, Rh)");

  return (
    <section
      id="hero"
      className="relative flex items-center justify-center pb-0 pt-32 md:pt-40 px-5"
    >
      {/* Fondo cuadriculado original */}
      <div className="absolute left-0 top-0 bottom-0 -z-10 w-full">
        <div className="absolute inset-0 h-full w-full bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
      </div>
      <div className="absolute left-0 right-0 bottom-0 backdrop-blur-[2px] h-40 bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.5)]"></div>

      <div className="text-center">
        <h1
          className="
            text-4xl md:text-6xl lg:text-7xl md:leading-tight lg:leading-[1.1]
            font-extrabold tracking-tight mx-auto
            max-w-2xl md:max-w-4xl lg:max-w-5xl
            text-[#234c4b]
          "
        >
          {details.heading}
        </h1>

        <p className="mt-5 text-foreground/85 text-base md:text-lg lg:text-xl max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto">
          {details.subheading}
        </p>

        {/* CTA a WhatsApp */}
        <div className="mt-8 md:mt-10 w-fit mx-auto">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Cotizar en línea por WhatsApp"
            className="inline-flex items-center justify-center bg-[#234c4b] hover:bg-[#1e3f3e] text-white px-8 md:px-10 py-3 md:py-4 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#234c4b]"
          >
            {details.ctaText ?? "Cotizar en línea"}
          </a>
        </div>

        {/* Placeholder en lugar de la imagen */}
        {showCenterImage && (
          <div
            role="img"
            aria-label="Espacio reservado para imagen del hero (16:9)"
            className="
              relative mt-10 md:mt-12 lg:mt-14 mx-auto z-10
              w-full h-auto
              max-w-[560px] sm:max-w-[640px] md:max-w-[720px] lg:max-w-[820px]
              rounded-2xl border-2 border-dashed border-gray-300
              bg-white/60
            "
          >
            <div className="aspect-[16/9] flex items-center justify-center px-6 text-gray-500 text-sm md:text-base">
              Espacio para imagen del hero (16:9)
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
