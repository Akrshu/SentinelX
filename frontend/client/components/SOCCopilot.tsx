import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

import type { InvestigationResult } from "@/types/investigation";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface SOCCopilotProps {
  investigation: InvestigationResult;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

export default function SOCCopilot({ investigation }: SOCCopilotProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ============================================================
  // ASK AI
  // ============================================================

  async function askAI() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setError("");

    // ----------------------------------------------------------
    // Add user message immediately
    // ----------------------------------------------------------

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);

    setQuestion("");
    setLoading(true);

    try {
      // --------------------------------------------------------
      // Send investigation + question to SentinelX backend
      // --------------------------------------------------------

      const res = await fetch(`${API}/api/copilot`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: trimmedQuestion,
          investigation,
        }),
      });

      console.log("[Sentinel Copilot] HTTP status:", res.status);

      // --------------------------------------------------------
      // Read response
      // --------------------------------------------------------

      let data: {
        answer?: string;
        status?: string;
        detail?: string;
      };

      try {
        data = await res.json();
      } catch {
        throw new Error("SentinelX returned an invalid response.");
      }

      console.log("[Sentinel Copilot] Response:", data);

      // --------------------------------------------------------
      // Backend error
      // --------------------------------------------------------

      if (!res.ok) {
        throw new Error(
          data.detail ||
            data.answer ||
            `Copilot request failed with HTTP ${res.status}.`,
        );
      }

      // --------------------------------------------------------
      // Missing AI answer
      // --------------------------------------------------------

      const answer =
        data.answer?.trim() || "SentinelX did not return an AI response.";

      // --------------------------------------------------------
      // Add AI response
      // --------------------------------------------------------

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (err) {
      console.error("[Sentinel Copilot] Error:", err);

      const message =
        err instanceof Error ? err.message : "Unable to contact SentinelX AI.";

      setError(message);
    } finally {
      setLoading(false);

      // Focus input again
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  // ============================================================
  // KEYBOARD HANDLING
  // ============================================================

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = send
    // Shift + Enter = new line

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (question.trim() && !loading) {
        askAI();
      }
    }
  }

  // ============================================================
  // CLEAR CHAT
  // ============================================================

  function clearChat() {
    setMessages([]);
    setError("");
    setQuestion("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }

  // ============================================================
  // QUICK QUESTIONS
  // ============================================================

  const quickQuestions = [
    "Why is this incident critical?",
    "What happened in this investigation?",
    "Which MITRE techniques were observed?",
    "Is the account compromise confirmed?",
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1b2c]/90 shadow-2xl">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="border-b border-white/[0.07] bg-gradient-to-r from-[#12253a] to-[#0c1b2c] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Copilot icon */}

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
              <Bot className="h-5 w-5 text-cyan-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  Sentinel Copilot
                </h2>

                <span className="flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Online
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Ask questions about the current investigation.
              </p>
            </div>
          </div>

          {/* Clear chat */}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              disabled={loading}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition hover:border-white/[0.15] hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          INVESTIGATION CONTEXT
      ======================================================= */}

      <div className="border-b border-white/[0.06] bg-black/10 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />

          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Investigation context attached
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {investigation.filename && (
            <span className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-1 text-[10px] text-slate-400">
              {investigation.filename}
            </span>
          )}

          {investigation.threatScore && (
            <span className="rounded-md border border-rose-300/10 bg-rose-300/[0.04] px-2 py-1 text-[10px] text-rose-200">
              Risk {investigation.threatScore.value} ·{" "}
              {investigation.threatScore.label}
            </span>
          )}

          <span className="rounded-md border border-white/[0.07] bg-white/[0.02] px-2 py-1 text-[10px] text-slate-500">
            Evidence-grounded
          </span>
        </div>
      </div>

      {/* ======================================================
          CHAT AREA
      ======================================================= */}

      <div className="max-h-[560px] min-h-[220px] overflow-y-auto px-4 py-5 sm:px-6">
        {/* Empty state */}

        {messages.length === 0 && !loading && (
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.05]">
              <Bot className="h-7 w-7 text-cyan-300/70" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-200">
              How can I help with this investigation?
            </h3>

            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              Ask Sentinel Copilot to explain the timeline, risk score, MITRE
              techniques, findings, or recommended investigation steps.
            </p>

            {/* Quick questions */}

            <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
              {quickQuestions.map((quickQuestion) => (
                <button
                  key={quickQuestion}
                  type="button"
                  onClick={() => {
                    setQuestion(quickQuestion);

                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 50);
                  }}
                  className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[10px] text-slate-400 transition hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-cyan-200"
                >
                  {quickQuestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================
            MESSAGES
        ===================================================== */}

        <div className="space-y-5">
          {messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* Assistant icon */}

                {!isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06]">
                    <Bot className="h-4 w-4 text-cyan-300" />
                  </div>
                )}

                {/* Message */}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? "rounded-tr-md border border-cyan-300/10 bg-cyan-300/[0.08]"
                      : "rounded-tl-md border border-white/[0.07] bg-white/[0.025]"
                  }`}
                >
                  {/* Role */}

                  <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    {isUser ? "You" : "Sentinel Copilot"}
                  </div>

                  {/* Content */}

                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                      {message.content}
                    </p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-sm leading-6 prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-cyan-200 prose-p:my-2 prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300 prose-ul:my-2 prose-ol:my-2 prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:text-cyan-200 prose-pre:bg-black/30">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* User icon */}

                {isUser && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-300/[0.06]">
                    <User className="h-4 w-4 text-violet-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* ==================================================
              LOADING
          =================================================== */}

          {loading && (
            <div className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06]">
                <Bot className="h-4 w-4 text-cyan-300" />
              </div>

              <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />

                  <span className="text-xs text-slate-500">
                    Sentinel Copilot is analyzing the investigation...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-300/10 bg-rose-300/[0.04] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />

            <div>
              <div className="text-xs font-semibold text-rose-200">
                Copilot unavailable
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          INPUT AREA
      ======================================================= */}

      <div className="border-t border-white/[0.07] bg-[#091625]/80 p-4 sm:p-5">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this investigation..."
            rows={3}
            disabled={loading}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-slate-900/80 p-4 pr-14 text-sm leading-6 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/30 focus:ring-1 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* Send button */}

          <button
            type="button"
            onClick={askAI}
            disabled={loading || !question.trim()}
            aria-label="Ask Sentinel Copilot"
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[9px] text-slate-600">
            Enter to send · Shift + Enter for new line
          </span>

          <span className="text-[9px] text-slate-600">
            Evidence-grounded AI
          </span>
        </div>
      </div>
    </section>
  );
}

