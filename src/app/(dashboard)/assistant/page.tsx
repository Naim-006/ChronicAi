"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  FileText,
  AlertTriangle,
  X,
  ShieldAlert,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { mockMessages, mockProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { AIMessage, AICitation } from "@/types/medical";

const suggestedQuestions = [
  "How has my HbA1c progressed over the last year?",
  "What are my 4 current daily medications and timings?",
  "What should I ask Dr. Wei on Dec 8?",
  "Explain my latest kidney eGFR result.",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>(mockMessages);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<AICitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const lower = query.toLowerCase();
    const isEmergency =
      lower.includes("chest pain") ||
      lower.includes("heart attack") ||
      lower.includes("can't breathe") ||
      lower.includes("stroke") ||
      lower.includes("bleeding heavily") ||
      lower.includes("suicide");

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: "conv-1",
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");

    if (isEmergency) {
      setEmergencyAlert(
        `Critical safety warning: Your query describes potentially urgent symptoms ("${query}"). This AI assistant cannot provide acute emergency medical care. Please contact emergency services (call 911 or visit local emergency) immediately.`
      );
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      let responseContent = "";
      let citations: AICitation[] = [];

      if (lower.includes("medication") || lower.includes("pill") || lower.includes("dose")) {
        responseContent = `Your verified records show 4 active prescribed medications:

• **Metformin ER 1000mg**: Twice daily with meals (08:00, 20:00) for Diabetes.
• **Empagliflozin 10mg**: Once daily in morning (08:00) for Glycemic & Renal protection.
• **Lisinopril 20mg**: Once daily in morning (08:00) for Blood Pressure & Kidneys.
• **Atorvastatin 20mg**: Once daily at bedtime (21:00) for Cardiovascular protection.

*Notice: Never change dosages without consulting your prescribing doctor.*`;
        citations = [
          {
            document_id: "doc-102",
            document_title: "Prescription_Renewal_DrWei_Nov2026.pdf",
            date: "2026-11-05",
            page: 1,
            snippet: "Metformin ER 1000mg BID #180, Empagliflozin 10mg QD #90",
          },
        ];
      } else if (lower.includes("wei") || lower.includes("appointment") || lower.includes("question")) {
        responseContent = `Here are clinically relevant preparation questions for your **Dec 8** consultation with **Dr. Catherine Wei**:

1. "My HbA1c dropped to 6.8% in November. Should we maintain our current dosage of Metformin and Empagliflozin?"
2. "My eGFR stabilized at 68 mL/min. When should we schedule our next urine microalbumin check?"
3. "My annual diabetic eye exam at Valley Eye Center was clear of retinopathy. Do you need a copy of Dr. Jenkins' report?"`;
        citations = [
          {
            document_id: "doc-101",
            document_title: "Metabolic_Lipid_Panel_Nov2026.pdf",
            date: "2026-11-02",
            page: 1,
            snippet: "HbA1c 6.8%, Fasting Glucose 118 mg/dL, eGFR 68",
          },
        ];
      } else {
        responseContent = `Based on your verified medical records from Quest Diagnostics (Nov 2, 2026):

Your **HbA1c is 6.8%**, down from 7.1% in May 2026, achieving your clinical goal (< 7.0%). Your **Fasting Blood Glucose is 118 mg/dL** (down from 126 mg/dL). 

Your renal indicators show an **eGFR of 68 mL/min** and **Creatinine of 1.04 mg/dL**, confirming stable Stage 2 CKD on ACE inhibitor therapy.`;
        citations = [
          {
            document_id: "doc-101",
            document_title: "Metabolic_Lipid_Panel_Nov2026.pdf",
            date: "2026-11-02",
            page: 1,
            snippet: "Comprehensive diabetic panel: HbA1c 6.8%, eGFR 68, Creatinine 1.04",
          },
        ];
      }

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: "conv-1",
        role: "assistant",
        content: responseContent,
        citations,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-800 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Medical Life Assistant
            </h1>
            <span className="text-[10px] text-teal-800 font-semibold block">
              Grounded in Elena Vance's Verified Records
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages(mockMessages)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
        >
          Clear
        </button>
      </div>

      {/* Emergency Alert */}
      {emergencyAlert && (
        <div className="mb-3">
          <EmergencyBanner message={emergencyAlert} onDismiss={() => setEmergencyAlert(null)} />
        </div>
      )}

      {/* Citation Popover Modal */}
      {activeCitation && (
        <div className="mb-3 rounded-2xl border border-teal-300 bg-teal-50/70 p-3 shadow-xs space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-teal-700" />
              Source Record: {activeCitation.document_title}
            </span>
            <button
              type="button"
              onClick={() => setActiveCitation(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[10px] text-slate-500 block">Date: {formatDate(activeCitation.date)}</span>
          <p className="bg-white rounded-lg p-2 border border-teal-200 text-slate-700 text-[11px] leading-relaxed">
            "{activeCitation.snippet}"
          </p>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 text-xs ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-800 text-white mt-0.5">
                <Sparkles className="h-3 w-3" />
              </div>
            )}

            <div
              className={`rounded-2xl p-3.5 max-w-[88%] leading-relaxed space-y-2 ${
                msg.role === "user"
                  ? "bg-teal-800 text-white font-medium rounded-br-xs"
                  : "bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-bl-xs"
              }`}
            >
              <div className="whitespace-pre-line text-xs">{msg.content}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {msg.citations.map((cite, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveCitation(cite)}
                      className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-teal-700" />
                      <span className="truncate max-w-[140px]">{cite.document_title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 items-center text-xs text-slate-500 py-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-800">
              <Sparkles className="h-3 w-3 animate-spin" />
            </div>
            <span>Analyzing patient records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pill Scroller */}
      <div className="py-2 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="whitespace-nowrap rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="pt-1 border-t border-slate-200 bg-[#F4F6F8] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              placeholder="Ask about test results, medications, visits..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="h-10 w-full rounded-2xl border border-slate-200/90 bg-white pl-4 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-800 text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
