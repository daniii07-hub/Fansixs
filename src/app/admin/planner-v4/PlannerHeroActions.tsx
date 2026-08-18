"use client";

import Link from "next/link";
import {
  Bot,
  Sparkles,
} from "lucide-react";

type Props = {
  newJobHref?: string;
  optimizerTargetId?: string;
};

export default function PlannerHeroActions({
  newJobHref = "/admin/calendar",
  optimizerTargetId =
    "planner-route-optimizer",
}: Props) {
  function scrollToOptimizer() {
    const target =
      document.getElementById(
        optimizerTargetId,
      );

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.history.replaceState(
      null,
      "",
      `#${optimizerTargetId}`,
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href={newJobHref}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
      >
        <Sparkles className="h-4 w-4 text-purple-300" />
        Nytt jobb
      </Link>

      <button
        type="button"
        onClick={scrollToOptimizer}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02]"
      >
        <Bot className="h-4 w-4" />
        Optimera schema
      </button>
    </div>
  );
}
