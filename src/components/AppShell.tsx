"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  return (
    <>
      {!hideChrome && <Header />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
