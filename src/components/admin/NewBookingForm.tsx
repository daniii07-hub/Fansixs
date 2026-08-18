"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type BookingStatus =
  | "Bekräftad"
  | "Väntar"
  | "Avbokad"
  | "Utförd";

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  city: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string;
};

const initialForm: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  service: "",
  city: "",
  bookingDate: "",
  startTime: "",
  endTime: "",
  status: "Bekräftad",
  notes: "",
};

type Props = {
  leadId?: number
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  service?: string;
  city?: string;
};

export default function NewBookingForm({
  leadId,
  customerName = "",
  customerEmail = "",
  customerPhone = "",
  service = "",
  city = "",
}: Props) {

  const router = useRouter();

  const [form, setForm] = useState<FormState>({
  ...initialForm,
  customerName,
  customerEmail,
  customerPhone,
  service,
  city,
});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccess("");

    if (!form.customerName.trim()) {
      setError("Fyll i kundens namn.");
      return;
    }

    if (!form.service.trim()) {
      setError("Fyll i vilken tjänst som ska bokas.");
      return;
    }

    if (!form.bookingDate) {
      setError("Välj ett bokningsdatum.");
      return;
    }

    if (!form.startTime) {
      setError("Välj en starttid.");
      return;
    }

    if (
      form.endTime &&
      form.endTime <= form.startTime
    ) {
      setError(
        "Sluttiden måste vara senare än starttiden.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            leadId,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          service: form.service,
          city: form.city,
          bookingDate: form.bookingDate,
          startTime: form.startTime,
          endTime: form.endTime,
          status: form.status,
          notes: form.notes,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Bokningen kunde inte sparas.",
        );
      }

      setForm(initialForm);
      setSuccess("Bokningen har sparats.");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ett oväntat fel inträffade.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">
          Ny bokning
        </p>

        <h2 className="mt-3 text-2xl font-semibold text-white">
          Lägg till ett jobb i kalendern
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Fyll i kunduppgifter, tjänst, datum och tid.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Kundens namn *
            </span>

            <input
              type="text"
              value={form.customerName}
              onChange={(event) =>
                updateField(
                  "customerName",
                  event.target.value,
                )
              }
              placeholder="Anna Andersson"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Tjänst *
            </span>

            <input
              type="text"
              value={form.service}
              onChange={(event) =>
                updateField(
                  "service",
                  event.target.value,
                )
              }
              placeholder="Hemstädning"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              E-post
            </span>

            <input
              type="email"
              value={form.customerEmail}
              onChange={(event) =>
                updateField(
                  "customerEmail",
                  event.target.value,
                )
              }
              placeholder="kund@example.com"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Telefon
            </span>

            <input
              type="tel"
              value={form.customerPhone}
              onChange={(event) =>
                updateField(
                  "customerPhone",
                  event.target.value,
                )
              }
              placeholder="0701234567"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Ort
            </span>

            <input
              type="text"
              value={form.city}
              onChange={(event) =>
                updateField("city", event.target.value)
              }
              placeholder="Stockholm"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Status
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as BookingStatus,
                )
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-white outline-none transition focus:border-purple-400/40"
            >
              <option value="Bekräftad">
                Bekräftad
              </option>
              <option value="Väntar">Väntar</option>
              <option value="Avbokad">Avbokad</option>
              <option value="Utförd">Utförd</option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Datum *
            </span>

            <input
              type="date"
              value={form.bookingDate}
              onChange={(event) =>
                updateField(
                  "bookingDate",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Starttid *
            </span>

            <input
              type="time"
              value={form.startTime}
              onChange={(event) =>
                updateField(
                  "startTime",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-purple-400/40"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">
              Sluttid
            </span>

            <input
              type="time"
              value={form.endTime}
              onChange={(event) =>
                updateField(
                  "endTime",
                  event.target.value,
                )
              }
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-purple-400/40"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            Anteckningar
          </span>

          <textarea
            value={form.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            rows={4}
            placeholder="Portkod, särskilda önskemål eller annan information..."
            className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/40"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Sparar bokning..."
              : "Spara bokning"}
          </button>
        </div>
      </form>
    </section>
  );
}