"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { footerDetails, type FooterDetails } from "@/data/footer";

type QuickLink = { text: string; url: string };

const Footer: React.FC = () => {
  const details: FooterDetails = footerDetails;

  const quickLinks: QuickLink[] = Array.isArray(details.quickLinks)
    ? details.quickLinks.map(({ text, url }) => ({ text, url }))
    : [];

  const socials = details.socials ?? {};

  return (
    <footer className="mt-16">
      {/* Panel a ancho completo */}
      <div className="w-full">
        <div
          className="
            w-full rounded-none md:rounded-3xl
            border border-gray-200 bg-white
            shadow-[0_20px_60px_rgba(35,76,75,0.06)]
          "
        >
          {/* Contenido principal */}
          <div className="mx-auto max-w-7xl px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Col 1: Marca */}
            <div>
              {/* Móvil */}
              <Image
                src="/images/Logos/pmg-logo-wordmark-movil.svg"
                alt="PMG Metales"
                width={160}
                height={28}
                priority
                className="h-7 w-auto md:hidden"
              />
              {/* Desktop */}
              <Image
                src="/images/Logos/pmg-logo-wordmark-desktop.svg"
                alt="PMG Metales"
                width={200}
                height={32}
                className="hidden md:block h-8 w-auto"
              />
              <p className="mt-4 text-sm text-gray-700">{details.subheading}</p>

              {/* CTA WhatsApp */}
              {details.telephone && (
                <a
                  href={`https://wa.me/${(details.telephone ?? "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    mt-5 inline-flex items-center gap-2 rounded-full
                    border border-[#234c4b]/20 px-4 py-2
                    text-sm font-medium text-[#234c4b]
                    hover:bg-[#234c4b] hover:text-white
                    transition-colors
                  "
                  aria-label="Cotizar por WhatsApp"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M20.5 3.5A11 11 0 0 0 3.4 20.6L2 22l1.6-.4A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 20.5Zm5.1-6.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.6-.9-.8-1.6-1.9-1.7-2.2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.2-.7-1.8-1-2.4-.3-.7-.6-.6-.7-.6h-.6c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.8 4.4.7.3 1.3.6 1.7.7.7.2 1.3.2 1.8.1.5-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4 0-.1-.1-.1-.3-.2Z"
                    />
                  </svg>
                  Cotizar por WhatsApp
                </a>
              )}
            </div>

            {/* Col 2: Enlaces rápidos */}
            <div>
              <h3 className="font-semibold mb-3 text-[#234c4b]">ENLACES RÁPIDOS</h3>
              <ul className="space-y-2">
                {quickLinks.map((l) => (
                  <li key={l.text}>
                    <Link
                      href={l.url}
                      className="text-gray-700 hover:text-[#234c4b] transition-colors"
                    >
                      {l.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Contacto / Social */}
            <div>
              <h3 className="font-semibold mb-3 text-[#234c4b]">CONTÁCTANOS</h3>
              <ul className="space-y-1 text-gray-700">
                {details.email && (
                  <li>
                    Email:{" "}
                    <a
                      href={`mailto:${details.email}`}
                      className="hover:text-[#234c4b] transition-colors"
                    >
                      {details.email}
                    </a>
                  </li>
                )}
                {details.telephone && (
                  <li>
                    Teléfono:{" "}
                    <a
                      href={`tel:${details.telephone}`}
                      className="hover:text-[#234c4b] transition-colors"
                    >
                      {details.telephone}
                    </a>
                  </li>
                )}
              </ul>

              <h4 className="mt-5 font-semibold mb-2 text-[#234c4b]">SÍGUENOS</h4>
              <div className="flex items-center gap-3 text-gray-700">
                {Object.entries(socials).map(([name, href]) => (
                  <Link
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${name}`}
                    className="
                      inline-flex h-9 w-9 items-center justify-center
                      rounded-md border border-gray-300
                      hover:border-[#234c4b] hover:text-[#234c4b]
                      transition-colors
                    "
                  >
                    {name.toLowerCase() === "linkedin" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5S1 4.6 1 3.5 1.9 1.5 3 1.5s1.98.9 1.98 2zM1.5 8h3V22h-3V8zm7 0h2.9v1.9h.1c.4-.8 1.5-1.9 3.1-1.9 3.3 0 3.9 2.2 3.9 5V22h-3v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V22h-3V8z"
                        />
                      </svg>
                    ) : name.toLowerCase() === "instagram" ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2.2a2.8 2.8 0 110 5.6 2.8 2.8 0 010-5.6zM17.8 6.2a1 1 0 110 2 1 1 0 010-2z"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs capitalize">{name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright DENTRO del panel */}
          <div className="border-t border-gray-200 px-5">
            <div className="mx-auto max-w-7xl py-4 text-center text-sm text-gray-600">
              © {new Date().getFullYear()} PMG Metales. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
