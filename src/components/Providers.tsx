"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import ConvexClientProvider from "@/components/ConvexClientProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isClerkFreeRoute =
    pathname.startsWith("/presentacion") || pathname.startsWith("/pmr");

  if (isClerkFreeRoute) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider>
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
