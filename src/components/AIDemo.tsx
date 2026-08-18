"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Lead = {
  name: string;
  phone: string;
  email: string;
  service: string;
  size: string;
  propertyType: string;
  city: string;
  desiredDate: string;
  frequency: string;
};

type ChatResponse = {
  reply?: string;
  leadCompleted?: boolean;
  lead?: Lead;
  message?: string;
};

type LeadSendStatus = "idle" | "sending" | "sent" | "error";

type LeadResponse = {
  success?: boolean;
  message?: string;
};

const starterQuestions = [
  "Jag behöver hemstädning",
  "Jag behöver flyttstädning",
  "Vad kostar kontorsstädning?",
];

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hej! Jag är en AI-medarbetare för en städfirma. Hur kan jag hjälpa dig idag?",
  },
];

const emptyLead: Lead = {
  name: "",
  phone: "",
  email: "",
  service: "",
  size: "",
  propertyType: "",
  city: "",
  desiredDate: "",
  frequency: "",
};

export default function AIDemo() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [leadCompleted, setLeadCompleted] = useState(false);
  const [lead, setLead] = useState<Lead>(emptyLead);
  const [leadSendStatus, setLeadSendStatus] =
    useState<LeadSendStatus>("idle");
  const [leadSendError, setLeadSendError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const leadSentRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading, leadCompleted]);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      120,
    )}px`;
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    setInput(event.target.value);
    setError("");

    window.requestAnimationFrame(resizeTextarea);
  }

  async function sendLead(completedLead: Lead) {
    if (leadSentRef.current) {
      return;
    }

    leadSentRef.current = true;
    setLeadSendStatus("sending");
    setLeadSendError("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead: completedLead,
        }),
      });

      const data = (await response.json()) as LeadResponse;

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message ||
            "Offertförfrågan kunde inte skickas just nu.",
        );
      }

      setLeadSendStatus("sent");
    } catch (caughtError) {
      leadSentRef.current = false;
      setLeadSendStatus("error");
      setLeadSendError(
        caughtError instanceof Error
          ? caughtError.message
          : "Offertförfrågan kunde inte skickas.",
      );
    }
  }

  async function sendMessage(messageText?: string) {
    const trimmedMessage = (messageText ?? input).trim();

    if (!trimmedMessage || isLoading || leadCompleted) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = (await response.json()) as ChatResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI:n kunde inte svara just nu. Försök igen.",
        );
      }

      if (!data.reply) {
        throw new Error("AI:n returnerade inget svar.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);

      if (data.lead) {
        setLead(data.lead);
      }

      if (data.leadCompleted === true && data.lead) {
        setLeadCompleted(true);
        void sendLead(data.lead);
      }
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Något gick fel. Försök igen.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function resetConversation() {
    if (isLoading) {
      return;
    }

    setMessages(initialMessages);
    setInput("");
    setError("");
    setLeadCompleted(false);
    setLead(emptyLead);
    setLeadSendStatus("idle");
    setLeadSendError("");
    leadSentRef.current = false;

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  const leadRows = [
    {
      label: "Namn",
      value: lead.name,
    },
    {
      label: "Telefon",
      value: lead.phone,
    },
    {
      label: "E-post",
      value: lead.email,
    },
    {
      label: "Tjänst",
      value: lead.service,
    },
    {
      label: "Storlek",
      value: lead.size,
    },
    {
      label: "Typ",
      value: lead.propertyType,
    },
    {
      label: "Ort",
      value: lead.city,
    },
    {
      label: "Önskat datum",
      value: lead.desiredDate,
    },
    {
      label: "Frekvens",
      value: lead.frequency,
    },
  ].filter((row) => row.value.trim().length > 0);

  return (
    <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_100px_rgba(76,29,149,0.2)] backdrop-blur-2xl sm:p-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#090b18]/90 text-left">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="font-semibold text-white">
                  Fansixs AI
                </p>

                <p className="text-sm text-slate-400">
                  Digital säljare för städföretag
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Online
            </div>
          </div>

          <div
            aria-live="polite"
            className="flex h-[460px] flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-7"
          >
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <motion.div
                    key={`${message.role}-${index}-${message.content}`}
                    initial={{
                      opacity: 0,
                      y: 12,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className={`flex items-end gap-2 ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                        <Bot className="h-4 w-4 text-purple-300" />
                      </div>
                    )}

                    <div
                      className={`max-w-[84%] whitespace-pre-wrap rounded-3xl px-5 py-3.5 text-sm leading-6 sm:max-w-[76%] ${
                        isUser
                          ? "rounded-br-md bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg"
                          : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-200"
                      }`}
                    >
                      {message.content}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10">
                        <User className="h-4 w-4 text-blue-300" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                    <Bot className="h-4 w-4 text-purple-300" />
                  </div>

                  <div className="flex items-center gap-3 rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] px-5 py-4">
                    <LoaderCircle className="h-4 w-4 animate-spin text-purple-300" />

                    <span className="text-sm text-slate-300">
                      AI:n analyserar
                    </span>

                    <div className="flex gap-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="h-1.5 w-1.5 rounded-full bg-purple-300"
                          animate={{
                            opacity: [0.25, 1, 0.25],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: dot * 0.18,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {leadCompleted && (
                <motion.div
                  key="lead-completed"
                  initial={{
                    opacity: 0,
                    y: 15,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  className="rounded-3xl border border-emerald-400/25 bg-emerald-400/10 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15">
                      <ClipboardCheck className="h-5 w-5 text-emerald-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">
                        Offertförfrågan är klar
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {leadSendStatus === "sending" &&
                          "Alla uppgifter är klara och skickas nu."}

                        {leadSendStatus === "sent" &&
                          "Offertförfrågan har skickats till företaget."}

                        {leadSendStatus === "error" &&
                          "Uppgifterna är klara, men mejlet kunde inte skickas."}

                        {leadSendStatus === "idle" &&
                          "Alla nödvändiga uppgifter har samlats in."}
                      </p>

                      {leadRows.length > 0 && (
                        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-black/10 p-4">
                          {leadRows.map((row) => (
                            <div
                              key={row.label}
                              className="flex items-start justify-between gap-4 text-sm"
                            >
                              <span className="text-slate-400">
                                {row.label}
                              </span>

                              <span className="text-right font-medium text-white">
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-4 sm:p-5">
            {messages.length === 1 && !leadCompleted && (
              <div className="mb-4 flex flex-wrap gap-2">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void sendMessage(question)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-slate-300 transition hover:border-purple-400/30 hover:bg-purple-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            {!leadCompleted ? (
              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-3"
              >
                <div className="relative flex-1">
                  <MessageCircle className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-500" />

                  <textarea
                    ref={textareaRef}
                    value={input}
                    rows={1}
                    maxLength={1000}
                    disabled={isLoading}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Skriv till AI-medarbetaren..."
                    aria-label="Skriv ett meddelande"
                    className="min-h-[54px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] py-4 pl-12 pr-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-400/50 focus:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Skicka meddelande"
                  className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_10px_30px_rgba(124,58,237,0.3)] transition hover:scale-[1.03] hover:shadow-[0_12px_35px_rgba(124,58,237,0.45)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-center">
                <p className="text-sm font-semibold text-emerald-200">
                  {leadSendStatus === "sending" &&
                    "Skickar offertförfrågan..."}

                  {leadSendStatus === "sent" &&
                    "Offertförfrågan är skickad"}

                  {leadSendStatus === "error" &&
                    "Utskicket misslyckades"}

                  {leadSendStatus === "idle" &&
                    "Offertförfrågan är komplett"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {leadSendStatus === "sending" &&
                    "Vänta medan uppgifterna skickas via Resend."}

                  {leadSendStatus === "sent" &&
                    "Företaget har fått kundens uppgifter via mejl."}

                  {leadSendStatus === "error" &&
                    leadSendError}

                  {leadSendStatus === "idle" &&
                    "Alla uppgifter har samlats in."}
                </p>

                {leadSendStatus === "error" && (
                  <button
                    type="button"
                    onClick={() => void sendLead(lead)}
                    className="mt-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.1]"
                  >
                    Försök skicka igen
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xs leading-5 text-slate-500">
                {leadCompleted
                  ? "Demon är färdig."
                  : "Tryck Enter för att skicka och Shift + Enter för en ny rad."}
              </p>

              {messages.length > 1 && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={resetConversation}
                  className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Börja om
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#090b18]/60 p-6 text-left sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-purple-400">
            Riktig AI-agent
          </p>

          <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Från kundfråga till färdigt lead
          </h3>

          <p className="mt-4 leading-7 text-slate-400">
            AI:n svarar på frågor, samlar in kunduppgifter och
            bygger en komplett offertförfrågan automatiskt.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                title: "Svarar direkt",
                description:
                  "Kunden får hjälp även när företaget är stängt.",
              },
              {
                title: "Samlar rätt uppgifter",
                description:
                  "AI:n frågar efter tjänst, storlek, ort, datum och kontaktuppgifter.",
              },
              {
                title: "Kvalificerar kunden",
                description:
                  "Tidigare svar sparas så att kunden inte behöver upprepa sig.",
              },
              {
                title: "Skapar offertunderlag",
                description:
                  "När allt är komplett skapas ett strukturerat lead.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-purple-300" />

              <div>
                <p className="font-semibold text-white">
                  Mer än en vanlig chatbot
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  AI:n arbetar mot ett mål: att skapa en komplett
                  offertförfrågan för företaget.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            När offertförfrågan är komplett skickas uppgifterna
            automatiskt via Resend.
          </p>
        </div>
      </div>
    </div>
  );
}