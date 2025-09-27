import { motion } from "framer-motion";
import { IBenefitBullet } from "@/types";
import { childVariants } from "./ServicioSection";

const ServicioBullet: React.FC<IBenefitBullet> = ({ title, description, icon }) => {
  return (
    <motion.div
      className="mt-8 flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:gap-5"
      variants={childVariants}
    >
      <div className="mx-auto mt-3 w-fit flex-shrink-0 justify-center lg:mx-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#234c4b]/20 bg-[#234c4b]/5 text-[#234c4b]">
          <span className="inline-flex">{icon}</span>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-[#234c4b]">{title}</h4>
        <p className="text-base leading-relaxed text-foreground-accent">{description}</p>
      </div>
    </motion.div>
  );
};

export default ServicioBullet;
