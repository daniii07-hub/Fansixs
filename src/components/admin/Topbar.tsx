"use client";

import {
  Bell,
  Bot,
  Menu,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type TopbarProps = {
  onMenuClick?: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const [search, setSearch] = useState("");

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060914]/85 backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Öppna meny"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Sök leads, kunder eller tjänster..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400/40 focus:bg-white/[0.06]"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-semibold text-emerald-200">
              AI online
            </span>
          </div>

          <button
            type="button"
            aria-label="AI-assistent"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.06] text-purple-300 transition hover:bg-purple-400/[0.1] hover:text-white"
          >
            <Bot className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Notifikationer"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#060914] bg-purple-400" />
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Fansixs
              </p>

              <p className="truncate text-xs text-slate-500">
                Administratör
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}