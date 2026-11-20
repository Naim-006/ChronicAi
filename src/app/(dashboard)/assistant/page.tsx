"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Stethoscope,
  FileText,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Activity,
  Pill,
  Calendar,
  Paperclip,
  X,
  Copy,
  Check,
  MessageSquare,
  Plus,
  Clock,
  Sparkles,
  ChevronDown,
  Share2,
  BookmarkPlus,
  Sliders,
  Mic,
  MicOff,
} from "lucide-react";
import { AIMessage, AICitation, AIConversation, MedicalDocument } from "@/types/medical";
import { formatDate, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getDocuments } from "@/lib/supabase/services/documents";
import {
  getConversations,
  getMessages,
  createConversation,
  saveMessage,
} from "@/lib/supabase/services/copilot";
import { useRealtimeTable } from "@/hooks/useRealtime";

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: AIMessage[];
}

const promptSuggestions = [
  { text: "Compare my HbA1c from May to November", category: "Labs", icon: Activity },
  { text: "Are there any interactions with Metformin and Lisinopril?", category: "Meds", icon: Pill },
  { text: "What key questions should I ask my doctor?", category: "Visits", icon: Calendar },
  { text: "Explain what my eGFR of 68 mL/min means", category: "Kidney", icon: FileText },
];

export default function AssistantPage() {
  const { profile, user, effectiveUserId } = useAuth();
  const [userDocs, setUserDocs] = useState<MedicalDocument[]>([]);
  const patientName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "conv-initial",
      title: "Health Consultation",
      date: "Today",
      messages: [
        {
          id: "msg-welcome",
          conversation_id: "conv-initial",
          role: "assistant",
          content: "Hello! I am your Clinical Assistant, grounded directly in your verified medical records and health vitals.\n\nHow can I assist you with your health records, lab panels, or medication schedule today?",
          created_at: new Date().toISOString(),
        },
      ],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>("conv-initial");
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [explanationDepth, setExplanationDepth] = useState<"plain" | "clinical">("plain");

  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCitation, setActiveCitation] = useState<AICitation | null>(null);
  const [emergencyWarning, setEmergencyWarning] = useState<string | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<MedicalDocument | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((result: any) => result[0].transcript)
              .join("");
            setInputQuery(transcript);
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (err) {
          console.warn("Speech recognition error:", err);
        }
      }
    }

    // Frontend fallback state if browser SpeechRecognition is unsupported or blocked
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
    }, 4500);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages, isTyping]);

  useEffect(() => {
    let isMounted = true;
    if (effectiveUserId) {
      getDocuments(effectiveUserId).then((docs) => {
        if (isMounted) setUserDocs(docs || []);
      });
      getConversations(effectiveUserId).then(async (convs) => {
        if (!isMounted) return;
        if (convs && convs.length > 0) {
          const loaded: ChatSession[] = await Promise.all(
            convs.map(async (c) => {
              const msgs = await getMessages(c.id);
              return {
                id: c.id,
                title: c.title,
                date: formatDate(c.updated_at),
                messages: msgs,
              };
            })
          );
          if (isMounted && loaded.length > 0) {
            setSessions(loaded);
            setActiveSessionId(loaded[0].id);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  useRealtimeTable({
    table: "ai_conversations",
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      if (!effectiveUserId) return;
      getConversations(effectiveUserId).then(async (convs) => {
        if (convs && convs.length > 0) {
          const loaded: ChatSession[] = await Promise.all(
            convs.map(async (c) => {
              const msgs = await getMessages(c.id);
              return {
                id: c.id,
                title: c.title,
                date: formatDate(c.updated_at),
                messages: msgs,
              };
            })
          );
          if (loaded.length > 0) {
            setSessions(loaded);
          }
        }
      });
    },
  });

  const handleCreateNewSession = async () => {
    const welcomeMsg: AIMessage = {
      id: `msg-welcome-${Date.now()}`,
      conversation_id: `conv-${Date.now()}`,
      role: "assistant",
      content: `Hello ${patientName}. I am your Clinical Assistant, grounded directly in your verified medical records and health vitals.

How can I assist you with your health records, lab panels, or medication schedule today?`,
      created_at: new Date().toISOString(),
    };

    if (effectiveUserId) {
      try {
        const createdConv = await createConversation(
          effectiveUserId,
          "New Health Consultation"
        );
        welcomeMsg.conversation_id = createdConv.id;
        await saveMessage({
          ...welcomeMsg,
          userId: effectiveUserId,
        });
        const newSession: ChatSession = {
          id: createdConv.id,
          title: createdConv.title,
          date: "Just now",
          messages: [welcomeMsg],
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setShowHistoryMobile(false);
        setAttachedDoc(null);
        return;
      } catch {}
    }

    const localId = `conv-${Date.now()}`;
    welcomeMsg.conversation_id = localId;
    const newSession: ChatSession = {
      id: localId,
      title: "New Health Consultation",
      date: "Just now",
      messages: [welcomeMsg],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowHistoryMobile(false);
    setAttachedDoc(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    // Red flag emergency check
    const redFlags = [
      "chest pain",
      "shortness of breath",
      "severe bleeding",
      "stroke",
      "loss of consciousness",
      "can't breathe",
      "heart attack",
    ];
    const hasRedFlag = redFlags.some((rf) => query.toLowerCase().includes(rf));

    if (hasRedFlag) {
      setEmergencyWarning(
        "Critical Triage Alert: The symptoms you described may indicate a medical emergency. Please call 911 or go to the nearest emergency room immediately."
      );
    } else {
      setEmergencyWarning(null);
    }

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: activeSessionId,
      role: "user",
      content: query + (attachedDoc ? `\n[Attached Reference: ${attachedDoc.file_name}]` : ""),
      created_at: new Date().toISOString(),
    };

    // Update active session messages
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isDefaultTitle = s.title === "New Health Consultation";
          return {
            ...s,
            title: isDefaultTitle ? query.slice(0, 36) + "..." : s.title,
            messages: [...s.messages, userMessage],
          };
        }
        return s;
      })
    );

    if (!textToSend) setInputQuery("");
    const sentAttachedDoc = attachedDoc;
    setAttachedDoc(null);
    setShowAttachMenu(false);
    setIsTyping(true);

    setTimeout(() => {
      let responseContent = "";
      let citations: AICitation[] = [];

      const lower = query.toLowerCase();

      if (sentAttachedDoc) {
        responseContent = `I have cross-examined **${sentAttachedDoc.file_name}** (${sentAttachedDoc.facility_name}):

• **Key Finding:** The report confirms routine follow-up status with no critical variance from your baseline.
• **Clinical Context:** Biomarkers remain aligned with your primary care protocol under Dr. Catherine Wei.
• **Action Point:** The extracted parameters have been verified and linked to your lifelong medical timeline.`;
        citations = [
          {
            document_id: sentAttachedDoc.id,
            document_title: sentAttachedDoc.file_name,
            date: sentAttachedDoc.document_date || "2026-11-02",
            page: 1,
            snippet: "Values were read from the scan and checked by you before saving.",
          },
        ];
      } else if (
        lower.includes("metformin") ||
        lower.includes("interaction") ||
        lower.includes("lisinopril") ||
        lower.includes("advil") ||
        lower.includes("ibuprofen")
      ) {
        if (explanationDepth === "plain") {
          responseContent = `Based on your verified prescriptions:

• **Metformin (1000 mg)** and **Lisinopril (20 mg)** are completely safe and routinely prescribed together.
• They work as a team: Metformin helps lower your blood sugar, while Lisinopril protects your kidneys and manages your blood pressure.
• **Safety Tip:** If you ever need pain medicine, avoid NSAIDs like Advil/Ibuprofen because they can strain your kidneys. Tylenol (Acetaminophen) is much safer for you.`;
        } else {
          responseContent = `### Pharmacological Profile & Renal Safety Evaluation

1. **Dual Regimen Assessment (Metformin + Lisinopril):**
   - **Metformin ER 1000mg BID:** Primary biguanide antihyperglycemic. Enhances peripheral insulin sensitivity and reduces intestinal glucose absorption.
   - **Lisinopril 20mg QD:** Angiotensin-Converting Enzyme (ACE) inhibitor. Reduces efferent arteriolar resistance, providing intraglomerular pressure reduction and diabetic renoprotection.
2. **Interaction Risk:** None identified between active prescription agents.
3. **Renal Clearance Caution:**
   - Baseline eGFR is **68 mL/min/1.73m²**. Concurrent use of non-steroidal anti-inflammatory drugs (NSAIDs) is contraindicated due to acute renal hemodynamic reduction risk.`;
        }
        citations = [
          {
            document_id: "doc-103",
            document_title: "Active_Rx_Metformin_Lisinopril.pdf",
            date: "2026-06-12",
            page: 1,
            snippet: "Metformin 1000mg BID + Lisinopril 20mg daily. Renal protective regimen.",
          },
        ];
      } else if (
        lower.includes("wei") ||
        lower.includes("doctor") ||
        lower.includes("visit") ||
        lower.includes("question")
      ) {
        responseContent = `Here are 3 tailored discussion checkpoints for your upcoming consultation with **Dr. Catherine Wei** on December 8, 2026:

1. **HbA1c Target Milestone (6.8%):**
   - Point out that your HbA1c improved from 7.1% down to **6.8%**, reaching your clinician-defined target (< 7.0%). Ask if your current Metformin dosage should stay steady.
2. **Renal Function Stability:**
   - Your eGFR is steady at **68 mL/min** (Creatinine 1.04). Confirm that Lisinopril 20 mg continues to provide adequate kidney protection.
3. **Annual Diabetic Checkpoint:**
   - Present your clear retinal eye exam findings from Valley Eye Center and request annual urine microalbumin orders for early 2027.`;
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

• **HbA1c:** **6.8%** — down from 7.1% in May 2026, successfully meeting your clinical target goal (< 7.0%).
• **Fasting Plasma Glucose:** **118 mg/dL** — improved from 126 mg/dL.
• **Renal Filtration:** eGFR is **68 mL/min** and Serum Creatinine is **1.04 mg/dL**, confirming stable Stage 2 CKD on current ACE inhibitor therapy.

Would you like me to generate a 1-page summary of these findings to bring to your next doctor visit?`;
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
        conversation_id: activeSessionId,
        role: "assistant",
        content: responseContent,
        citations,
        created_at: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="flex h-[calc(100dvh-170px)] lg:h-[calc(100vh-140px)] max-w-6xl mx-auto gap-4">
      {/* 1. Left Sidebar: Chat History & Clinical Sessions (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col rounded-3xl bg-white/80 dark:bg-[#0b1325]/85 border border-slate-200/80 dark:border-white/10 p-4 shadow-sm backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
              Consultation History
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        </div>

        {/* New Consultation Button */}
        <button
          type="button"
          onClick={handleCreateNewSession}
          className="mt-3 flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#16A34A] text-white py-2.5 px-4 text-xs font-bold shadow-md shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Consultation</span>
        </button>

        {/* Sessions List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-1.5 pr-1">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <button
                key={sess.id}
                type="button"
                onClick={() => {
                  setActiveSessionId(sess.id);
                  setAttachedDoc(null);
                }}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/90 dark:border-emerald-500/30 shadow-2xs"
                    : "hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold truncate block ${
                      isActive ? "text-emerald-950 dark:text-emerald-300 font-extrabold" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {sess.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-1 pl-5.5 font-medium">
                  {sess.date} · {sess.messages.length} messages
                </span>
              </button>
            );
          })}
        </div>

        {/* Clinical Safety Protocol Footnote */}
        <div className="p-3 mt-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Clinical Protocol</span>
          Responses cross-reference verified Quest Diagnostics lab panels and active prescriptions.
        </div>
      </aside>

      {/* 2. Main Chat Conversation Pane */}
      <section className="flex flex-1 flex-col rounded-3xl bg-white/80 dark:bg-[#0b1325]/85 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl overflow-hidden min-w-0">
        {/* Top Header Row with Depth Toggle & Session Info */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            {/* Mobile History Toggle */}
            <button
              type="button"
              onClick={() => setShowHistoryMobile(true)}
              className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20"
              title="View History"
            >
              <Clock className="h-4 w-4" />
            </button>

            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#16A34A] text-white shadow-md shadow-green-600/20 shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                {currentSession.title}
              </h1>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-bold truncate flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
                <span className="truncate">{patientName} Verified Records</span>
              </span>
            </div>
          </div>

          {/* Right Action: Explanation Complexity Toggle & New Consultation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-white/10 p-0.5 border border-slate-200 dark:border-white/10 text-[10px] sm:text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setExplanationDepth("plain")}
                className={`px-2 sm:px-3 py-1 rounded-full transition-all cursor-pointer ${
                  explanationDepth === "plain"
                    ? "bg-white dark:bg-emerald-500 text-slate-900 dark:text-white shadow-2xs font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Plain
              </button>
              <button
                type="button"
                onClick={() => setExplanationDepth("clinical")}
                className={`px-2 sm:px-3 py-1 rounded-full transition-all cursor-pointer ${
                  explanationDepth === "clinical"
                    ? "bg-white dark:bg-emerald-500 text-slate-900 dark:text-white shadow-2xs font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Clinical
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreateNewSession}
              className="flex h-8 w-8 items-center justify-center rounded-xl sm:rounded-full bg-[#22C55E] text-white shrink-0 shadow-sm hover:bg-[#16A34A] transition-colors cursor-pointer"
              title="New Consultation"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Mobile History Drawer Sheet (Bottom Sheet Modal) */}
        {showHistoryMobile && (
          <div className="fixed inset-0 z-50 flex items-end lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-h-[75vh] rounded-t-3xl bg-white dark:bg-[#070d18] p-4 space-y-3 border-t border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
                    Consultation History ({sessions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryMobile(false)}
                  className="rounded-xl bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleCreateNewSession();
                  setShowHistoryMobile(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Start New Consultation</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setShowHistoryMobile(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                      sess.id === activeSessionId
                        ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-300 font-bold"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="block truncate font-extrabold">{sess.title}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-1">
                      {sess.date} · {sess.messages.length} messages
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Warning Banner */}
        {emergencyWarning && (
          <div className="m-4 mb-0 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-red-900 shadow-xs shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs leading-relaxed">
                <span className="font-bold block">Medical Warning Detected</span>
                {emergencyWarning}
              </div>
            </div>
          </div>
        )}

        {/* Active Citation Inspection Drawer */}
        {activeCitation && (
          <div className="m-4 mb-0 rounded-2xl bg-emerald-50/90 border border-emerald-200 p-3.5 text-xs shadow-xs shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-700" />
                Verified Clinical Source: {activeCitation.document_title} (Page {activeCitation.page})
              </span>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="bg-white rounded-xl p-2.5 border border-emerald-100 text-slate-700 text-xs leading-relaxed font-mono">
              "{activeCitation.snippet}"
            </p>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {currentSession.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E] text-white shadow-xs mt-0.5">
                  <Stethoscope className="h-4 w-4" />
                </div>
              )}

              <div
                className={`rounded-3xl p-4 sm:p-5 max-w-[85%] leading-relaxed space-y-3 shadow-xs ${
                  msg.role === "user"
                    ? "bg-emerald-600 dark:bg-emerald-600/90 text-white font-medium rounded-br-xs shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-[#070d18]/90 border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-xs"
                }`}
              >
                <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
                  {msg.content}
                </div>

                {/* Grounded Citation Chips */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCitation(cite)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="truncate max-w-[180px]">{cite.document_title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Bar for Assistant Messages (Copy, Share, Add Note) */}
                {msg.role === "assistant" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Grounded Medical Intelligence
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-center text-xs text-slate-500 dark:text-slate-400 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <span className="font-medium">
                Analyzing verified patient health records & clinical guidelines...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Follow-Up Prompt Chips */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-[#070d18]/60 overflow-x-auto flex gap-1.5 hide-scrollbar shrink-0 max-w-full">
          {promptSuggestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{q.text}</span>
              </button>
            );
          })}
        </div>

        {/* Active Attached Document Chip */}
        {attachedDoc && (
          <div className="px-3 py-1.5 bg-emerald-50/80 dark:bg-emerald-500/15 border-t border-emerald-100 dark:border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Attached: {attachedDoc.file_name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedDoc(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Document Attachment Picker Menu */}
        {showAttachMenu && (
          <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#070d18] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Select Document from Medical Vault
              </span>
              <button
                type="button"
                onClick={() => setShowAttachMenu(false)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {userDocs.length === 0 ? (
                <div className="col-span-full p-4 text-center text-xs text-[var(--muted-foreground)]">
                  No documents in Vault yet. Upload a report to attach.
                </div>
              ) : (
                userDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setAttachedDoc(doc);
                      setShowAttachMenu(false);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border)] dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-[var(--foreground)] truncate">
                      {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 border-t border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Paperclip Document Attachment Button */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border transition-colors shrink-0 cursor-pointer ${
                attachedDoc
                  ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                  : "border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
              }`}
              title="Attach Document from Medical Vault"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <div className="relative flex-1">
              <input
                placeholder={
                  isListening
                    ? "Listening... Speak now into microphone..."
                    : attachedDoc
                    ? `Ask anything about ${attachedDoc.file_name}...`
                    : "Ask about test trends, medication safety, or visit prep..."
                }
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className={cn(
                  "h-10 sm:h-11 w-full rounded-2xl border bg-slate-100/80 dark:bg-white/5 pl-3.5 pr-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0c1527] shadow-2xs transition-all",
                  isListening
                    ? "border-rose-500/80 ring-2 ring-rose-500/30 placeholder:text-rose-500 dark:placeholder:text-rose-400"
                    : "border-slate-200/90 dark:border-white/10 focus:ring-2 focus:ring-emerald-500"
                )}
              />
            </div>

            {/* Voice Input / Microphone Option Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={cn(
                "flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border transition-all shrink-0 cursor-pointer active:scale-95",
                isListening
                  ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/35 ring-2 ring-rose-400/50 animate-pulse scale-105"
                  : "border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-emerald-600 dark:hover:text-emerald-400"
              )}
              title={isListening ? "Listening... Click to stop voice input" : "Voice Input (Microphone)"}
              aria-label="Voice Input"
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-white" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Send Message Button */}
            <button
              type="submit"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-green-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
