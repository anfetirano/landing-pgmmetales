import type { Metadata } from "next";

import PresentationDeck from "@/components/presentacion/PresentationDeck";

export const metadata: Metadata = {
  title: "PMG Metales Panama | Presentacion",
  description:
    "Presentacion corporativa fullscreen para proveedores internacionales de PMG Metales Panama.",
};

export default function PresentacionPage() {
  return <PresentationDeck />;
}
