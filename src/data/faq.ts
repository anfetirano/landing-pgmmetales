export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "¿Qué compran exactamente?",
    answer:
      "Compramos catalizadores completos (metálicos o cerámicos) y también cerámica triturada (honeycomb). Trabajamos con talleres, recolectores y particulares vinculados.",
  },
  {
    question: "¿Cómo calculan el precio?",
    answer:
      "Nos basamos en el contenido estimado de platino (Pt), paladio (Pd) y rodio (Rh). Nuestro acuerdo exclusivo con refinería nos permite ofrecer precios superiores y consistentes.",
  },
  {
    question: "¿Cómo es el proceso?",
    answer:
      "1) Cotizas por WhatsApp con fotos/código. 2) Coordinamos recolección o entrega. 3) Validamos y pagamos al instante. 4) Emitimos certificado de compra y soportes.",
  },
  {
    question: "¿En qué zonas trabajan?",
    answer:
      "Operamos en Colombia con cobertura nacional mediante recolección y aliados logísticos. Para grandes volúmenes, coordinamos rutas dedicadas.",
  },
  {
    question: "¿Qué métodos de pago manejan?",
    answer:
      "Transferencia inmediata a la cuenta acordada. Para operaciones con varios lotes, podemos manejar cortes y conciliaciones periódicas.",
  },
  {
    question: "¿Qué respaldo entregan?",
    answer:
      "Comprobante/certificado de compra y evidencia de recepción (peso/volumen y fotos si las requieres).",
  },
];

export default faqs;
