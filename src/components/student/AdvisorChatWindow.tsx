"use client";

import * as React from "react";
import { Send, Bot, User, Sparkles, AlertTriangle, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAdvisor } from "@/lib/services/advisor-service";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import type { AdvisorChatMessage, AdvisorContextSnapshot } from "@/types/advisor";

const QUICK_PROMPT_SUGGESTIONS = [
  "Which of my courses are currently below 75%?",
  "Can I safely miss any upcoming classes?",
  "How many classes do I need to attend to reach 75%?",
  "Summarize my attendance status.",
];

export function AdvisorChatWindow({ studentName: propStudentName }: { studentName?: string } = {}) {
  const [profileName, setProfileName] = React.useState<string>(propStudentName || "");

  React.useEffect(() => {
    if (propStudentName) {
      setProfileName(propStudentName);
      return;
    }
    if (typeof window !== "undefined") {
      const cached = getCurrentUserProfile();
      if (cached?.fullName) {
        setProfileName(cached.fullName);
      } else {
        resolveCurrentUserProfile().then((u) => {
          if (u?.fullName) setProfileName(u.fullName);
        });
      }
    }
  }, [propStudentName]);

  const [messages, setMessages] = React.useState<AdvisorChatMessage[]>(() => {
    const greeting = propStudentName ? `Hello ${propStudentName.split(" ")[0]}!` : "Hello!";
    return [
      {
        id: "msg-welcome",
        role: "advisor",
        content:
          `${greeting} I am your AttendGuard AI Academic Advisor. I am connected directly to your official cryptographic attendance ledger. Ask me any question about your course standings, upcoming absences, or recovery requirements.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        snapshot: null,
      },
    ];
  });

  React.useEffect(() => {
    if (profileName) {
      const firstName = profileName.split(" ")[0];
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "msg-welcome") {
          return [
            {
              ...prev[0],
              content: `Hello ${firstName}! I am your AttendGuard AI Academic Advisor. I am connected directly to your official cryptographic attendance ledger. Ask me any question about your course standings, upcoming absences, or recovery requirements.`,
            },
          ];
        }
        return prev;
      });
    }
  }, [profileName]);

  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AdvisorChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!queryText) setInputValue("");
    setIsLoading(true);

    try {
      const response = await askAdvisor(textToSend);
      const advisorMessage: AdvisorChatMessage = {
        id: "adv-" + Date.now(),
        role: "advisor",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        snapshot: response.contextSnapshot,
      };
      setMessages((prev) => [...prev, advisorMessage]);
    } catch {
      const errorMessage: AdvisorChatMessage = {
        id: "err-" + Date.now(),
        role: "advisor",
        content: "I apologize, but I am currently unable to query your attendance records. Please try again in a few moments.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] flex flex-col h-[720px] max-w-4xl mx-auto shadow-2xl overflow-hidden relative transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-950/20">
      {/* Advisor Top Header */}
      <div className="border-b border-zinc-800/80 bg-[#06080A]/90 backdrop-blur p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-white tracking-tight">
                AI Attendance Advisor
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              Grounded in official student attendance logs & 75% academic thresholds
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>ZERO HALLUCINATION</span>
        </div>
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Role Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-transform ${
                  isUser
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : "bg-[#06080A] border border-zinc-800 text-blue-400"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className="space-y-2 max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md transition-all ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-sm font-medium"
                      : "bg-[#06080A] border border-zinc-800 text-zinc-100 rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Attached Context Snapshot Card */}
                {msg.snapshot && (
                  <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-[#06080A] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="font-mono font-semibold text-blue-400">
                        {msg.snapshot.classCode} Official Metric Snapshot
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider ${
                          msg.snapshot.currentPercentage >= 75
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {msg.snapshot.currentPercentage >= 75 ? "Safe" : "At Risk (< 75%)"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-zinc-500">Current Standing: </span>
                        <span className="text-white font-bold">{msg.snapshot.currentPercentage}%</span>
                        <span className="text-zinc-500"> ({msg.snapshot.attended}/{msg.snapshot.totalHeld})</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Target Threshold: </span>
                        <span className="text-zinc-300 font-bold">{msg.snapshot.targetPercentage}%</span>
                      </div>
                    </div>

                    <div className="pt-1 text-[11px] font-mono font-semibold">
                      {msg.snapshot.currentPercentage >= 75 ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Safe Buffer: Can miss {msg.snapshot.canMiss} lecture{msg.snapshot.canMiss === 1 ? "" : "s"} safely.
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Recovery Target: Must attend next {msg.snapshot.classesNeeded} consecutive lecture{msg.snapshot.classesNeeded === 1 ? "" : "s"}.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-zinc-500 font-mono block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#06080A] border border-zinc-800 text-blue-400 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-[#06080A] border border-zinc-800 text-zinc-400 text-xs font-mono flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
              <span>Analyzing official attendance ledger & calculating margins...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick-Prompt Suggestions Bar */}
      <div className="px-4 py-2.5 bg-[#06080A] border-t border-zinc-800/80 overflow-x-auto flex items-center gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest shrink-0 flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-blue-400" />
          SUGGESTIONS:
        </span>
        {QUICK_PROMPT_SUGGESTIONS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] font-mono px-3 py-1 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-blue-500/40 hover:bg-zinc-900 transition-all shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 sm:p-4 border-t border-zinc-800/80 bg-[#0B0D10] flex items-center gap-2.5"
      >
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your courses (e.g. 'Can I miss tomorrow's Distributed Systems class?')..."
            disabled={isLoading}
            className="bg-[#06080A] border-zinc-800 focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-white placeholder:text-zinc-500 h-11 text-xs sm:text-sm font-mono rounded-xl shadow-inner transition-all duration-200"
          />
        </div>
        <Button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          <Send className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">SEND</span>
        </Button>
      </form>
    </div>
  );
}
