import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  FileText,
  ReceiptText,
  Sparkles,
  UserPlus,
} from "lucide-react";

export type ActivityType =
  | "lead_created"
  | "invoice_created"
  | "invoice_sent"
  | "work_order_completed"
  | "signature_added"
  | "ai_generated";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  href?: string | null;
};

type Props = {
  activities: ActivityItem[];
};

const activityStyles: Record<
  ActivityType,
  {
    icon: typeof UserPlus;
    iconClassName: string;
    containerClassName: string;
  }
> = {
  lead_created: {
    icon: UserPlus,
    iconClassName: "text-blue-200",
    containerClassName:
      "border-blue-400/20 bg-blue-400/10",
  },
  invoice_created: {
    icon: ReceiptText,
    iconClassName: "text-purple-200",
    containerClassName:
      "border-purple-400/20 bg-purple-400/10",
  },
  invoice_sent: {
    icon: FileText,
    iconClassName: "text-amber-200",
    containerClassName:
      "border-amber-400/20 bg-amber-400/10",
  },
  work_order_completed: {
    icon: CheckCircle2,
    iconClassName: "text-emerald-200",
    containerClassName:
      "border-emerald-400/20 bg-emerald-400/10",
  },
  signature_added: {
    icon: Sparkles,
    iconClassName: "text-cyan-200",
    containerClassName:
      "border-cyan-400/20 bg-cyan-400/10",
  },
  ai_generated: {
    icon: Bot,
    iconClassName: "text-fuchsia-200",
    containerClassName:
      "border-fuchsia-400/20 bg-fuchsia-400/10",
  },
};

function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ActivityContent({
  activity,
}: {
  activity: ActivityItem;
}) {
  const style =
    activityStyles[activity.type];
  const Icon = style.icon;

  return (
    <div className="flex gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${style.containerClassName}`}
      >
        <Icon
          className={`h-5 w-5 ${style.iconClassName}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-white">
            {activity.title}
          </p>

          <time className="shrink-0 text-xs text-slate-500">
            {formatActivityTime(
              activity.timestamp,
            )}
          </time>
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {activity.description}
        </p>
      </div>
    </div>
  );
}

export default function ActivityFeed({
  activities,
}: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
            Senaste händelser
          </p>

          <h2 className="mt-2 text-xl font-semibold text-white">
            Aktivitet
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Det senaste som hänt i Fansixs CRM.
          </p>
        </div>

        <Sparkles className="h-5 w-5 text-purple-300" />
      </div>

      {activities.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Sparkles className="h-5 w-5 text-slate-500" />
          </div>

          <p className="mt-4 font-medium text-white">
            Ingen aktivitet ännu
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Nya leads, fakturor och arbetsorder kommer att visas här.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {activities.map((activity) =>
            activity.href ? (
              <Link
                key={activity.id}
                href={activity.href}
                className="block px-6 py-5 transition hover:bg-white/[0.035]"
              >
                <ActivityContent
                  activity={activity}
                />
              </Link>
            ) : (
              <div
                key={activity.id}
                className="px-6 py-5"
              >
                <ActivityContent
                  activity={activity}
                />
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}