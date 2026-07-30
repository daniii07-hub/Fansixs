import AIDemo from "@/components/AIDemo";
import AmbientBackground from "@/components/AmbientBackground";
import ContactForm from "@/components/ContactForm";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Reveal from "@/components/Reveal";

const services = [
  {
    title: "Kundservice dygnet runt",
    description:
      "AI-medarbetaren svarar direkt på vanliga frågor, även när du själv är upptagen.",
  },
  {
    title: "Fler offertförfrågningar",
    description:
      "Samla in kundens behov, kontaktuppgifter och önskemål direkt på hemsidan.",
  },
  {
    title: "Mindre administration",
    description:
      "Automatisera repetitiva uppgifter och frigör tid till det som utvecklar företaget.",
  },
];

const steps = [
  {
    number: "01",
    title: "Vi lär känna ditt företag",
    description:
      "Vi går igenom dina tjänster, vanliga kundfrågor och hur du arbetar idag.",
  },
  {
    number: "02",
    title: "Vi bygger din AI-medarbetare",
    description:
      "Vi anpassar AI:n efter ditt företag, ditt språk och dina kunders behov.",
  },
  {
    number: "03",
    title: "AI:n börjar hjälpa dina kunder",
    description:
      "Din digitala medarbetare kan svara, samla in information och skapa nya affärsmöjligheter.",
  },
];

const benefits = [
  {
    icon: "⚡",
    title: "Snabba svar",
    description:
      "Kunder får hjälp på några sekunder istället för att behöva vänta på återkoppling.",
  },
  {
    icon: "🌙",
    title: "Tillgänglig dygnet runt",
    description:
      "Din AI-medarbetare arbetar på kvällar, helger och när du själv är upptagen.",
  },
  {
    icon: "📈",
    title: "Fler möjligheter",
    description:
      "Fånga upp fler kunder och offertförfrågningar direkt när intresset är som störst.",
  },
  {
    icon: "🧠",
    title: "Anpassad för ditt företag",
    description:
      "AI:n tränas på dina tjänster, priser, arbetssätt och vanliga kundfrågor.",
  },
];

const included = [
  "Installation och grundkonfiguration",
  "Anpassning efter ditt företag",
  "Träning på tjänster och kundfrågor",
  "Kundservice och offertförfrågningar",
  "Löpande drift och uppdateringar",
  "Support från Fansixs",
];

