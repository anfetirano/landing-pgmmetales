import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Proceso from "@/components/Proceso/Proceso";

import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Servicios from "@/components/Servicios/Servicios";
import Container from "@/components/Container";
import Section from "@/components/Section";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <Logos />
      <Container>
        <Servicios />



        {/* Antes era "pricing" con planes. Ahora es el proceso */}
        <Section
          id="proceso"
          title="Nuestro proceso de compra"
          description="Así de fácil: cotizas, recolectamos, pagamos y te entregamos certificado."
        >
          <Proceso />
        </Section>

        <Section
          id="testimonios"
          title="Lo que dicen nuestros clientes"
          description="Opiniones de talleres aliados: pagos inmediatos, atención y cumplimiento."
        >
          <Testimonials />
        </Section>

        <FAQ />

        <Stats />

        <CTA />
      </Container>
    </>
  );
};

export default HomePage;
