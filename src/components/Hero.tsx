import React from "react";
import Image from "next/image";
import Link from "next/link";

import { heroDetails } from "@/data/hero";
import { footerDetails } from "@/data/footer";

const Hero: React.FC = () => {
  // Flags controladas desde heroDetails
  const showStoreButtons = (heroDetails as any)?.showStoreButtons ?? false;
  const showCenterImage = (heroDetails as any)?.showCenterImage ?? true;

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
      {/* Fondo cuadriculado de la plantilla */}
      <div className="absolute left-0 top-0 bottom-0 -z-10 w-full">
        <div className="absolute inset-0 h-full w-full bg-hero-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>
      </div>

      <div className="absolute left-0 right-0 bottom-0 backdrop-blur-[2px] h-40 bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.5)]"></div>

      <div className="text-center">
        {/* Heading más protagonista y ancho en XL */}
        <h1
          className="
            text-4xl md:text-6xl lg:text-7xl md:leading-tight lg:leading-[1.1]
            font-extrabold tracking-tight mx-auto
            max-w-2xl md:max-w-4xl lg:max-w-5xl
            bg-gradient-to-r from-[#234c4b] to-[#1e3f3e] bg-clip-text text-transparent
          "
        >
          {heroDetails.heading}
        </h1>
        {/* Si prefieres color sólido en vez de gradiente, cambia la línea anterior por:
            className="... text-[#234c4b]" (y elimina bg-clip/text-transparent)
        */}

        {/* Párrafo con mejor proporción en desktop */}
        <p className="mt-5 text-foreground/85 text-base md:text-lg lg:text-xl max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto">
          {heroDetails.subheading}
        </p>

        {/* CTA a WhatsApp */}
        {!showStoreButtons && (
          <div className="mt-8 md:mt-10 w-fit mx-auto">
            <Link
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cotizar en línea por WhatsApp"
              className="inline-flex items-center justify-center bg-[#234c4b] hover:bg-[#1e3f3e] text-white px-8 md:px-10 py-3 md:py-4 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#234c4b]"
            >
              {heroDetails.ctaText ?? "Cotizar en línea"}
            </Link>
          </div>
        )}

        {showCenterImage && !!heroDetails.centerImageSrc && (
          <Image
            src={heroDetails.centerImageSrc}
            width={384}
            height={340}
            quality={100}
            sizes="(max-width: 768px) 100vw, 384px"
            priority={true}
            unoptimized={true}
            alt="app mockup"
            className="relative mt-12 md:mt-16 mx-auto z-10"
          />
        )}
      </div>
    </section>
  );
};

export default Hero;
