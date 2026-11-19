"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
  User,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { mockMessages, mockConversations, mockProfile, mockMedications, mockHealthMetrics } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { AIMessage, AICitation } from "@/types/medical";

const suggestedQuestions = [
  "How has my HbA1c changed over the last 12 months?",
  "What medications am I currently prescribed and what are their doses?",
  "What questions should I bring to my appointment with Dr. Wei on Dec 8?",
  "Explain my latest kidney eGFR result from Quest Diagnostics.",
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

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    // Check emergency red flags
    const lower = query.toLowerCase();
    const isEmergency =
      lower.includes("chest pain") ||
      lower.includes("heart attack") ||
      lower.includes("can't breathe") ||
      lower.includes("stroke") ||
      lower.includes("bleeding heavily") ||
      lower.includes("suicide") ||
      lower.includes("unconscious");

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
        `Critical safety warning: Your query mentions potentially life-threatening symptoms ("${query}"). This AI system cannot provide acute clinical triage. Please call 911 or visit the nearest emergency facility immediately.`
      );
      return;
    }

    // Normal safe clinical query: simulate grounded RAG response
    setIsTyping(true);
    setTimeout(() => {
      let responseContent = "";
      let citations: AICitation[] = [];

      if (lower.includes("medication") || lower.includes("pill") || lower.includes("dose")) {
        responseContent = `According to your verified prescription records, you are currently taking 4 active medications:

1. **Metformin ER 1000mg**: 1 tablet twice daily with meals (Breakfast & Dinner) for Type 2 Diabetes.
2. **Empagliflozin (Jardiance) 10mg**: 1 tablet once daily in the morning with water.
3. **Lisinopril 20mg**: 1 tablet once daily in the morning for blood pressure and renal protection.
4. **Atorvastatin 20mg**: 1 tablet once daily at bedtime for cardiovascular risk reduction.

*Clinical Reminder: Never adjust doses or discontinue prescribed medications without consulting your prescribing physician.*`;
        citations = [
          {
            document_id: "doc-102",
            document_title: "Prescription_Renewal_DrWei_Nov2026.pdf",
            date: "2026-11-05",
            page: 1,
            snippet: "Metformin ER 1000mg BID #180, Empagliflozin 10mg QD #90",
          },
        ];
      } else if (lower.includes("appointment") || lower.includes("wei") || lower.includes("question")) {
        responseContent = `For your upcoming consultation with **Dr. Catherine Wei** on **December 8, 2026 at 10:15 AM**, here are suggested, clinically relevant questions based on your recent health trajectory:

1. *"My HbA1c dropped to 6.8% in November. Should we maintain my current Metformin ER and Empagliflozin dosages?"*
2. *"My eGFR was steady at 68 mL/min. Is my kidney function remaining stable, and when should we repeat the urine microalbumin test?"*
3. *"I had my annual diabetic eye screening at Valley Eye Center on Nov 14 and fundus was clear of retinopathy. Do you need a copy of Dr. Jenkins' report?"*
4. *"Are there any dietary or exercise adjustments you recommend now that my glycemic markers have achieved our target goal?"*`;
        citations = [
          {
            document_id: "doc-101",
            document_title: "Metabolic_Lipid_Panel_Nov2026.pdf",
            date: "2026-11-02",
            page: 1,
            snippet: "HbA1c 6.8%, Fasting Glucose 118 mg/dL, eGFR 68",
          },
          {
            document_id: "doc-105",
            document_title: "Recent_Clinic_Discharge_Ophthalmology.pdf",
            date: "2026-11-14",
            page: 1,
            snippet: "Dilated fundus negative for diabetic retinopathy",
          },
        ];
      } else {
        responseContent = `Based on your longitudinal medical records:

Your glycemic markers are currently under good control. Your most recent laboratory workup from Quest Diagnostics (November 2, 2026) verified an **HbA1c of 6.8%** and **Fasting Blood Glucose of 118 mg/dL**, both meeting your endocrinologist's target goals. 

Your renal function indicators show an **eGFR of 68 mL/min/1.73m²** and **Serum Creatinine of 1.04 mg/dL**, representing stable Stage 2 CKD under ACE inhibitor therapy.

If you have specific questions about any lab biomarker, medication schedule, or previous doctor visits, feel free to ask.`;
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
    }, 900);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Medical AI Assistant"
        description="Context-grounded health companion. Ask questions about your verified lab reports, medication schedules, and clinical trajectory."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "AI Assistant" }]}
      />

      {/* Emergency Alert if red-flag triggered */}
      {emergencyAlert && (
        <EmergencyBanner
          message={emergencyAlert}
          onDismiss={() => setEmergencyAlert(null)}
        />
      )}

      {/* Main Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Window (Span 2) */}
        <Card className="lg:col-span-2 flex flex-col h-[640px] border-slate-200">
          <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-slate-900">
                  Medical Context Session
                </CardTitle>
                <span className="text-[10px] text-teal-700 font-medium">
                  Grounded with Elena Vance's verified records
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setMessages(mockMessages)}
              className="text-xs h-7 text-slate-500 hover:text-slate-800"
            >
              Reset Chat
            </Button>
          </CardHeader>

          {/* Messages Stream */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`rounded-lg p-3.5 max-w-[85%] leading-relaxed space-y-2.5 ${
                    msg.role === "user"
                      ? "bg-teal-700 text-white font-medium"
                      : "bg-slate-50 border border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Sourced Citations Pill Bar */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Verified Sources ({msg.citations.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveCitation(cite)}
                            className="inline-flex items-center gap-1 text-[10px] bg-white text-teal-900 border border-teal-200 px-2 py-0.5 rounded hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <FileText className="h-3 w-3 text-teal-700" />
                            <span className="truncate max-w-[150px]">{cite.document_title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                    EV
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-xs text-slate-500">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                </div>
                <span>Retrieving verified patient records and analyzing clinical context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Ask about your lab trends, doctor visits, or medication instructions..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="text-xs"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white shrink-0 h-9 px-4 gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Ask
              </Button>
            </form>
          </div>
        </Card>

        {/* Right Column: Suggested Questions & Citation Drawer */}
        <div className="space-y-4">
          {/* Active Citation Card */}
          {activeCitation && (
            <Card className="border-teal-300 bg-teal-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-700" />
                    Source Record Verification
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCitation(null)}
                    className="h-6 w-6 p-0 text-slate-400"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">{activeCitation.document_title}</span>
                  <span className="text-[10px] text-slate-500">Date: {formatDate(activeCitation.date)}</span>
                </div>
                <div className="p-2 rounded bg-white border border-teal-200 text-slate-700 text-[11px] leading-relaxed">
                  <strong>Excerpt:</strong> "{activeCitation.snippet}"
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Context Questions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-teal-700" />
                Suggested Queries for Elena
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-md border border-slate-200 bg-slate-50/70 hover:bg-teal-50 hover:border-teal-200 text-xs text-slate-700 transition-colors leading-relaxed block"
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Safety & Protocol Card */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 space-y-2 text-[11px] text-slate-500 leading-relaxed">
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-teal-700" />
                Clinical Safety Architecture
              </div>
              <p>
                Responses are synthesized strictly from your uploaded, verified medical records and reliable clinical guidelines. The assistant does not invent facts or replace your doctor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
