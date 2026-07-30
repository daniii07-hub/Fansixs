"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

const customerMessage =
  "Hej! Vad kostar flyttstäd för en lägenhet på 70 m²?";

const aiMessage =
  "Hej! För en lägenhet på 70 m² kostar flyttstäd från 2 490 kr. Vill du boka en tid direkt?";

const stages = [
  "Kundfråga",
  "Analyserar",
  "AI svarar",
  "Offert",
  "Bokning",
];

function useTyping(text: string, enabled: boolean, speed: number) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDisplayedText("");
      return;
    }

    let index = 0;
    setDisplayedText("");

    const interval = window.setInterval(() => {
      index += 1;
      setDisplayedText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [enabled, speed, text]);

  return displayedText;
}

export default function Hero() {
  const [activeStage, setActiveStage] = useState(0);
  const reduceMotion = useReducedMotion();

  const typedCustomerMessage = useTyping(
    customerMessage,
    activeStage === 0,
    30
  );

  const typedAIMessage = useTyping(aiMessage, activeStage === 2, 22);

  useEffect(() => {
    const durations = [2500, 1800, 3300, 2100, 2800];

    const timeout = window.setTimeout(() => {
      setActiveStage((current) =>
        current === stages.length - 1 ? 0 : current + 1
      );
    }, durations[activeStage]);

    return () => window.clearTimeout(timeout);
  }, [activeStage]);

  return (
    <section className="relative min-h-screen overflow-hidden px-6 pb-24 pt-36 text-white sm:pt-40">
      <motion.div
        aria-hidden="true"
        className="absolute left-[8%] top-40 h-72 w-72 rounded-full bg-purple-600/10 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 40, -10, 0],
                y: [0, 30, 80, 0],
                scale: [1, 1.12, 0.95, 1],
              }
        }
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="absolute right-[5%] top-52 h-96 w-96 rounded-full bg-blue-500/10 blur-[140px]"
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -60, 20, 0],
                y: [0, 70, -20, 0],
                scale: [1, 0.94, 1.1, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-white/[0.05] px-4 py-2 text-sm text-purple-200 shadow-[0_0_30px_rgba(168,85,247,0.08)] backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-400" />
            </span>

            <Sparkles className="h-4 w-4" />
            AI för svenska småföretag
          </motion.div>

          <h1 className="mt-9 max-w-3xl text-5xl font-bold leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Din nya
            <span className="mt-2 block bg-gradient-to-r from-blue-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI-medarbetare
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Fansixs hjälper svenska småföretag att svara kunder, skapa
            offerter och hantera bokningar automatiskt — dygnet runt.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.a
              href="#kontakt"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 px-7 py-4 font-semibold text-white shadow-[0_0_45px_rgba(139,92,246,0.4)]"
            >
              Boka en gratis demo
              <ArrowRight className="h-[18px] w-[18px]" />
            </motion.a>

            <motion.a
              href="#demo"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.09]"
            >
              Se hur det fungerar
            </motion.a>
          </div>

          <div className="mt-14 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:gap-6">
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="mt-1 text-sm text-slate-400">Alltid aktiv</p>
            </div>

            <div>
              <p className="text-2xl font-bold">&lt; 5 sek</p>
              <p className="mt-1 text-sm text-slate-400">Svarstid</p>
            </div>

            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="mt-1 text-sm text-slate-400">På svenska</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <motion.div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-purple-500/25 via-blue-500/10 to-fuchsia-500/20 blur-3xl"
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.45, 0.8, 0.45],
                    scale: [1, 1.035, 1],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#090b18]/80 p-5 shadow-[0_35px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-slate-400">
                    Digital medarbetare
                  </p>
                  <h2 className="mt-0.5 text-xl font-semibold">Fansixs AI</h2>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Online
              </div>
            </div>

            <div className="mt-6 flex min-h-[405px] flex-col gap-4">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="max-w-[86%] rounded-3xl rounded-tl-md border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Kund
                  </p>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-200">
                    {activeStage === 0
                      ? typedCustomerMessage
                      : customerMessage}

                    {activeStage === 0 &&
                      typedCustomerMessage.length < customerMessage.length && (
                        <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-white align-middle" />
                      )}
                  </p>
                </motion.div>

                {activeStage === 1 && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 rounded-2xl border border-purple-400/15 bg-purple-400/[0.06] px-4 py-3 text-sm text-slate-300"
                  >
                    <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />
                    Fansixs AI analyserar frågan...

                    <div className="ml-auto flex gap-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-purple-400"
                          animate={{ opacity: [0.25, 1, 0.25] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: dot * 0.18,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeStage >= 2 && (
                  <motion.div
                    key="answer"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ml-auto max-w-[92%] rounded-3xl rounded-tr-md border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                      <MessageCircle className="h-4 w-4" />
                      Fansixs AI
                    </div>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-200">
                      {activeStage === 2 ? typedAIMessage : aiMessage}

                      {activeStage === 2 &&
                        typedAIMessage.length < aiMessage.length && (
                          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-purple-300 align-middle" />
                        )}
                    </p>
                  </motion.div>
                )}

                {activeStage >= 3 && (
                  <motion.div
                    key="offer"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <div className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.07] p-4">
                      <FileText className="h-5 w-5 text-purple-300" />
                      <p className="mt-3 text-sm font-semibold">
                        Offert skapad
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Prisförslag klart
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <Sparkles className="h-5 w-5 text-blue-300" />
                      <p className="mt-3 text-sm font-semibold">
                        Svarstid 2 sek
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Kunden väntade aldrig
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeStage >= 4 && (
                  <motion.div
                    key="booking"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                        <CalendarDays className="h-5 w-5 text-emerald-300" />
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          Bokning skickad
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Kunden har fått bekräftelsen och nästa steg är
                          registrerat.
                        </p>
                      </div>

                      <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-300" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
              <div className="flex gap-2">
                {stages.map((stage, index) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setActiveStage(index)}
                    aria-label={`Visa ${stage}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeStage === index
                        ? "w-8 bg-purple-400"
                        : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-slate-500">
                Automatisk demonstration
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1022]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:flex"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>

            <div>
              <p className="text-xs text-slate-400">Senaste aktivitet</p>
              <p className="text-sm font-semibold">Kund hjälpt automatiskt</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}