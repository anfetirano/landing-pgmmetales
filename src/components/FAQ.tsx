"use client";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";

import SectionTitle from "./SectionTitle";
import { faqs } from "@/data/faq";
import { footerDetails } from "@/data/footer";

const FAQ: React.FC = () => {
  const email = footerDetails?.email ?? "info@pmgmetales.com";
  const tel = (footerDetails?.telephone ?? "").replace(/\D/g, "");
  const waHref = tel
    ? `https://wa.me/${tel}?text=${encodeURIComponent(
        "Hola, tengo una consulta sobre la venta de catalizadores."
      )}`
    : undefined;

  return (
    <section id="faq" className="py-10 lg:py-20">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Columna título/intro */}
        <div>
          <p className="hidden lg:block text-[#234c4b]/70 uppercase tracking-wide text-sm">
            Preguntas
          </p>

          <SectionTitle>
            <h2 className="my-3 !leading-snug lg:max-w-sm text-center lg:text-left text-[#234c4b] font-extrabold">
              Preguntas frecuentes
            </h2>
          </SectionTitle>

          <p className="lg:mt-10 text-foreground-accent text-center lg:text-left">
            ¿Tienes dudas? Escríbenos.
          </p>

          <a
            href={`mailto:${email}`}
            className="mt-3 block text-xl lg:text-4xl text-[#234c4b] font-semibold hover:underline text-center lg:text-left"
          >
            {email}
          </a>

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp"
              className="mt-2 inline-block text-base text-[#234c4b]/90 hover:underline text-center lg:text-left"
            >
              o contáctanos por WhatsApp
            </a>
          )}
        </div>

        {/* Columna acordeón */}
        <div className="w-full lg:max-w-2xl mx-auto border-b border-[#234c4b]/15">
          {faqs.map((faq, index) => (
            <div key={index} className="mb-7">
              <Disclosure>
                {({ open }) => (
                  <>
                    <DisclosureButton
                      className="
                        flex items-center justify-between w-full
                        px-4 pt-7 text-left border-t border-[#234c4b]/15
                        rounded-md hover:bg-[#234c4b]/5 transition-colors
                      "
                    >
                      <span className="text-xl md:text-2xl font-semibold text-[#234c4b]">
                        {faq.question}
                      </span>
                      {open ? (
                        <BiMinus className="w-6 h-6 text-[#234c4b]" />
                      ) : (
                        <BiPlus className="w-6 h-6 text-[#234c4b]" />
                      )}
                    </DisclosureButton>

                    <DisclosurePanel className="px-4 pt-4 pb-2 text-foreground-accent">
                      {faq.answer}
                    </DisclosurePanel>
                  </>
                )}
              </Disclosure>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
