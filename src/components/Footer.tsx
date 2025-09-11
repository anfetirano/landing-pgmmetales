import Link from "next/link";
import React from "react";

import { siteDetails } from "@/data/siteDetails";
import { footerDetails } from "@/data/footer";
import { getPlatformIconByName } from "@/utils";

type QuickLinkNormalized = { text: string; href: string };

const Footer: React.FC = () => {
  // Normalizamos quickLinks para evitar href/text indefinidos
  const quickLinks: QuickLinkNormalized[] = Array.isArray(footerDetails?.quickLinks)
    ? footerDetails.quickLinks
        .map((l: any) => ({
          text: l?.text ?? l?.label ?? "",
          href: l?.url ?? l?.href ?? "#",
        }))
        .filter((l) => l.text && l.href)
    : [];

  // Socials como pares [platformName, href]
  const socialsEntries = Object.entries(
    (footerDetails?.socials ?? {}) as Record<string, string>
  ).filter(([_, href]) => Boolean(href));

  const email = footerDetails?.email ?? "";
  const telephone = footerDetails?.telephone ?? "";

  return (
    <footer className="bg-hero-background text-foreground py-10">
      <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Marca + subtítulo */}
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
            {/* Wordmark móvil: 28px */}
            <img
              src="/images/Logos/pmg-logo-wordmark-movil.svg"
              alt="PMG Metales"
              className="block md:hidden h-7 w-auto"
            />
            {/* Wordmark desktop: 32px (un poco más pequeño que header para jerarquía) */}
            <img
              src="/images/Logos/pmg-logo-wordmark-desktop.svg"
              alt="PMG Metales"
              className="hidden md:block h-8 w-auto"
            />
            <span className="sr-only">{siteDetails?.siteName ?? "Sitio"}</span>
          </Link>

          {footerDetails?.subheading && (
            <p className="mt-3.5 text-foreground-accent">
              {footerDetails.subheading}
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="text-foreground-accent">
            {quickLinks.map((link) => (
              <li key={link.text} className="mb-2">
                <Link href={link.href} className="hover:text-foreground">
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto + Social */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>

          {email && (
            <a
              href={`mailto:${email}`}
              className="block text-foreground-accent hover:text-foreground"
            >
              Email: {email}
            </a>
          )}

          {telephone && (
            <a
              href={`tel:${telephone}`}
              className="block text-foreground-accent hover:text-foreground"
            >
              Phone: {telephone}
            </a>
          )}

          {socialsEntries.length > 0 && (
            <div className="mt-5 flex items-center gap-5 flex-wrap">
              {socialsEntries.map(([platformName, href]) => (
                <Link
                  href={href}
                  key={platformName}
                  aria-label={platformName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getPlatformIconByName(platformName)}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 md:text-center text-foreground-accent px-6">
        <p>
          Copyright &copy; {new Date().getFullYear()}{" "}
          {siteDetails?.siteName ?? "Sitio"}. All rights reserved.
        </p>
        <p className="text-sm mt-2 text-gray-500">
          Made with &hearts; by{" "}
          <a href="https://nexilaunch.com" target="_blank" rel="noreferrer">
            Nexi Launch
          </a>
        </p>
        <p className="text-sm mt-2 text-gray-500">
          UI kit by{" "}
          
        </p>
      </div>
    </footer>
  );
};

export default Footer;
