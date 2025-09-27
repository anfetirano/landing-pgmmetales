import ServicioSection from "./ServicioSection";
import { benefits } from "@/data/servicios";

const Servicios: React.FC = () => {
  return (
    <div id="servicios">
      <h2 className="sr-only">Servicios</h2>
      {benefits.map((item, index) => (
        <ServicioSection
          key={index}
          benefit={item}
          imageAtRight={index % 2 !== 0}
        />
      ))}
    </div>
  );
};

export default Servicios;
