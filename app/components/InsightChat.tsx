"use client";

import React, { useState } from "react";
import { ApiResult } from "../page";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type InsightChatProps = {
  analysis: ApiResult | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const InsightChat: React.FC<InsightChatProps> = ({ analysis }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          analysis, // send the current analysis JSON
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.reply) {
        throw new Error(
          data?.error || "Chat backend error. Please try again in a bit."
        );
      }

      const botMsg: ChatMessage = {
        role: "assistant",
        content: data.reply as string,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(
        typeof err?.message === "string"
          ? err.message
          : "Something went wrong talking to CashRaaga."
      );
    } finally {
      setLoading(false);
    }
  };

  const disabled = !analysis || loading;

  return (
    <section className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-100">
          Ask CashRaaga (beta)
        </h3>
        <span className="text-[10px] text-slate-500">
          Chat about your numbers
        </span>
      </div>

      {!analysis && (
        <p className="text-[11px] text-slate-500">
          Upload a statement first. Then you can ask questions like{" "}
          <span className="italic">
            &quot;Why is my overspend risk high?&quot;
          </span>{" "}
          or{" "}
          <span className="italic">
            &quot;Which category should I cut this month?&quot;
          </span>
          .
        </p>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2 space-y-2 text-[11px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-900 text-slate-100 border border-slate-700"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Input */}
      <form
        onSubmit={handleAsk}
        className="flex items-center gap-2 text-[11px]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder={
            analysis
              ? 'Ask: "Why is my risk high?" or "How much can I spend today?"'
              : "Upload a statement to start chatting"
          }
          className="flex-1 rounded-full bg-slate-950/70 border border-slate-700 px-3 py-2 text-[11px] text-slate-100 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-emerald-500 px-4 py-1.5 font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>
    </section>
  );
};

export default InsightChat;
