export type StepIconKey = "quote" | "collection" | "payment" | "certificate";

export interface ProcessStep {
  name: string;
  description: string;
  icon: StepIconKey;
}

export const steps: ProcessStep[] = [
  {
    name: "Cotiza tu material",
    description:
      "Envíanos fotos del catalizador (y código si lo tiene). Estimamos con base en Pt, Pd y Rh.",
    icon: "quote",
  },
  {
    name: "Recolección/entrega",
    description:
      "Coordinamos recolección en tu taller o recibimos en punto acordado, con trazabilidad.",
    icon: "collection",
  },
  {
    name: "Pago",
    description:
      "Validación rápida y pago superior gracias a nuestro acuerdo exclusivo con refinería.",
    icon: "payment",
  },
  {
    name: "Certificado de compra",
    description:
      "Emitimos comprobantes y/o certificados para tu control y respaldo.",
    icon: "certificate",
  },
];

export default steps;
