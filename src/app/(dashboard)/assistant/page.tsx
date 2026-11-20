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
} from "lucide-react";
import { AIMessage, AICitation, AIConversation, MedicalDocument } from "@/types/medical";
import { formatDate } from "@/lib/utils";
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

  const handleSend = async (textToSend?: string) => {
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
      "coughing up blood",
      "anaphylaxis",
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

    if (effectiveUserId) {
      try {
        await saveMessage({
          ...userMessage,
          userId: effectiveUserId,
        });
      } catch {}
    }

    if (!textToSend) setInputQuery("");
    const sentAttachedDoc = attachedDoc;
    setAttachedDoc(null);
    setShowAttachMenu(false);
    setIsTyping(true);

    const storedKey =
      (typeof window !== "undefined" ? localStorage.getItem("chronicai_gemini_key") : null) ||
      (profile?.preferences as any)?.gemini_api_key ||
      "";

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": storedKey,
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          query: query,
          messages: currentSession.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          attachedDocId: sentAttachedDoc?.id,
          explanationDepth: explanationDepth,
          apiKey: storedKey || undefined,
        }),
      });

      const chatResult = await res.json();
      let responseContent = "";
      let citations: AICitation[] = [];

      if (res.ok && chatResult.success) {
        responseContent = chatResult.reply;
        citations = chatResult.citations || [];
        if (chatResult.is_emergency_flag) {
          setEmergencyWarning(
            "Critical Triage Alert: The symptoms you described may indicate a medical emergency. Please call 911 or go to the nearest emergency room immediately."
          );
        }
      } else {
        responseContent =
          chatResult?.message ||
          "I encountered an issue analyzing your records. Please check your network or Gemini API key in Settings.";
      }

      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: activeSessionId,
        role: "assistant",
        content: responseContent,
        citations,
        created_at: new Date().toISOString(),
      };

      if (effectiveUserId) {
        try {
          await saveMessage({
            ...assistantMessage,
            userId: effectiveUserId,
          });
        } catch {}
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch {
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        conversation_id: activeSessionId,
        role: "assistant",
        content:
          "I am currently unable to reach the clinical copilot engine. Please verify your internet connection or Gemini API key in Settings.",
        created_at: new Date().toISOString(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-170px)] lg:h-[calc(100vh-140px)] max-w-6xl mx-auto gap-4">
      {/* 1. Left Sidebar: Chat History & Clinical Sessions (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col rounded-3xl bg-white border border-slate-200/80 p-4 shadow-sm shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Consultation History
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
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
                    ? "bg-emerald-50/90 border border-emerald-200/90 shadow-2xs"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-emerald-700" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold truncate block ${
                      isActive ? "text-emerald-950 font-extrabold" : "text-slate-700"
                    }`}
                  >
                    {sess.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1 pl-5.5 font-medium">
                  {sess.date} · {sess.messages.length} messages
                </span>
              </button>
            );
          })}
        </div>

        {/* Clinical Safety Protocol Footnote */}
        <div className="p-3 mt-2 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-700 block mb-0.5">Clinical Protocol</span>
          Responses cross-reference verified health vault records, clinical biomarkers, and active prescriptions.
        </div>
      </aside>

      {/* 2. Main Chat Conversation Pane */}
      <section className="flex flex-1 flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden min-w-0">
        {/* Top Header Row with Depth Toggle & Session Info */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            {/* Mobile History Toggle */}
            <button
              type="button"
              onClick={() => setShowHistoryMobile(true)}
              className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="View History"
            >
              <Clock className="h-4 w-4" />
            </button>

            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#16A34A] text-white shadow-md shadow-green-600/20 shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-tight">
                {currentSession.title}
              </h1>
              <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold truncate flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0 inline" />
                <span className="truncate">{patientName} Verified Records</span>
              </span>
            </div>
          </div>

          {/* Right Action: Explanation Complexity Toggle & New Consultation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200 text-[10px] sm:text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setExplanationDepth("plain")}
                className={`px-2 sm:px-3 py-1 rounded-full transition-all cursor-pointer ${
                  explanationDepth === "plain"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Plain
              </button>
              <button
                type="button"
                onClick={() => setExplanationDepth("clinical")}
                className={`px-2 sm:px-3 py-1 rounded-full transition-all cursor-pointer ${
                  explanationDepth === "clinical"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
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
          <div className="fixed inset-0 z-50 flex items-end lg:hidden bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-h-[75vh] rounded-t-3xl bg-white p-4 space-y-3 border-t border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Consultation History ({sessions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryMobile(false)}
                  className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:text-slate-800"
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
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block truncate font-extrabold">{sess.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
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
                    ? "bg-[#18261F] text-white font-medium rounded-br-xs"
                    : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs"
                }`}
              >
                <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
                  {msg.content}
                </div>

                {/* Grounded Citation Chips */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCitation(cite)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-700" />
                        <span className="truncate max-w-[180px]">{cite.document_title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Bar for Assistant Messages (Copy, Share, Add Note) */}
                {msg.role === "assistant" && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-emerald-700">
                      Grounded Medical Intelligence
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-slate-700 p-1 transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
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
            <div className="flex gap-3 items-center text-xs text-slate-500 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
        <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/70 overflow-x-auto flex gap-1.5 hide-scrollbar shrink-0 max-w-full">
          {promptSuggestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white border border-slate-200/90 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800 hover:bg-emerald-50/50 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-600" />
                <span>{q.text}</span>
              </button>
            );
          })}
        </div>

        {/* Active Attached Document Chip */}
        {attachedDoc && (
          <div className="px-3 py-1.5 bg-emerald-50/80 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-900">
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">Attached: {attachedDoc.file_name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedDoc(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Document Attachment Picker Menu */}
        {showAttachMenu && (
          <div className="p-3 border-t border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Select Document from Medical Vault
              </span>
              <button
                type="button"
                onClick={() => setShowAttachMenu(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
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
                    className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border)] hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
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
        <div className="p-2.5 sm:p-3 border-t border-slate-200/90 bg-white shrink-0">
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
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "border-slate-200/90 bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
              title="Attach Document from Medical Vault"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <div className="relative flex-1">
              <input
                placeholder={
                  attachedDoc
                    ? `Ask anything about ${attachedDoc.file_name}...`
                    : "Ask about test trends, medication safety, or visit prep..."
                }
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="h-10 sm:h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 pl-3.5 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white shadow-2xs"
              />
            </div>

            <button
              type="submit"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-green-600/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
