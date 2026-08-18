import Link from "next/link";
import {
  Bot,
  FileText,
  Mail,
  Sparkles,
  Target,
} from "lucide-react";

const tools = [
  {
    title: "Skapa offert",
    description:
      "Öppna ett lead och låt AI skriva ett färdigt offertutkast och kundmejl.",
    href: "/admin/leads",
    icon: FileText,
    badge: "Offert",
  },
  {
    title: "Skriv kundmejl",
    description:
      "Använd AI för att skapa ett professionellt svar utifrån kundens uppgifter.",
    href: "/admin/leads",
    icon: Mail,
    badge: "Mejl",
  },
  {
    title: "Sammanfatta lead",
    description:
      "Få en kort sammanfattning och rekommenderad nästa åtgärd.",
    href: "/admin/leads",
    icon: Sparkles,
    badge: "Analys",
  },
  {
    title: "Prioritera leads",
    description:
      "Granska nya och okontaktade leads och fokusera på dem med störst potential.",
    href: "/admin/dashboard",
    icon: Target,
    badge: "Fokus",
  },
];

export default function AIPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/[0.12] via-white/[0.04] to-blue-500/[0.08] p-6 shadow-2xl shadow-purple-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-950/30">
                <Bot className="h-6 w-6 text-white" />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-purple-300">
                AI Control Center
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Din AI-medarbetare
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Samla alla AI-funktioner på ett ställe och arbeta snabbare
              med leads, offerter, mejl och nästa åtgärd.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>

            <div>
              <p className="text-sm font-semibold text-white">
                AI-system online
              </p>

              <p className="text-xs text-slate-500">
                Redo att hjälpa dig
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              key={tool.title}
              href={tool.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-purple-400/25 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-purple-950/20"
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl transition group-hover:bg-purple-500/15" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                    <Icon className="h-6 w-6 text-purple-300" />
                  </div>

                  <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
                    {tool.badge}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-semibold text-white">
                  {tool.title}
                </h2>

                <p className="mt-3 leading-7 text-slate-400">
                  {tool.description}
                </p>

                <p className="mt-6 text-sm font-semibold text-purple-300 transition group-hover:text-purple-200">
                  Öppna verktyget →
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Så arbetar AI:n
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Från lead till nästa steg
          </h2>

          <div className="mt-6 space-y-4">
            {[
              "Läser kundens uppgifter och behov.",
              "Sammanfattar leadet på ett lättöverskådligt sätt.",
              "Föreslår vad företaget bör göra härnäst.",
              "Skapar offertutkast och färdiga kundmejl.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/15 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-sm font-bold text-purple-300">
                  {index + 1}
                </div>

                <p className="pt-1 text-sm leading-6 text-slate-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-blue-400/15 bg-blue-400/[0.05] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Rekommenderat flöde
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            Börja med dina senaste leads
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            Öppna ett lead, skapa en AI-sammanfattning och generera sedan
            ett offertutkast. Då får du hela arbetsflödet på samma sida.
          </p>

          <Link
            href="/admin/leads"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Gå till leads
          </Link>
        </aside>
      </section>
    </div>
  );
}