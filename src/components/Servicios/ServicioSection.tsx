"use client";
import Image from "next/image";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";

import ServicioBullet from "./ServicioBullet";
import SectionTitle from "../SectionTitle";
import { IBenefit } from "@/types";

interface Props {
  benefit: IBenefit;
  imageAtRight?: boolean;
}

const containerVariants: Variants = {
  offscreen: { opacity: 0, y: 100 },
  onscreen: {
    opacity: 1, y: 0,
    transition: { type: "spring", bounce: 0.2, duration: 0.9, delayChildren: 0.2, staggerChildren: 0.1 }
  }
};

export const childVariants = {
  offscreen: { opacity: 0, x: -50 },
  onscreen: {
    opacity: 1, x: 0,
    transition: { type: "spring", bounce: 0.2, duration: 1 }
  }
};

const ServicioSection: React.FC<Props> = ({ benefit, imageAtRight }: Props) => {
  const { title, description, imageSrc, bullets } = benefit;

  return (
    <section className="benefit-section">
      <motion.div
        className="flex flex-wrap flex-col items-center justify-center gap-2 lg:flex-row lg:gap-20 lg:flex-nowrap mb-24"
        variants={containerVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true }}
      >
        {/* Texto */}
        <div
          className={clsx(
            "flex flex-wrap items-center w-full max-w-lg",
            { "justify-start": imageAtRight, "lg:order-1 justify-end": !imageAtRight }
          )}
        >
          <div className="w-full text-center lg:text-left">
            <motion.div className="flex flex-col w-full" variants={childVariants}>
              <SectionTitle>
                <h3 className="lg:max-w-2xl !text-[#234c4b] font-extrabold">
                  {title}
                </h3>
              </SectionTitle>

              <p className="mt-1.5 mx-auto lg:ml-0 leading-normal text-foreground/85">
                {description}
              </p>
            </motion.div>

            <div className="mx-auto lg:ml-0 w-full">
              {bullets.map((item, index) => (
                <ServicioBullet
                  key={index}
                  title={item.title}
                  icon={item.icon}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Imagen / placeholder */}
        <div className={clsx("mt-5 lg:mt-0", { "lg:order-2": imageAtRight })}>
          <div className={clsx("w-fit flex", { "justify-start": imageAtRight, "justify-end": !imageAtRight })}>
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={title}
                width={384}
                height={216}
                quality={90}
                className="lg:ml-0 rounded-2xl border border-[#234c4b]/15 bg-white shadow"
              />
            ) : (
              <div className="w-[384px] h-[216px] rounded-2xl border-2 border-dashed border-gray-300 bg-white/60 flex items-center justify-center text-gray-500">
                Imagen del servicio
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ServicioSection;
