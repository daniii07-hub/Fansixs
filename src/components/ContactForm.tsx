"use client";

import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { trackLeadFormSubmission } from "@/lib/analytics";

type FormStatus = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.name || !payload.company || !payload.email) {
      setStatus("error");
      setErrorMessage("Fyll i namn, företag och e-postadress.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.message || "Det gick inte att skicka förfrågan.",
        );
      }

      setStatus("success");
      trackLeadFormSubmission();
      form.reset();
    } catch (error) {
      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ett oväntat fel inträffade. Försök igen.",
      );
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300">
          Kostnadsfri demo
        </p>

        <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
          Se hur Fansixs kan hjälpa ditt företag
        </h2>

        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Berätta kort om ditt företag så visar vi hur en AI-medarbetare kan
          hjälpa er med kundservice, offertförfrågningar och bokningar.
        </p>

        <div className="mt-10 space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-400/10">
              <CheckCircle2 className="h-5 w-5 text-purple-300" />
            </div>

            <div>
              <p className="font-semibold text-white">Kostnadsfritt</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Demon är helt kostnadsfri och utan förpliktelser.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10">
              <CheckCircle2 className="h-5 w-5 text-blue-300" />
            </div>

            <div>
              <p className="font-semibold text-white">
                Anpassat efter företaget
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Vi visar lösningen utifrån era tjänster och behov.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>

            <div>
              <p className="font-semibold text-white">Enkelt nästa steg</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Efter demon får ni ett tydligt förslag utan tekniskt krångel.
              </p>
            </div>
          </div>
        </div>

        <a
          href="mailto:fansixsinfo@gmail.com"
          className="mt-10 inline-flex items-center gap-3 text-sm text-slate-400 transition hover:text-white"
        >
          <Mail className="h-4 w-4 text-purple-300" />
          fansixsinfo@gmail.com
        </a>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="rounded-[2rem] border border-white/10 bg-[#090b18]/75 p-6 text-left shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Namn *
            </span>

            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Ditt namn"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-400/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Företag *
            </span>

            <div className="relative">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                name="company"
                required
                maxLength={150}
                autoComplete="organization"
                placeholder="Företagets namn"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-400/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              E-post *
            </span>

            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                name="email"
                required
                maxLength={200}
                autoComplete="email"
                placeholder="namn@foretag.se"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-400/10"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Telefon
            </span>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="tel"
                name="phone"
                maxLength={50}
                autoComplete="tel"
                placeholder="070-123 45 67"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-400/10"
              />
            </div>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Vad vill ni få hjälp med?
          </span>

          <textarea
            name="message"
            rows={5}
            maxLength={3000}
            placeholder="Exempel: Vi vill automatisera kundfrågor och offertförfrågningar..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-400/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-400/10"
          />
        </label>

        {status === "error" && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        {status === "success" && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Tack! Din demoförfrågan har skickats till Fansixs.
          </p>
        )}

        <motion.button
          type="submit"
          disabled={status === "sending"}
          whileHover={{ scale: status === "sending" ? 1 : 1.02 }}
          whileTap={{ scale: status === "sending" ? 1 : 0.98 }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 px-7 py-4 font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.35)] transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sending" ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Skickar förfrågan...
            </>
          ) : (
            <>
              Skicka demoförfrågan
              <Send className="h-4 w-4" />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          Uppgifterna används endast för att kontakta dig om din förfrågan.
        </p>
      </motion.form>
    </div>
  );
}