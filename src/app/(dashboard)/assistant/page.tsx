"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Stethoscope,
  FileText,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Info,
  Loader2,
  Activity,
  Pill,
  Calendar,
} from "lucide-react";
import { mockMessages } from "@/lib/mock-data";
import { AIMessage, AICitation } from "@/types/medical";
import { formatDate } from "@/lib/utils";

const suggestedQuestions = [
  { text: "Compare my HbA1c from May to November", category: "Labs", icon: Activity },
  { text: "Are there any interactions with Metformin and Lisinopril?", category: "Meds", icon: Pill },
  { text: "What key questions should I ask Dr. Catherine Wei?", category: "Visits", icon: Calendar },
  { text: "Explain what my eGFR of 68 mL/min means", category: "Kidney", icon: FileText },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<AIMessage[]>(mockMessages);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCitation, setActiveCitation] = useState<AICitation | null>(null);
  const [emergencyWarning, setEmergencyWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    // Red flag emergency check
    const redFlags = ["chest pain", "shortness of breath", "severe bleeding", "stroke", "loss of consciousness", "can't breathe"];
    const hasRedFlag = redFlags.some((rf) => query.toLowerCase().includes(rf));

    if (hasRedFlag) {
      setEmergencyWarning("Urgent: Your symptoms may indicate an emergency. Please call 911 or visit the nearest emergency facility immediately.");
    } else {
      setEmergencyWarning(null);
    }

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: "conv-1",
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let responseContent = "";
      let citations: AICitation[] = [];

      const lower = query.toLowerCase();
      if (lower.includes("metformin") || lower.includes("interaction") || lower.includes("lisinopril")) {
        responseContent = `Based on your active prescription profile:

1. **Metformin 1000 mg** (Oral, Twice daily) and **Lisinopril 10 mg** (Oral, Once daily) are safe and standard practice in dual-management of Type 2 Diabetes and Hypertension.
2. **Safety Check:** No significant adverse drug-drug interactions detected. Metformin supports glycemic control, while Lisinopril provides renal-protective benefits for your kidneys.
3. **Clinical Guideline:** Maintain adequate hydration and continue routine annual renal monitoring (eGFR was stable at 68 mL/min in your Nov 2026 panel).`;
        citations = [
          {
            document_id: "doc-103",
            document_title: "Active_Rx_Metformin_Lisinopril.pdf",
            date: "2026-06-12",
            page: 1,
            snippet: "Metformin 1000mg BID + Lisinopril 10mg daily. Renal protective regimen.",
          },
        ];
      } else if (lower.includes("wei") || lower.includes("doctor") || lower.includes("visit") || lower.includes("question")) {
        responseContent = `Here are 3 tailored discussion checkpoints for your upcoming consultation with **Dr. Catherine Wei** on December 8, 2026:

1. **Glycemic Milestone:** Note that your HbA1c improved to **6.8%** (down from 7.1%), reaching your sub-7.0% clinical target. Ask whether your current dosage of Metformin should remain unchanged.
2. **Kidney eGFR Stability:** Your eGFR remains steady at **68 mL/min** (Creatinine 1.04). Confirm that the Lisinopril 10 mg renal protection remains optimal.
3. **Next Screening Checkpoints:** Request follow-up orders for your annual diabetic eye exam and urine microalbumin screening for early 2027.`;
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

• Your **HbA1c is 6.8%**, down from 7.1% in May 2026, successfully meeting your target goal (< 7.0%).
• Your **Fasting Blood Glucose is 118 mg/dL** (improved from 126 mg/dL). 
• Renal filtration markers indicate an **eGFR of 68 mL/min** and **Creatinine of 1.04 mg/dL**, confirming stable renal function under your current care plan.`;
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
    }, 700);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] sm:h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-md shadow-emerald-500/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
              Clinical Copilot
            </h1>
            <span className="text-[11px] text-emerald-700 font-bold block flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600 inline" />
              Grounded in Elena Vance's Verified Clinical Records
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages(mockMessages)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Emergency Red-Flag Alert */}
      {emergencyWarning && (
        <div className="mb-3 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-red-900 shadow-sm shrink-0">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 text-xs leading-relaxed">
              <span className="font-bold block">Medical Warning Detected</span>
              {emergencyWarning}
            </div>
          </div>
        </div>
      )}

      {/* Citation Inspector Drawer */}
      {activeCitation && (
        <div className="mb-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 p-3 text-xs shadow-xs shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-emerald-950 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              Verified Source: {activeCitation.document_title} (Page {activeCitation.page})
            </span>
            <button
              type="button"
              onClick={() => setActiveCitation(null)}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="bg-white rounded-xl p-2.5 border border-emerald-100 text-slate-700 text-[11px] leading-relaxed font-mono">
            "{activeCitation.snippet}"
          </p>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white mt-0.5 shadow-xs">
                <Stethoscope className="h-4 w-4" />
              </div>
            )}

            <div
              className={`rounded-3xl p-4 max-w-[88%] leading-relaxed space-y-2 shadow-xs ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white font-medium rounded-br-xs"
                  : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
              }`}
            >
              <div className="whitespace-pre-line text-xs font-normal leading-relaxed">{msg.content}</div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {msg.citations.map((cite, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveCitation(cite)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-emerald-700" />
                      <span className="truncate max-w-[160px]">{cite.document_title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5 items-center text-xs text-slate-500 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <span className="font-medium">Cross-referencing verified health records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pill Scroller */}
      <div className="py-2.5 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
        {suggestedQuestions.map((q, idx) => {
          const Icon = q.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q.text)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white border border-slate-200/90 px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 hover:bg-emerald-50/50 transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-600" />
              <span>{q.text}</span>
            </button>
          );
        })}
      </div>

      {/* Input Bar */}
      <div className="pt-2 border-t border-slate-200/80 bg-[#F6F8FA] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              placeholder="Ask about lab trends, prescriptions, visit preparation..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-white pl-4 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
