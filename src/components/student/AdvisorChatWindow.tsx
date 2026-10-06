"use client";

import * as React from "react";
import { Send, Bot, User, Sparkles, AlertTriangle, ShieldCheck, Clock, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { askAdvisor } from "@/lib/services/advisor-service";
import type { AdvisorChatMessage, AdvisorContextSnapshot } from "@/types/advisor";

const QUICK_PROMPT_SUGGESTIONS = [
  "Am I safe in Linear Algebra, or do I need to attend the next classes?",
  "Can I miss tomorrow's Distributed Systems class?",
  "Which of my courses are currently below 75%?",
  "How many classes do I need to attend in Operating Systems?",
];

const INITIAL_MESSAGES: AdvisorChatMessage[] = [
  {
    id: "msg-welcome",
    role: "advisor",
    content:
      "Hello Jane! I am your AttendGuard AI Academic Advisor. I am connected directly to your official cryptographic attendance ledger. Ask me any question about your course standings, upcoming absences, or recovery requirements.",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    snapshot: null,
  },
];

export function AdvisorChatWindow() {
  const [messages, setMessages] = React.useState<AdvisorChatMessage[]>(INITIAL_MESSAGES);
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
    <Card className="border-slate-800 bg-slate-950 flex flex-col h-[700px] max-w-4xl mx-auto shadow-2xl overflow-hidden relative">
      {/* Advisor Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/80 p-4 sm:p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/40">
            <Bot className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Attendance Advisor
              </h3>
              <Badge variant="emerald" className="text-[10px] py-0 px-1.5 font-bold">
                Online
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Grounded in official student attendance logs & 75% academic thresholds
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
          <Sparkles className="h-3 w-3 text-teal-400" />
          <span>Zero Hallucination</span>
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
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 border border-slate-700 text-teal-300"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className={`space-y-2 max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none font-medium"
                      : "bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Attached Context Snapshot Card */}
                {msg.snapshot && (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-mono font-bold text-teal-300">
                        {msg.snapshot.classCode} Official Metric Snapshot
                      </span>
                      <Badge
                        variant={msg.snapshot.currentPercentage >= 75 ? "emerald" : "destructive"}
                        className="text-[10px]"
                      >
                        {msg.snapshot.currentPercentage >= 75 ? "Safe" : "At Risk (< 75%)"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500">Current Standing: </span>
                        <span className="text-white font-bold">{msg.snapshot.currentPercentage}%</span>
                        <span className="text-slate-500"> ({msg.snapshot.attended}/{msg.snapshot.totalHeld})</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Target Threshold: </span>
                        <span className="text-slate-300 font-bold">{msg.snapshot.targetPercentage}%</span>
                      </div>
                    </div>

                    <div className="pt-1 text-[11px] font-semibold">
                      {msg.snapshot.currentPercentage >= 75 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Safe Buffer: Can miss {msg.snapshot.canMiss} lecture{msg.snapshot.canMiss === 1 ? "" : "s"} safely.
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Recovery Target: Must attend next {msg.snapshot.classesNeeded} consecutive lecture{msg.snapshot.classesNeeded === 1 ? "" : "s"}.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-500 font-mono block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 text-teal-300 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
              <span>Analyzing official attendance ledger & calculating margins...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick-Prompt Suggestions Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" />
          Suggestions:
        </span>
        {QUICK_PROMPT_SUGGESTIONS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] px-3 py-1 rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50"
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
        className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about your courses (e.g. 'Can I miss tomorrow's Distributed Systems class?')..."
          disabled={isLoading}
          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 h-11 text-xs sm:text-sm"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          variant="emerald"
          className="h-11 px-5 font-bold shrink-0"
        >
          <Send className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </Card>
  );
}
