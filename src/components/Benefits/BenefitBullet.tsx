import { motion } from "framer-motion";

import { IBenefitBullet } from "@/types";
import { childVariants } from "./BenefitSection";

const BenefitBullet: React.FC<IBenefitBullet> = ({ title, description, icon }: IBenefitBullet) => {
  return (
    <motion.div
      className="flex flex-col items-center mt-8 gap-3 lg:gap-5 lg:flex-row lg:items-start"
      variants={childVariants}
    >
      <div className="flex justify-center mx-auto lg:mx-0 flex-shrink-0 mt-3 w-fit">
        <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl border border-[#234c4b]/20 bg-[#234c4b]/5 flex items-center justify-center text-[#234c4b]">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-foreground">
          {title}
        </h4>
        <p className="text-base text-foreground/80 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default BenefitBullet;
