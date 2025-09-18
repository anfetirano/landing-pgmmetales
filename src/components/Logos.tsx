"use client";

import React from "react";

const BRANDS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "BMW",
  "Mercedes",
  "Audi",
  "Volkswagen",
  "Hyundai",
  "Kia",
  "Renault",
  "Peugeot",
  "Fiat",
  "Volvo",
];

const Logos: React.FC = () => {
  // Duplicamos la lista solo dentro de la pista para lograr loop infinito
  const items = [...BRANDS, ...BRANDS];

  return (
    <section id="logos" className="py-32 px-5 bg-background">
      {/* Título con el estilo anterior */}
      <p className="text-lg font-medium text-center">
        Compramos todas las marcas de catalizadores
      </p>

      {/* Carrusel (una sola fila) */}
      <div className="mt-5 relative w-full overflow-hidden">
        <div
          className="
            marquee flex items-center gap-8 sm:gap-12
          "
          aria-hidden="true"
        >
          {items.map((brand, i) => (
            <div
              key={`${brand}-${i}`}
              className="
                flex h-12 md:h-14 w-32 md:w-40 items-center justify-center
                rounded-xl border border-gray-200 bg-white/70
                text-gray-500 text-sm md:text-base
              "
              role="img"
              aria-label={`Logo ${brand}`}
              title={brand}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>

      {/* Animación (sin segunda fila) */}
      <style jsx>{`
        .marquee {
          width: max-content;
          animation: scroll var(--duration, 30s) linear infinite;
          will-change: transform;
        }
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
};

export default Logos;
