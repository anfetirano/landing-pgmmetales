import Hero from "@/components/Hero";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing/Pricing";
import FAQ from "@/components/FAQ";
import Logos from "@/components/Logos";
import Benefits from "@/components/Benefits/Benefits";
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
        <Benefits />

        {/* Antes era "pricing" con planes. Ahora es el proceso */}
        <Section
          id="proceso"
          title="Nuestro proceso de compra"
          description="Así de fácil: cotizas, recolectamos, pagamos y te entregamos certificado."
        >
          <Pricing />
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
