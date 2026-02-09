"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { Transition } from "@headlessui/react";
import { HiOutlineXMark, HiBars3 } from "react-icons/hi2";

import Container from "./Container";
import { siteDetails } from "@/data/siteDetails";
import { menuItems as rawMenuItems } from "@/data/menuItems";

type RawMenuItem = { text?: string; label?: string; href?: string; url?: string };
type MenuItem = { text: string; href: string };

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen((o) => !o);

  // Normaliza para evitar href undefined
  const menuItems: MenuItem[] = Array.isArray(rawMenuItems)
    ? (rawMenuItems as RawMenuItem[])
        .map((i) => ({
          text: i?.text ?? i?.label ?? "",
          href: i?.href ?? i?.url ?? "#",
        }))
        .filter((i) => i.text && i.href)
    : [];

  return (
    <header className="bg-transparent fixed top-0 left-0 right-0 md:absolute z-50 mx-auto w-full">
      <Container className="!px-0">
        <nav className="shadow-md md:shadow-none bg-white md:bg-transparent mx-auto flex justify-between items-center py-2 px-5 md:py-10">
          {/* Logo PMG */}
          <Link href="/" className="flex items-center gap-2" aria-label="Ir al inicio">
            {/* Móvil */}
            <Image
              src="/images/Logos/pmg-logo-wordmark-movil.svg"
              alt="PMG Metales"
              width={160}
              height={28}
              priority
              className="block md:hidden h-7 w-auto"
            />
            {/* Desktop */}
            <Image
              src="/images/Logos/pmg-logo-wordmark-desktop.svg"
              alt="PMG Metales"
              width={200}
              height={40}
              className="hidden md:block h-10 w-auto"
            />
            <span className="sr-only">{siteDetails.siteName}</span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.href}
                  className="text-foreground hover:text-foreground-accent transition-colors"
                >
                  {item.text}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                role="button"
                aria-label="Ingresar"
                className="text-white bg-[#234c4b] hover:bg-[#1e3f3e] px-8 py-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#234c4b]"
              >
                Ingresar
              </Link>
            </li>
          </ul>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/sign-in"
              role="button"
              aria-label="Ingresar"
              className="text-white bg-[#234c4b] hover:bg-[#1e3f3e] px-4 py-2 rounded-full text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#234c4b]"
            >
              Ingresar
            </Link>

            <button
              onClick={toggleMenu}
              type="button"
              className="bg-primary text-black focus:outline-none rounded-full w-10 h-10 flex items-center justify-center"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
              ) : (
                <HiBars3 className="h-6 w-6" aria-hidden="true" />
              )}
              <span className="sr-only">Toggle navigation</span>
            </button>
          </div>
        </nav>
      </Container>

      {/* Mobile Menu */}
      <Transition
        show={isOpen}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div id="mobile-menu" className="md:hidden bg-white shadow-lg">
          <ul className="flex flex-col space-y-4 pt-1 pb-6 px-6">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.href}
                  className="text-foreground hover:text-primary block"
                  onClick={toggleMenu}
                >
                  {item.text}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                role="button"
                aria-label="Ingresar"
                className="text-white bg-[#234c4b] hover:bg-[#1e3f3e] px-5 py-2 rounded-full block w-fit transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#234c4b]"
                onClick={toggleMenu}
              >
                Ingresar
              </Link>
            </li>
          </ul>
        </div>
      </Transition>
    </header>
  );
};

export default Header;
