"use client";

import Link from "next/link";
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
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Col 1: Marca */}
        <div>
          {/* Usamos <img> para respetar los tamaños del manual; Next/Image opcional */}
          <img
            src="/images/Logos/pmg-logo-wordmark-movil.svg"
            alt="PMG Metales"
            className="h-7 w-auto md:hidden"
          />
          <img
            src="/images/Logos/pmg-logo-wordmark-desktop.svg"
            alt="PMG Metales"
            className="hidden md:block h-8 w-auto"
          />
          <p className="mt-4 text-sm text-gray-700">
            {details.subheading}
          </p>
        </div>

        {/* Col 2: Enlaces rápidos */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((l) => (
              <li key={l.text}>
                <Link href={l.url} className="text-gray-700 hover:text-[#234c4b]">
                  {l.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Contacto */}
        <div>
          <h3 className="font-semibold mb-3">Contact Us</h3>
          <ul className="space-y-1 text-gray-700">
            {details.email && (
              <li>
                Email:{" "}
                <a href={`mailto:${details.email}`} className="hover:text-[#234c4b]">
                  {details.email}
                </a>
              </li>
            )}
            {details.telephone && (
              <li>
                Phone:{" "}
                <a href={`tel:${details.telephone}`} className="hover:text-[#234c4b]">
                  {details.telephone}
                </a>
              </li>
            )}
          </ul>

          {/* Socials */}
          <div className="mt-4 flex items-center gap-3 text-gray-700">
            {Object.entries(socials).map(([name, href]) => (
              <Link
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:border-[#234c4b]"
              >
                {/* Íconos mínimos por nombre */}
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

      <div className="border-t border-gray-200 py-6 text-center text-sm text-gray-600">
        Copyright © {new Date().getFullYear()} PMG Metales. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