const faqs = [
  {
    question: "Vad är en AI-medarbetare?",
    answer:
      "En AI-medarbetare är en digital assistent som kan svara på kundfrågor, samla in information, hantera offertförfrågningar och hjälpa kunder vidare dygnet runt.",
  },
  {
    question: "Kan AI:n anpassas efter mitt företag?",
    answer:
      "Ja. Vi anpassar AI:n efter dina tjänster, arbetssätt, vanliga frågor och hur du vill kommunicera med dina kunder.",
  },
  {
    question: "Måste jag kunna något om AI?",
    answer:
      "Nej. Fansixs sköter installationen och anpassningen. Du behöver inte kunna programmera eller hantera tekniska system.",
  },
  {
    question: "Kan AI:n svara på svenska?",
    answer:
      "Ja. Lösningen byggs för svenska företag och kommunicerar naturligt på svenska.",
  },
  {
    question: "Hur lång tid tar installationen?",
    answer:
      "Tiden beror på lösningens omfattning, men en grundläggande AI-medarbetare kan vanligtvis sättas upp inom några arbetsdagar.",
  },
  {
    question: "Vad kostar det?",
    answer:
      "Grundpriset är 4 900 kr i startavgift och därefter 990 kr per månad. Mer avancerade integrationer kan offereras separat.",
  },
];

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#070914] text-white">
      <AmbientBackground />

      <div className="relative z-10">
        <Navbar />
        <Hero />

        {/* Resultat */}
        <section className="relative border-y border-white/10 px-6 py-10 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-center lg:grid-cols-4">
            <Reveal delay={0.05}>
              <div>
                <p className="text-3xl font-bold sm:text-4xl">24/7</p>
                <p className="mt-2 text-sm text-slate-400">
                  Tillgänglig för kunder
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div>
                <p className="text-3xl font-bold sm:text-4xl">&lt; 5 sek</p>
                <p className="mt-2 text-sm text-slate-400">
                  Genomsnittlig svarstid
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div>
                <p className="text-3xl font-bold sm:text-4xl">100%</p>
                <p className="mt-2 text-sm text-slate-400">
                  Anpassad efter företaget
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div>
                <p className="text-3xl font-bold sm:text-4xl">0</p>
                <p className="mt-2 text-sm text-slate-400">
                  Tekniska kunskaper krävs
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Våra AI-lösningar */}
        <section
          id="tjanster"
          className="relative overflow-hidden px-6 py-28"
        >
          <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[140px]" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Våra AI-lösningar
                </p>

                <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  En digital medarbetare som hjälper dig varje dag
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  Fansixs automatiserar kundkontakt, bokningar,
                  offertförfrågningar och repetitiva uppgifter så att du kan
                  fokusera på att utveckla företaget.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Reveal delay={0.1}>
                <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-purple-400/40 hover:bg-white/[0.08] hover:shadow-[0_20px_70px_rgba(168,85,247,0.15)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl transition duration-300 group-hover:scale-110">
                    💬
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">AI Kundservice</h3>

                  <p className="mt-4 leading-7 text-slate-400">
                    Svarar direkt på vanliga frågor och hjälper dina kunder
                    dygnet runt.
                  </p>
                </article>
              </Reveal>

              <Reveal delay={0.2}>
                <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-blue-400/40 hover:bg-white/[0.08] hover:shadow-[0_20px_70px_rgba(59,130,246,0.15)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl transition duration-300 group-hover:scale-110">
                    📅
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">AI Bokningar</h3>

                  <p className="mt-4 leading-7 text-slate-400">
                    Hjälper kunder att välja rätt tjänst och boka en tid
                    automatiskt.
                  </p>
                </article>
              </Reveal>

              <Reveal delay={0.3}>
                <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-fuchsia-400/40 hover:bg-white/[0.08] hover:shadow-[0_20px_70px_rgba(217,70,239,0.15)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-2xl transition duration-300 group-hover:scale-110">
                    📄
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">AI Offert</h3>

                  <p className="mt-4 leading-7 text-slate-400">
                    Samlar in kundens behov och kontaktuppgifter direkt på
                    hemsidan.
                  </p>
                </article>
              </Reveal>

              <Reveal delay={0.4}>
                <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.05] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-violet-400/40 hover:bg-white/[0.08] hover:shadow-[0_20px_70px_rgba(139,92,246,0.15)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl transition duration-300 group-hover:scale-110">
                    ⚡
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    AI Automatisering
                  </h3>

                  <p className="mt-4 leading-7 text-slate-400">
                    Automatiserar repetitiva uppgifter och sparar värdefull tid
                    varje vecka.
                  </p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Varför Fansixs */}
        <section id="fordelar" className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="font-semibold text-purple-400">
                  Varför Fansixs?
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                  Mer tid. Snabbare svar. Fler möjligheter.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  En AI-medarbetare tar hand om återkommande kundkontakt så att
                  du kan fokusera på arbetet som faktiskt driver företaget
                  framåt.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {services.map((service, index) => (
                <Reveal key={service.title} delay={index * 0.12}>
                  <article className="group h-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-purple-400/30 hover:bg-white/[0.07]">
                    <div className="mb-6 h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.25)] transition duration-300 group-hover:scale-110 group-hover:rotate-3" />

                    <h3 className="text-xl font-semibold">{service.title}</h3>

                    <p className="mt-4 leading-7 text-slate-400">
                      {service.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Fördelar */}
        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 backdrop-blur-xl sm:p-12">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                      Byggd för småföretag
                    </p>

                    <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                      Missa inte nästa kund
                    </h2>

                    <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                      Många kunder kontaktar flera företag samtidigt. Den som
                      svarar snabbt har ofta störst chans att få uppdraget.
                    </p>

                    <a
                      href="#kontakt"
                      className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-[#070914] transition hover:scale-105"
                    >
                      Boka en kostnadsfri demo
                    </a>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {benefits.map((benefit) => (
                      <article
                        key={benefit.title}
                        className="rounded-2xl border border-white/10 bg-black/20 p-6"
                      >
                        <div className="text-2xl">{benefit.icon}</div>

                        <h3 className="mt-4 text-lg font-semibold">
                          {benefit.title}
                        </h3>

                        <p className="mt-3 leading-7 text-slate-400">
                          {benefit.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Så fungerar det */}
        <section id="sa-fungerar-det" className="px-6 py-24 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-12">
              <div className="max-w-3xl">
                <p className="font-semibold text-purple-400">
                  Enkelt från start
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                  Så fungerar det
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  Du behöver inte vara teknisk. Vi hjälper dig från första
                  samtalet till en färdig AI-medarbetare.
                </p>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {steps.map((step, index) => (
                  <Reveal key={step.title} delay={index * 0.15}>
                    <article className="group h-full rounded-3xl border border-white/10 bg-black/20 p-7 transition duration-300 hover:border-purple-400/30 hover:bg-white/[0.04]">
                      <div className="text-5xl font-bold text-white/10 transition duration-300 group-hover:text-purple-400/30">
                        {step.number}
                      </div>

                      <h3 className="mt-5 text-xl font-semibold">
                        {step.title}
                      </h3>

                      <p className="mt-4 leading-7 text-slate-400">
                        {step.description}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* Demo */}
        <section
          id="demo"
          className="relative overflow-hidden px-6 py-24 text-center lg:px-8"
        >
          <div className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
          <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[140px]" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Se Fansixs i arbete
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                  Från kundfråga till bokning på några sekunder
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                  Se hur en digital medarbetare kan svara kunden, samla in
                  information, skapa en offert och hjälpa till med bokningen.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <AIDemo />
            </Reveal>
          </div>
        </section>

        {/* Pris */}
        <section id="pris" className="relative px-6 py-28 lg:px-8">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[150px]" />

          <div className="relative mx-auto max-w-5xl">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Enkelt pris
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                  Kom igång utan stora investeringar
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-400">
                  En tydlig startkostnad och en fast månadsavgift. Inga
                  tekniska kunskaper krävs.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-[2rem] border border-purple-400/30 bg-white/[0.06] shadow-[0_30px_100px_rgba(139,92,246,0.16)] backdrop-blur-2xl">
                <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-8 text-center sm:p-10">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-300">
                    Fansixs AI-medarbetare
                  </p>

                  <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:items-end">
                    <span className="text-5xl font-bold sm:text-6xl">
                      4 900 kr
                    </span>

                    <span className="pb-1 text-slate-400">startavgift</span>
                  </div>

                  <p className="mt-4 text-xl font-semibold text-white">
                    Därefter 990 kr per månad
                  </p>
                </div>

                <div className="p-8 sm:p-10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {included.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm text-emerald-300">
                          ✓
                        </span>

                        <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#kontakt"
                    className="mt-10 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 px-7 py-4 font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.35)] transition duration-300 hover:scale-[1.02]"
                  >
                    Boka en gratis demo
                  </a>

                  <p className="mt-5 text-center text-sm text-slate-500">
                    Eventuella avancerade integrationer offereras separat.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">
                  Vanliga frågor
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                  Det här undrar företag ofta
                </h2>
              </div>
            </Reveal>

            <div className="mt-12 space-y-4">
              {faqs.map((faq, index) => (
                <Reveal key={faq.question} delay={index * 0.05}>
                  <details className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl open:border-purple-400/30 open:bg-white/[0.06]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold text-white">
                      {faq.question}

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-purple-300 transition group-open:rotate-45">
                        +
                      </span>
                    </summary>

                    <p className="mt-5 max-w-3xl leading-7 text-slate-400">
                      {faq.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Kontaktformulär */}
        <section
          id="kontakt"
          className="relative overflow-hidden px-6 py-28 lg:px-8"
        >
          <div className="absolute left-0 top-1/2 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-blue-600/10 blur-[150px]" />
          <div className="absolute right-0 top-1/2 h-[450px] w-[450px] -translate-y-1/2 rounded-full bg-purple-600/10 blur-[150px]" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <Reveal>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-blue-500/10 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-10 lg:p-14">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="border-t border-white/10 px-6 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
            <p>
              © {new Date().getFullYear()} Fansixs. AI gjort enkelt för
              småföretag.
            </p>

            <a
              href="mailto:fansixsinfo@gmail.com"
              className="transition hover:text-white"
            >
              fansixsinfo@gmail.com
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}