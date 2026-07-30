"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

const customerMessage =
  "Hej! Jag vill boka hemstädning varannan vecka.";

const aiMessage =
  "Absolut! Hur stor är bostaden och vilken dag passar dig bäst?";

const workflowSteps = [
  {
    title: "Kunden skriver",
    description: "Kunden beskriver sitt behov direkt på hemsidan.",
    icon: MessageCircle,
  },
  {
    title: "AI analyserar",
    description: "Fansixs AI identifierar tjänst och nästa steg.",
    icon: LoaderCircle,
  },
  {
    title: "AI svarar",
    description: "Kunden får ett relevant svar på några sekunder.",
    icon: Sparkles,
  },
  {
    title: "Offert skapas",
    description: "Ett personligt prisförslag förbereds automatiskt.",
    icon: FileText,
  },
  {
    title: "Bokning skickas",
    description: "Kunden får sin bokningsbekräftelse direkt.",
    icon: CalendarDays,
  },
];

function useTyping(text: string, enabled: boolean, speed = 35) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDisplayedText("");
      return;
    }

    setDisplayedText("");

    let currentIndex = 0;

    const interval = window.setInterval(() => {
      currentIndex += 1;
      setDisplayedText(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [enabled, speed, text]);

  return displayedText;
}

export default function AIDemo() {
  const [activeStep, setActiveStep] = useState(0);

  const typedCustomerMessage = useTyping(
    customerMessage,
    activeStep === 0,
    32,
  );

  const typedAIMessage = useTyping(aiMessage, activeStep === 2, 28);

  useEffect(() => {
    const durations = [3200, 2200, 4200, 2600, 3200];

    const timeout = window.setTimeout(() => {
      setActiveStep((currentStep) =>
        currentStep === workflowSteps.length - 1 ? 0 : currentStep + 1,
      );
    }, durations[activeStep]);

    return () => window.clearTimeout(timeout);
  }, [activeStep]);

  return (
    <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_100px_rgba(76,29,149,0.2)] backdrop-blur-2xl sm:p-8">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Chatt */}
        <div className="rounded-3xl border border-white/10 bg-[#090b18]/80 p-6 text-left sm:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-semibold text-white">Fansixs AI</p>
                <p className="text-sm text-slate-400">
                  Digital medarbetare
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Online
            </div>
          </div>

          <div className="mt-7 flex min-h-[350px] flex-col gap-4">
            <AnimatePresence mode="sync">
              {activeStep >= 0 && (
                <motion.div
                  key="customer-message"
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="ml-auto max-w-[88%] rounded-3xl rounded-br-md bg-gradient-to-br from-blue-600 to-purple-600 px-5 py-4 text-sm leading-6 text-white shadow-lg"
                >
                  {activeStep === 0
                    ? typedCustomerMessage
                    : customerMessage}

                  {activeStep === 0 &&
                    typedCustomerMessage.length < customerMessage.length && (
                      <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-white align-middle" />
                    )}
                </motion.div>
              )}

              {activeStep >= 1 && (
                <motion.div
                  key={
                    activeStep === 1
                      ? "ai-analysis"
                      : "ai-response"
                  }
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="max-w-[92%]"
                >
                  {activeStep === 1 ? (
                    <div className="flex items-center gap-3 rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.05] px-5 py-4 text-sm text-slate-300">
                      <LoaderCircle className="h-5 w-5 animate-spin text-purple-400" />

                      <div>
                        <p>Fansixs AI analyserar kundens behov</p>

                        <div className="mt-2 flex gap-1">
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
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] px-5 py-4 text-sm leading-6 text-slate-200">
                      {activeStep === 2 ? typedAIMessage : aiMessage}

                      {activeStep === 2 &&
                        typedAIMessage.length < aiMessage.length && (
                          <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-purple-300 align-middle" />
                        )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeStep >= 3 && (
                <motion.div
                  key="offer-created"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-300" />

                    <div>
                      <p className="font-semibold text-white">
                        Offert skapad
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Ett personligt prisförslag är klart.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep >= 4 && (
                <motion.div
                  key="booking-complete"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />

                    <div>
                      <p className="font-semibold text-white">
                        Bokning skickad
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Kunden har fått sin bekräftelse direkt.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex gap-2">
            {workflowSteps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                aria-label={`Visa steg ${index + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeStep === index
                    ? "w-8 bg-purple-400"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Arbetsflöde */}
        <div className="rounded-3xl border border-white/10 bg-[#090b18]/60 p-6 text-left sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
            Automatiserat arbetsflöde
          </p>

          <h3 className="mt-4 text-2xl font-bold sm:text-3xl">
            Från första fråga till färdig bokning
          </h3>

          <p className="mt-4 leading-7 text-slate-400">
            Fansixs AI hjälper kunden genom hela processen utan att du behöver
            svara manuellt.
          </p>

          <div className="mt-8 space-y-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isComplete = index < activeStep;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`w-full rounded-2xl border p-4 text-left transition duration-300 ${
                    isActive
                      ? "border-purple-400/40 bg-purple-400/10 shadow-[0_0_35px_rgba(168,85,247,0.1)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isActive
                          ? "bg-purple-500 text-white"
                          : isComplete
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-white/[0.06] text-slate-400"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon
                          className={`h-5 w-5 ${
                            isActive && index === 1 ? "animate-spin" : ""
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <div>
              <p className="text-sm text-slate-400">
                Genomsnittlig svarstid
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                Under 5 sekunder
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}