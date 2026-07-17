"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import ConvexClientProvider from "@/components/ConvexClientProvider";
import PublicConvexClientProvider from "@/components/PublicConvexClientProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isClerkFreeRoute =
    pathname.startsWith("/presentacion") || pathname.startsWith("/pmr");
  const isSharedQuotationRoute =
    pathname.startsWith("/cotizacion/") || pathname.startsWith("/cotizacion-interna/");

  if (isClerkFreeRoute) {
    return <>{children}</>;
  }

  if (isSharedQuotationRoute) {
    return <PublicConvexClientProvider>{children}</PublicConvexClientProvider>;
  }

  return (
    <ClerkProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
