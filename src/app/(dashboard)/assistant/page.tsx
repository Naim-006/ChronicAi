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
  ChevronRight,
  HelpCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AIMessage, AICitation, AIConversation, MedicalDocument } from "@/types/medical";
import { formatDate, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getDocuments } from "@/lib/supabase/services/documents";
import {
  getConversations,
  getMessages,
  createConversation,
  saveMessage,
} from "@/lib/supabase/services/copilot";
import { useRealtimeTable } from "@/hooks/useRealtime";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: AIMessage[];
}

const dynamicPromptSuggestions = [
  { text: "Review instructions & schedule for my active medications", category: "Meds", icon: Pill },
  { text: "What key questions should I ask my doctor at my next consultation?", category: "Visits", icon: Calendar },
  { text: "Explain what my latest laboratory biomarker results mean", category: "Labs", icon: Activity },
  { text: "What lifestyle or dietary adjustments align with my health guidelines?", category: "Lifestyle", icon: Sparkles },
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
          content: "Hello! I am your Clinical Assistant, grounded directly in your verified medical records, diagnostic lab panels, and health guidelines.\n\nHow can I assist you with your health records, lab panels, or medication schedule today?",
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
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Automatically derive voice speech recognition & speech synthesis language from Settings
  const activeVoiceLang = language === "bn" ? "bn-BD" : language === "es" ? "es-ES" : "en-US";

  // Clean markdown syntax for natural voice synthesis
  const cleanMarkdownForSpeech = (md: string) => {
    return md
      .replace(/###?\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[📊💡🩺📋⚠️•\-]/g, "")
      .replace(/\n+/g, " ")
      .trim();
  };

  const handleSpeak = (msgId: string, content: string) => {
    // If clicking the currently playing message, stop playback immediately
    if (speakingMsgId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      setIsAudioLoading(false);
      return;
    }

    // Stop any previously playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const plainText = cleanMarkdownForSpeech(content);
    if (!plainText) return;

    // Detect language: check if text has Bengali characters or settings language is Bengali
    const hasBengali = /[\u0980-\u09FF]/.test(plainText);
    const targetLang = hasBengali ? "bn" : language === "es" ? "es" : "en";

    setSpeakingMsgId(msgId);
    setIsAudioLoading(true);

    const storedKey =
      (typeof window !== "undefined" ? localStorage.getItem("chronicai_gemini_key") : null) ||
      (profile?.preferences as any)?.gemini_api_key ||
      "";

    // Call server-side High-Fidelity Human AI Voice API (Gemini Native / Azure Edge)
    fetch("/api/assistant/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: plainText.slice(0, 850),
        lang: targetLang,
        apiKey: storedKey || undefined,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`TTS HTTP error: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsAudioLoading(false);
          setSpeakingMsgId(msgId);
        };

        audio.onended = () => {
          setSpeakingMsgId(null);
          setIsAudioLoading(false);
          URL.revokeObjectURL(objectUrl);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsAudioLoading(false);
          setSpeakingMsgId(null);
          URL.revokeObjectURL(objectUrl);
        };

        return audio.play();
      })
      .catch((err) => {
        console.warn("Neural audio streaming error, falling back to browser synthesis:", err);
        setIsAudioLoading(false);
        // Fallback to local browser speech synthesis if audio playback fails
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 400));
          utterance.lang = activeVoiceLang;
          utterance.rate = activeVoiceLang === "bn-BD" ? 0.95 : 1.0;
          utterance.onend = () => setSpeakingMsgId(null);
          utterance.onerror = () => setSpeakingMsgId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setSpeakingMsgId(null);
        }
      });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
          recognition.lang = activeVoiceLang;

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

    // Fallback timer if speech recognition is unsupported or blocked
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
      content: `Hello ${patientName}. I am your Clinical Assistant, grounded directly in your verified medical records, diagnostic lab panels, and health guidelines.\n\nHow can I assist you with your health records, lab panels, or medication schedule today?`,
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
          const isDefaultTitle = s.title === "New Health Consultation" || s.title === "Health Consultation";
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
          userLanguage: language,
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
          "I encountered an issue analyzing your records. Please check your network or try again.";
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
          "I am currently unable to reach the clinical AI engine. Please check your connection and try again.",
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
    <div className="flex h-[calc(100dvh-138px)] sm:h-[calc(100dvh-148px)] lg:h-[calc(100vh-125px)] max-w-6xl mx-auto gap-4">
      {/* 1. Left Sidebar: Chat History & Clinical Sessions (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col rounded-3xl bg-white/80 dark:bg-[#0b1325]/85 border border-slate-200/80 dark:border-white/10 p-4 shadow-sm backdrop-blur-xl shrink-0">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">
              Consultations
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
          Grounded directly in verified EHR vault records, ADA/ACC guidelines, and lab biomarkers.
        </div>
      </aside>

      {/* 2. Main Chat Conversation Pane */}
      <section className="flex flex-1 flex-col rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#070d18]/90 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl overflow-hidden min-w-0">
        
        {/* Top Header Row with Depth Toggle & Session Info */}
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-xl gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Mobile History Toggle Button */}
            <button
              type="button"
              onClick={() => setShowHistoryMobile(true)}
              className="md:hidden flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
              title="Consultation History"
              aria-label="View Consultation History"
            >
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#22C55E] to-[#16A34A] text-white shadow-md shadow-green-600/20 shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                {currentSession.title}
              </h1>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />
                <span className="truncate">{patientName}&apos;s EHR Grounded</span>
              </span>
            </div>
          </div>

          {/* Right Action: Explanation Complexity Toggle & New Consultation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-white/10 p-0.5 border border-slate-200 dark:border-white/10 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setExplanationDepth("plain")}
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
                className={`px-2 sm:px-2.5 py-1 rounded-full transition-all cursor-pointer ${
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
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm active:scale-95 transition-all cursor-pointer"
              title="New Consultation"
              aria-label="New Consultation"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Patient Clinical Dossier Context Strip */}
        <div className="px-3.5 py-1.5 bg-slate-50/90 dark:bg-white/[0.03] border-b border-slate-200/70 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white truncate">
              Grounded Dossier:
            </span>
            <span className="text-slate-500 truncate">
              {profile?.chronic_conditions && profile.chronic_conditions.length > 0
                ? profile.chronic_conditions.map((c: any) => typeof c === "string" ? c : c.name || "").filter(Boolean).join(", ")
                : "Active Clinical Profile"} &middot; {userDocs.length} Verified Document{userDocs.length === 1 ? "" : "s"}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0 hidden sm:inline">
            ADA / ACC / KDIGO Aligned
          </span>
        </div>

        {/* Mobile History Drawer Sheet */}
        {showHistoryMobile && (
          <div className="fixed inset-0 z-50 flex items-end md:hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-h-[80vh] rounded-t-3xl bg-white dark:bg-[#070d18] p-4 pb-6 space-y-3 border-t border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-bottom">
              <div className="mx-auto h-1 w-12 rounded-full bg-slate-300 dark:bg-white/20 mb-1" />
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
                  className="rounded-xl bg-slate-100 dark:bg-white/10 p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
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
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Start New Consultation</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh]">
                {sessions.map((sess) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setShowHistoryMobile(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
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
          <div className="m-3 mb-0 rounded-2xl bg-red-50 border border-red-200 p-3 text-red-900 shadow-xs shrink-0">
            <div className="flex items-start gap-2">
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
          <div className="m-3 mb-0 rounded-2xl bg-emerald-50/95 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 p-3 text-xs shadow-xs shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                Verified Clinical Source: {activeCitation.document_title}
              </span>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="bg-white dark:bg-[#070d18] rounded-xl p-2.5 border border-emerald-100 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-mono">
              &quot;{activeCitation.snippet}&quot;
            </p>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {currentSession.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 text-xs ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-green-600 text-white shadow-xs mt-0.5">
                  <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              )}

              <div
                className={`rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 leading-relaxed space-y-3 shadow-xs ${
                  msg.role === "user"
                    ? "max-w-[88%] sm:max-w-[80%] bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-medium rounded-br-xs shadow-md shadow-emerald-600/20"
                    : "max-w-[95%] sm:max-w-[88%] bg-white dark:bg-[#0b1325]/90 border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-xs"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="text-xs font-normal leading-relaxed text-slate-800 dark:text-slate-100 space-y-2 [&>h3]:text-sm [&>h3]:font-black [&>h3]:text-slate-900 dark:[&>h3]:text-white [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:border-b [&>h3]:border-slate-100 dark:[&>h3]:border-white/10 [&>h3]:pb-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1.5 [&>p]:leading-relaxed [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-emerald-300 [&>table]:w-full [&>table]:text-xs [&>table]:border-collapse [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-white/20 [&_th]:p-1.5 [&_th]:bg-slate-50 dark:[&_th]:bg-white/5 [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-white/20 [&_td]:p-1.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-xs font-normal leading-relaxed">
                    {msg.content}
                  </div>
                )}

                {/* Grounded Citation Chips */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveCitation(cite)}
                        className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors cursor-pointer"
                      >
                        <FileText className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                        <span className="truncate max-w-[170px]">{cite.document_title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Bar for Assistant Messages */}
                {msg.role === "assistant" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-slate-400 dark:text-slate-400 text-[10px]">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-emerald-500" />
                      Grounded Medical Intelligence
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Text-to-Speech High-Fidelity Voice Playback */}
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          speakingMsgId === msg.id
                            ? "text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-500/40 shadow-xs"
                            : "hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                        }`}
                        title={speakingMsgId === msg.id ? "Stop Voice Playback" : "Listen to Human-like AI Voice Explanation"}
                        aria-label="Listen to explanation"
                      >
                        {speakingMsgId === msg.id ? (
                          isAudioLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {language === "bn" ? "ভয়েস তৈরি হচ্ছে..." : "Generating voice..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                {language === "bn" ? "থামান" : "Stop"}
                              </span>
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{language === "bn" ? "শুনুন" : "Listen"}</span>
                          </>
                        )}
                      </button>

                      {/* Copy Response */}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 px-1 py-0.5 transition-colors cursor-pointer"
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
            <div className="flex gap-2.5 items-center text-xs text-slate-500 dark:text-slate-400 py-1">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <span className="font-medium animate-pulse">
                Analyzing verified patient EHR records & clinical practice standards...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Follow-Up Prompt Chips */}
        <div className="px-3 py-1.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#070d18]/70 overflow-x-auto flex gap-1.5 hide-scrollbar shrink-0 max-w-full">
          {dynamicPromptSuggestions.map((q, idx) => {
            const Icon = q.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q.text)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <Icon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>{q.text}</span>
              </button>
            );
          })}
        </div>

        {/* Active Attached Document Chip */}
        {attachedDoc && (
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="truncate">Attached to consultation: {attachedDoc.file_name}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedDoc(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 shrink-0 cursor-pointer"
              title="Remove Attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Document Attachment Picker Menu */}
        {showAttachMenu && (
          <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#070d18] space-y-2 shrink-0 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                Select Document from Medical Vault
              </span>
              <button
                type="button"
                onClick={() => setShowAttachMenu(false)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {userDocs.length === 0 ? (
                <div className="col-span-full p-4 text-center text-xs text-[var(--muted-foreground)]">
                  No documents in Vault yet. Upload a report in Vault to attach.
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
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                        {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize block">
                        {doc.category.replace("_", " ")} {doc.document_date ? `· ${formatDate(doc.document_date)}` : ""}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Input Bar (Adaptive & Roomy on Mobile) */}
        <div className="p-2 sm:p-3 border-t border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#070d18]/95 backdrop-blur-xl shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            {/* Paperclip Document Attachment Button */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border transition-colors shrink-0 cursor-pointer ${
                attachedDoc
                  ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-400 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
              title="Attach Document from Medical Vault"
              aria-label="Attach Document"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Input Field */}
            <div className="relative flex-1 min-w-0">
              <input
                placeholder={
                  isListening
                    ? activeVoiceLang === "bn-BD"
                      ? "শুনছি... বাংলায় কথা বলুন..."
                      : "Listening in English... Speak now..."
                    : attachedDoc
                    ? `Ask about ${attachedDoc.file_name}...`
                    : activeVoiceLang === "bn-BD"
                    ? "চিকিৎসা সংক্রান্ত যেকোনো প্রশ্ন লিখুন..."
                    : "Ask about lab trends, medications, guidelines..."
                }
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className={cn(
                  "h-9 sm:h-10 w-full rounded-xl sm:rounded-2xl border bg-slate-100/90 dark:bg-white/5 px-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0c1527] shadow-2xs transition-all",
                  isListening
                    ? "border-rose-500 ring-2 ring-rose-500/30 placeholder:text-rose-500"
                    : "border-slate-200/90 dark:border-white/10 focus:ring-2 focus:ring-emerald-500"
                )}
              />
            </div>

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={cn(
                "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl border transition-all shrink-0 cursor-pointer active:scale-95",
                isListening
                  ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/35 ring-2 ring-rose-400/50 animate-pulse scale-105"
                  : "border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-emerald-600"
              )}
              title={
                isListening
                  ? "Listening... Click to stop"
                  : `Voice Input (${activeVoiceLang === "bn-BD" ? "বাংলা" : "English"})`
              }
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
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Send Message"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
