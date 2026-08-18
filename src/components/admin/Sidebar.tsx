"use client";

import {
  Bot,
  CalendarDays,
  FileText,
  Home,
  ReceiptText,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: Users,
  },
  {
    label: "Kalender",
    href: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    label: "AI-assistent",
    href: "/admin/ai",
    icon: Bot,
  },
  {
    label: "Offerter",
    href: "/admin/offers",
    icon: FileText,
  },
  {
    label: "Fakturor",
    href: "/admin/invoices",
    icon: ReceiptText,
  },
  {
    label: "Inställningar",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#080b16]/95 p-5 backdrop-blur-2xl lg:flex lg:flex-col">
      <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-purple-600/10 blur-[90px]" />

      <div className="relative flex items-center gap-3 px-2 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-[0_10px_35px_rgba(124,58,237,0.35)]">
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <div>
          <p className="text-xl font-bold tracking-tight text-white">
            Fansixs
          </p>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            AI CRM Platform
          </p>
        </div>
      </div>

      <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <nav className="relative space-y-1.5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Arbetsyta
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-white shadow-[inset_0_0_0_1px_rgba(168,85,247,0.18)]"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-purple-400 to-blue-400" />
              )}

              <Icon
                className={`h-5 w-5 shrink-0 transition ${
                  active
                    ? "text-purple-300"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />

              <span>{item.label}</span>

              {item.label === "AI-assistent" && (
                <span className="ml-auto rounded-full border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>

            <div>
              <p className="text-sm font-semibold text-white">
                AI-system online
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Alla tjänster fungerar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white">
            F
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              Fansixs
            </p>

            <p className="truncate text-xs text-slate-500">
              Administratör
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-700">
          Fansixs CRM v1.0
        </p>
      </div>
    </aside>
  );
}