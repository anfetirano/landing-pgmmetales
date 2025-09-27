import { BsAwardFill, BsLightningChargeFill } from "react-icons/bs";
import { PiFlaskBold } from "react-icons/pi";

import { IStats } from "@/types";

/**
 * Mensajes enfocados en confianza:
 * - Experiencia comprobada
 * - Valoración precisa (XRF)
 * - Pago inmediato
 */
export const stats: IStats[] = [
  {
    title: "10+ años de experiencia",
    icon: <BsAwardFill size={20} />,
    description:
      "Trayectoria en la compra y valorización de catalizadores en LATAM. Procesos claros y soporte permanente.",
  },
  {
    title: "Análisis XRF preciso",
    icon: <PiFlaskBold size={22} />,
    description:
      "Tecnología de fluorescencia de rayos X para estimar contenidos de Pt, Pd y Rh con rapidez y confiabilidad.",
  },
  {
    title: "Pago inmediato",
    icon: <BsLightningChargeFill size={20} />,
    description:
      "Transferimos al recibir y validar el material. Acuerdos con refinería para ofrecer mejores condiciones.",
  },
];

export default stats;
