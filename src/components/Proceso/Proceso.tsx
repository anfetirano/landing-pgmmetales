import PasoCard from "./PasoCard";
import { steps, type ProcessStep } from "@/data/proceso";

const Proceso: React.FC = () => {
  return (
    <section id="proceso" className="relative">
      {/* línea conectora (solo desktop) */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="mx-auto h-px w-full max-w-6xl bg-[#234c4b]/10" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {steps.map((step: ProcessStep, index: number) => (
          <PasoCard key={step.name} step={step} index={index} />
        ))}
      </div>
    </section>
  );
};

export default Proceso;
