"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/app/admin/leads/actions";

const statuses = [
  "Ny",
  "Kontaktad",
  "Bokad",
  "Avslutad",
] as const;

type Props = {
  leadId: number;
  currentStatus: string;
};

export default function StatusSelect({
  leadId,
  currentStatus,
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      disabled={isPending}
      defaultValue={currentStatus}
      onChange={(e) => {
        const status = e.target.value as
          | "Ny"
          | "Kontaktad"
          | "Bokad"
          | "Avslutad";

        startTransition(async () => {
          try {
            await updateLeadStatus(leadId, status);
          } catch (err) {
            console.error(err);
            alert("Kunde inte uppdatera status.");
          }
        });
      }}
      className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white"
    >
      {statuses.map((status) => (
        <option
          key={status}
          value={status}
        >
          {status}
        </option>
      ))}
    </select>
  );
}