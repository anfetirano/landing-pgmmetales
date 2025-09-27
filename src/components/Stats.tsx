import { stats } from "@/data/confianza"

const Stats: React.FC = () => {
  return (
    <section id="stats" className="py-10 lg:py-20">
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="group rounded-2xl border border-gray-200/70 bg-white p-6 text-center sm:text-left shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="mb-3 flex items-center gap-3 text-2xl md:text-3xl font-extrabold justify-center sm:justify-start text-[#234c4b]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#234c4b]/10 text-[#234c4b]">
                {stat.icon}
              </span>
              {stat.title}
            </h3>
            <p className="text-foreground-accent leading-relaxed">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
