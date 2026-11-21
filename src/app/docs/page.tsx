"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  FileText,
  HeartPulse,
  Layers,
  Lock,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Terminal,
  Volume2,
  Zap,
  ChevronRight,
  Calendar,
  Pill,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

type DocSection = "overview" | "architecture" | "api" | "schemas" | "safety" | "quickstart";
type ApiCategory = "all" | "ai" | "medications" | "records" | "profile";

interface ApiEndpoint {
  id: string;
  category: "ai" | "medications" | "records" | "profile";
  method: "POST" | "GET" | "DELETE";
  path: string;
  title: string;
  description: string;
  headers: Array<{ name: string; type: string; required: boolean; desc: string }>;
  requestBody?: object;
  responseBody: object;
  errorResponse?: object;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "analyze-record",
    category: "ai",
    method: "POST",
    path: "/api/records/analyze",
    title: "Multimodal Clinical OCR & Entity Ingestion",
    description:
      "Processes scanned prescriptions, diagnostic lab PDF slips, and hospital discharge notes using Google Gemini 2.5 Flash Multimodal Vision. Extracts numerical biomarkers, reference intervals, dosage courses, and intelligently translates mixed Bengali/English handwriting into standardized clinical English.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "Must be application/json" },
      { name: "Authorization", type: "string", required: false, desc: "Bearer patient session token (optional if user profile active)" },
      { name: "x-gemini-api-key", type: "string", required: false, desc: "Optional client-supplied Gemini API key fallback" },
    ],
    requestBody: {
      fileBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      fileName: "Prescription_Nov2026.jpg",
      mimeType: "image/jpeg",
      documentType: "prescription",
    },
    responseBody: {
      success: true,
      data: {
        category: "prescription",
        facility_name: "Square Hospitals Ltd.",
        doctor_name: "Prof. Dr. Quazi Salim Yazdi",
        document_date: "2026-11-18",
        summary: "Routine cardiovascular and lipid profile follow-up.",
        confidence_score: 0.96,
        lab_results: [
          {
            test_name: "Fasting Blood Sugar (FBS)",
            value: 108,
            unit: "mg/dL",
            reference_range: "70-99",
            is_abnormal: true,
            category: "Diabetes",
          },
          {
            test_name: "HbA1c",
            value: 6.4,
            unit: "%",
            reference_range: "4.0-5.6",
            is_abnormal: true,
            category: "Diabetes",
          },
        ],
        medications: [
          {
            name: "Tab. Metformin HCl",
            generic_name: "Metformin Hydrochloride",
            dosage: "500mg",
            frequency: "Twice daily (1-0-1)",
            route: "oral",
            instructions: "Take 1 tablet after breakfast and 1 tablet after dinner",
            duration_days: 90,
          },
        ],
        diagnoses: [
          { name: "Type 2 Diabetes Mellitus", icd10: "E11.9" },
          { name: "Essential Hypertension", icd10: "I10" },
        ],
      },
    },
    errorResponse: {
      success: false,
      error: "NO_FILE",
      message: "No document file provided for analysis.",
    },
  },
  {
    id: "copilot-chat",
    category: "ai",
    method: "POST",
    path: "/api/assistant/chat",
    title: "Grounded Clinical Copilot (RAG Conversation)",
    description:
      "Conversational health assistant grounded strictly in the patient's verified document vault. Performs pgvector cosine distance retrieval, injects matching clinical snippets into the reasoning context, and cites document origins while enforcing acute emergency triage red lines.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
      { name: "Authorization", type: "string", required: true, desc: "Bearer patient session JWT" },
    ],
    requestBody: {
      message: "What was my fasting blood sugar in my last test, and is it controlled?",
      conversationHistory: [
        { role: "user", content: "Hello doctor." },
        { role: "assistant", content: "Welcome back! How can I help review your health records today?" },
      ],
      language: "en",
      depth: "balanced",
    },
    responseBody: {
      reply:
        "Based on your laboratory report from November 18, 2026 (Square Hospitals Ltd.), your Fasting Blood Sugar was recorded at **108 mg/dL** (Reference: 70–99 mg/dL).\n\nThis is slightly elevated above standard non-diabetic reference ranges but reflects a steady improvement compared to your previous value of 118 mg/dL on October 12, 2026.\n\n*Source: Prescription_Nov2026.jpg (Verified Lab Report, 11/18/2026)*",
      sources: [
        {
          documentId: "doc_9f43ab21",
          documentTitle: "Prescription_Nov2026.jpg",
          date: "2026-11-18",
          snippet: "Fasting Blood Sugar: 108 mg/dL. Ref: 70-99 mg/dL. Status: ELEVATED.",
        },
      ],
      isEmergency: false,
    },
  },
  {
    id: "rag-embed",
    category: "ai",
    method: "POST",
    path: "/api/rag/embed",
    title: "Vector Embedding Generator (pgvector Indexing)",
    description:
      "Calculates 768-dimensional semantic embeddings using Google's `gemini-embedding-001` model and stores them directly into the PostgreSQL `document_chunks` table via Supabase for high-performance HNSW vector similarity search.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
      { name: "Authorization", type: "string", required: true, desc: "Bearer user auth token" },
    ],
    requestBody: {
      documentId: "doc_9f43ab21-8b20-41fa-8a19",
      userId: "usr_4829a1b0-2300-4821",
      chunks: [
        "Patient: Naim. Date: 11/18/2026. Prescribed Curafin Cream 0.25% (Amarolfine), topical, 1 time daily (Noon) for 6 weeks.",
        "Diagnostic findings: Fasting glucose 108 mg/dL, HbA1c 6.4%, Blood pressure 125/82 mmHg.",
      ],
      metadata: { facility: "Square Hospital", doctor: "Dr. Quazi Salim" },
    },
    responseBody: {
      success: true,
      inserted: 2,
      dimensions: 768,
      model: "models/gemini-embedding-001",
    },
  },
  {
    id: "assistant-tts",
    category: "ai",
    method: "POST",
    path: "/api/assistant/tts",
    title: "Neural Text-To-Speech (Edge Neural Voice)",
    description:
      "Generates streaming MP3 audio synthesis of clinical responses for low-literacy patients and elderly users using Microsoft Edge Neural TTS with adaptive English and Bengali voice models.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
    ],
    requestBody: {
      text: "Your fasting blood sugar was 108 mg/dL on your last test.",
      voice: "en-US-JennyNeural",
      rate: "+0%",
      pitch: "+0Hz",
    },
    responseBody: {
      status: "Audio stream returned as audio/mpeg binary payload",
    },
  },
  {
    id: "log-medication",
    category: "medications",
    method: "POST",
    path: "/api/medications/log",
    title: "Medication Adherence Logging",
    description:
      "Records patient dose intake events for daily streak analytics, 7-day adherence calculations, and real-time synchronization across devices.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
      { name: "Authorization", type: "string", required: true, desc: "Bearer session token" },
    ],
    requestBody: {
      medication_id: "med_5a109c8e",
      user_id: "usr_4829a1b0-2300-4821",
      scheduled_time: "2026-11-21T08:00:00Z",
      status: "taken",
      notes: "Taken after breakfast with warm water",
    },
    responseBody: {
      success: true,
      log: {
        id: "log_728b9c1",
        medication_id: "med_5a109c8e",
        status: "taken",
        logged_at: "2026-11-21T08:05:22.140Z",
        streak_count: 7,
      },
    },
  },
  {
    id: "update-medication",
    category: "medications",
    method: "POST",
    path: "/api/medications/update",
    title: "Medication Course & Timing Lifecycle",
    description:
      "Updates active prescriptions, dosage amounts, range-based course start/end dates, prescribing doctors, and meal-time instructions with automatic bidirectional language formatting.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
    ],
    requestBody: {
      id: "med_5a109c8e",
      user_id: "usr_4829a1b0-2300-4821",
      updates: {
        name: "Curafin Cream 0.25%",
        generic_name: "Amarolfine",
        strength: "0.25%",
        frequency: "1 time daily",
        instructions: "1 time daily (Noon) 6 weeks",
        start_date: "2026-11-18",
        end_date: "2026-12-30",
        status: "active",
      },
    },
    responseBody: {
      success: true,
      medication: {
        id: "med_5a109c8e",
        name: "Curafin Cream 0.25%",
        status: "active",
        updated_at: "2026-11-21T21:20:00Z",
      },
    },
  },
  {
    id: "update-appointment",
    category: "records",
    method: "POST",
    path: "/api/appointments/update",
    title: "Doctor Consultation & Appointment Scheduling",
    description:
      "Manages upcoming clinical consultations, doctor specialty details, hospital locations, and automated reminder notifications.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
    ],
    requestBody: {
      id: "apt_110294ab",
      user_id: "usr_4829a1b0-2300-4821",
      doctor_name: "Prof. Dr. Quazi Salim Yazdi",
      specialty: "Cardiology & Diabetology",
      location: "Square Hospitals Ltd., Dhaka",
      appointment_date: "2026-11-28",
      appointment_time: "17:30",
      status: "scheduled",
    },
    responseBody: {
      success: true,
      appointment: {
        id: "apt_110294ab",
        status: "scheduled",
        appointment_date: "2026-11-28",
      },
    },
  },
  {
    id: "update-profile",
    category: "profile",
    method: "POST",
    path: "/api/profile/update",
    title: "Health Profile & Emergency Medical Card",
    description:
      "Persists patient emergency contacts, blood type, known chronic conditions, drug allergy alerts, and localized application preferences.",
    headers: [
      { name: "Content-Type", type: "application/json", required: true, desc: "application/json" },
    ],
    requestBody: {
      user_id: "usr_4829a1b0-2300-4821",
      updates: {
        blood_type: "O+",
        allergies: ["Penicillin", "Amoxicillin"],
        chronic_conditions: ["Type 2 Diabetes", "Essential Hypertension"],
        emergency_contact: {
          name: "Nasrin Akhter",
          relationship: "Spouse",
          phone: "+880 1711-000000",
        },
        preferences: {
          language: "bn",
          theme: "dark",
          explanation_depth: "balanced",
        },
      },
    },
    responseBody: {
      success: true,
      profile: {
        user_id: "usr_4829a1b0-2300-4821",
        updated_at: "2026-11-21T21:22:00Z",
      },
    },
  },
];

export default function DocumentationPage() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<DocSection>("overview");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("analyze-record");
  const [apiFilter, setApiFilter] = useState<ApiCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter((ep) => {
      const matchesCategory = apiFilter === "all" || ep.category === apiFilter;
      const matchesSearch =
        ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [apiFilter, searchQuery]);

  const currentEndpoint = useMemo(() => {
    return API_ENDPOINTS.find((ep) => ep.id === selectedEndpoint) || API_ENDPOINTS[0];
  }, [selectedEndpoint]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-emerald-500/20">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200/80 p-0.5">
                <Image
                  src="/logo.png"
                  alt="ChronicAI Logo"
                  width={42}
                  height={28}
                  className="object-contain w-full h-full scale-110"
                  priority
                />
              </div>
              <span className="font-display text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Chronic<span className="text-emerald-500">AI</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Docs v1.0 Production
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-semibold border-slate-200 dark:border-white/10 hidden sm:flex"
              asChild
            >
              <a href="https://github.com/Naim-006/ChronicAi" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                GitHub
              </a>
            </Button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer"
              title="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Button
              size="sm"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs px-4"
              asChild
            >
              <Link href="/dashboard">
                Go to App
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Documentation Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-white/10 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: "overview" as const, label: "Overview & Rationale", icon: BookOpen },
            { id: "architecture" as const, label: "System Architecture", icon: Layers },
            { id: "api" as const, label: "REST API Reference", icon: Code2, count: API_ENDPOINTS.length },
            { id: "schemas" as const, label: "Data Schemas & FHIR", icon: Database },
            { id: "safety" as const, label: "Clinical Safety & Guardrails", icon: ShieldAlert },
            { id: "quickstart" as const, label: "Quickstart & cURL", icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Section Contents */}
        <div className="mt-8">
          {/* 1. OVERVIEW SECTION */}
          {activeSection === "overview" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="max-w-3xl">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Platform Documentation
                </span>
                <h1 className="mt-1 font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  ChronicAI Architecture & Developer Documentation
                </h1>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                  ChronicAI is a privacy-first, lifelong health intelligence platform that turns scattered prescriptions, lab PDFs, and vitals into a structured, longitudinal health timeline. With multimodal clinical OCR, bidirectional Bangla/English localization, and grounded RAG clinical reasoning, patients gain an autonomous 24/7 personal health advisor while doctors access tamper-proof, verified medical histories in seconds.
                </p>
              </div>

              {/* Core Feature Pillars */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    icon: Cpu,
                    title: "Multimodal Clinical OCR",
                    desc: "Extracts lab results, prescriptions, and diagnoses from messy mobile camera captures with automated Bengali-to-English medical normalization.",
                  },
                  {
                    icon: Stethoscope,
                    title: "Grounded Clinical Copilot",
                    desc: "Answers health queries exclusively from verified patient documents via pgvector RAG with clickable document citations.",
                  },
                  {
                    icon: Pill,
                    title: "Course-Based Adherence",
                    desc: "Range-based prescription course lifecycles with meal-time scheduling, daily adherence logs, and drug-drug contraindication checks.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Zero-Knowledge Data Isolation",
                    desc: "Supabase Row-Level Security (RLS) ensures absolute cryptographic separation; no user or doctor can access another patient's medical records.",
                  },
                  {
                    icon: HeartPulse,
                    title: "Bilingual Medical Localization",
                    desc: "Instant real-time UI and instruction switching between English and Bengali (বাংলা), including numerals and clinical meal directions.",
                  },
                  {
                    icon: Lock,
                    title: "HIPAA / HL7 FHIR Compatible",
                    desc: "Structured exports and data models aligned with modern healthcare interoperability specifications.",
                  },
                ].map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.title}
                      className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-xl shadow-xs"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mb-3.5">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{pillar.title}</h3>
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* System Specs Overview */}
              <div className="rounded-2.5xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-6">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mb-3">
                  Production System Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Framework</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Next.js 16 (Turbopack)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Database</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Supabase PostgreSQL</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Vector Search</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">pgvector (768-dim)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Vision AI Engine</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Google Gemini 2.5 Flash</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. ARCHITECTURE SECTION */}
          {activeSection === "architecture" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Engineering Blueprint
                </span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  End-to-End System Architecture
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  How raw documents transition into structured clinical telemetry, vector search indices, and doctor-ready summaries.
                </p>
              </div>

              {/* ASCII / Visual Flow Diagram */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-900 p-5 text-slate-200 font-mono text-xs overflow-x-auto shadow-md">
                <div className="text-emerald-400 font-bold mb-3">// ChronicAI Data Ingestion & Retrieval Pipeline Flow</div>
                <pre className="leading-relaxed">
{`[ Patient Upload ]
      │ (Prescription Photo / Lab PDF Slip)
      ▼
[ Client Preprocessing ] ────────► Base64 Cleaning, Rotation & Canvas Thresholding
      │
      ▼
[ Gemini 2.5 Flash Vision ] ─────► Multimodal Extraction + Bengali-to-English Medical Translation
      │
      ├────────────────────────┬─────────────────────────┐
      ▼                        ▼                         ▼
[ Structured Lab Data ]   [ Active Medications ]   [ Semantic Text Chunks ]
      │                        │                         │
      ▼                        ▼                         ▼
[ Postgres Tables ]       [ Course Lifecycle ]     [ gemini-embedding-001 (768d) ]
(lab_results, vitals)     (daily reminders)              │
                                                         ▼
                                                   [ Supabase pgvector ]
                                                   (document_chunks table)
                                                         │
                                                         ▼
                                              [ User Query in Copilot ]
                                                         │
                                                         ▼
                                              [ Cosine Vector Similarity ]
                                                         │
                                                         ▼
                                              [ Grounded Answer + Citations ]`}
                </pre>
              </div>

              {/* Architecture Layers Breakdown */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                    Layer 1: Ingestion
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Multimodal Vision OCR</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Uses Gemini 2.5 Flash to parse handwriting, tabular lab tests, and doctor notes, mapping Bengali clinical instructions (e.g. &quot;১ বার দুপুর&quot;) into standardized clinical English.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                    Layer 2: Indexing
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">pgvector Vector Store</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Splits verified medical records into 1,000–1,500 token semantic chunks. Embeddings are stored in Supabase PostgreSQL with HNSW cosine similarity search.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                    Layer 3: Delivery
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Grounded Clinical RAG</h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Clinical Copilot grounds all answers strictly in the patient&apos;s retrieved documents, provides clickable document citations, and halts on acute emergency red-flags.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. REST API REFERENCE */}
          {activeSection === "api" && (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Endpoint List Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                {/* Search & Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search endpoints..."
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-[var(--foreground)] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {(["all", "ai", "medications", "records", "profile"] as ApiCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setApiFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        apiFilter === cat
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                  {filteredEndpoints.map((ep) => {
                    const isSelected = selectedEndpoint === ep.id;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => setSelectedEndpoint(ep.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                            : "border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              ep.method === "POST"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : ep.method === "GET"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                            {ep.path}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{ep.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Endpoint Detail Panel */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-2.5xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs">
                  {/* Endpoint Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider ${
                        currentEndpoint.method === "POST"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : currentEndpoint.method === "GET"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                          : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {currentEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {currentEndpoint.path}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-black text-slate-900 dark:text-white">
                    {currentEndpoint.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {currentEndpoint.description}
                  </p>

                  {/* Headers Table */}
                  <div className="mt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Request Headers
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                      <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-white/10">
                        <thead className="bg-slate-50 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-300">
                          <tr>
                            <th className="p-2.5">Header</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Required</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                          {currentEndpoint.headers.map((h) => (
                            <tr key={h.name}>
                              <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">{h.name}</td>
                              <td className="p-2.5 text-slate-500">{h.type}</td>
                              <td className="p-2.5 font-bold">
                                {h.required ? (
                                  <span className="text-rose-600 dark:text-rose-400 font-sans text-[10px]">Required</span>
                                ) : (
                                  <span className="text-slate-400 font-sans text-[10px]">Optional</span>
                                )}
                              </td>
                              <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">{h.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Request Body JSON */}
                  {currentEndpoint.requestBody && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Request Payload (JSON)
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(currentEndpoint.requestBody, null, 2),
                              `req-${currentEndpoint.id}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {copiedId === `req-${currentEndpoint.id}` ? (
                            <>
                              <Check className="h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy Request
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 p-4 text-emerald-300 font-mono text-[11px] overflow-x-auto shadow-inner">
                        <pre>{JSON.stringify(currentEndpoint.requestBody, null, 2)}</pre>
                      </div>
                    </div>
                  )}

                  {/* Response Body JSON */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Response Payload (200 OK)
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(currentEndpoint.responseBody, null, 2),
                            `res-${currentEndpoint.id}`
                          )
                        }
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {copiedId === `res-${currentEndpoint.id}` ? (
                          <>
                            <Check className="h-3 w-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> Copy Response
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 p-4 text-slate-200 font-mono text-[11px] overflow-x-auto shadow-inner">
                      <pre>{JSON.stringify(currentEndpoint.responseBody, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SCHEMAS & FHIR */}
          {activeSection === "schemas" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Data Dictionary
                </span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Database Relational Schemas & FHIR Alignment
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Built on PostgreSQL with strict Row-Level Security, foreign keys, and HL7 FHIR (Fast Healthcare Interoperability Resources) naming standards.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    table: "health_profiles",
                    fhir: "FHIR Patient Resource",
                    desc: "Stores core patient identification, blood group, chronic conditions, emergency contact, and language preference.",
                    fields: [
                      { name: "id", type: "UUID (PK)", desc: "Unique patient identifier" },
                      { name: "user_id", type: "UUID (FK)", desc: "References auth.users" },
                      { name: "blood_type", type: "VARCHAR(5)", desc: "e.g. O+, B+, A-" },
                      { name: "chronic_conditions", type: "TEXT[]", desc: "e.g. ['Diabetes', 'Hypertension']" },
                      { name: "allergies", type: "TEXT[]", desc: "e.g. ['Penicillin']" },
                      { name: "preferences", type: "JSONB", desc: "{ language: 'bn', theme: 'dark' }" },
                    ],
                  },
                  {
                    table: "medications",
                    fhir: "FHIR MedicationRequest Resource",
                    desc: "Longitudinal record of patient prescriptions, course ranges, daily dosage schedules, and prescribing doctors.",
                    fields: [
                      { name: "id", type: "UUID (PK)", desc: "Unique medication entity" },
                      { name: "name", type: "TEXT", desc: "Commercial brand name" },
                      { name: "generic_name", type: "TEXT", desc: "Active chemical formulation" },
                      { name: "strength", type: "TEXT", desc: "e.g. 500mg, 0.25%" },
                      { name: "frequency", type: "TEXT", desc: "e.g. Once daily, 1-0-1" },
                      { name: "instructions", type: "TEXT", desc: "Standardized meal schedule" },
                      { name: "start_date / end_date", type: "DATE", desc: "Active prescription course range" },
                      { name: "status", type: "VARCHAR(20)", desc: "'active' | 'completed' | 'discontinued'" },
                    ],
                  },
                  {
                    table: "lab_results",
                    fhir: "FHIR Observation Resource",
                    desc: "Quantitative clinical biomarkers extracted from diagnostic lab slips with automated abnormal tagging.",
                    fields: [
                      { name: "id", type: "UUID (PK)", desc: "Unique biomarker result" },
                      { name: "document_id", type: "UUID (FK)", desc: "Parent document record" },
                      { name: "test_name", type: "TEXT", desc: "e.g. Fasting Blood Glucose, HbA1c" },
                      { name: "value", type: "NUMERIC", desc: "Observed test number" },
                      { name: "unit", type: "VARCHAR(20)", desc: "mg/dL, %, mmHg, pg/mL" },
                      { name: "reference_range", type: "VARCHAR(50)", desc: "e.g. '70-99'" },
                      { name: "is_abnormal", type: "BOOLEAN", desc: "Evaluated clinical risk status" },
                    ],
                  },
                  {
                    table: "document_chunks",
                    fhir: "FHIR DocumentReference & Vector",
                    desc: "Dense semantic text slices with vector embeddings for cosine similarity retrieval in RAG conversations.",
                    fields: [
                      { name: "id", type: "UUID (PK)", desc: "Chunk identifier" },
                      { name: "document_id", type: "UUID (FK)", desc: "Parent document" },
                      { name: "user_id", type: "UUID (FK)", desc: "Patient owner" },
                      { name: "content", type: "TEXT", desc: "Clinical context text slice" },
                      { name: "embedding", type: "VECTOR(768)", desc: "gemini-embedding-001 vector" },
                    ],
                  },
                ].map((s) => (
                  <div
                    key={s.table}
                    className="rounded-2.5xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {s.table}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                        {s.fhir}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{s.desc}</p>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                      <table className="w-full text-left text-[11px] divide-y divide-slate-100 dark:divide-white/5">
                        <thead className="bg-slate-50 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-300">
                          <tr>
                            <th className="p-2">Field</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                          {s.fields.map((f) => (
                            <tr key={f.name}>
                              <td className="p-2 font-bold text-slate-900 dark:text-white">{f.name}</td>
                              <td className="p-2 text-emerald-600 dark:text-emerald-400">{f.type}</td>
                              <td className="p-2 font-sans text-slate-500">{f.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 5. CLINICAL SAFETY */}
          {activeSection === "safety" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Responsible Healthcare AI
                </span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Clinical Guardrails & Triage Protocols
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Autonomous intelligence must adhere to clinical ethical boundaries. ChronicAI implements strict safety fences.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-5">
                  <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                    <ShieldAlert className="h-5 w-5" />
                    Emergency Red-Line Interception
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                    Any query mentioning acute red-flag symptoms (e.g. crushing chest pain, stroke symptoms, acute shortness of breath, blood sugar &lt; 50 mg/dL) immediately bypasses generative processing and displays immediate emergency guidance: call 999 (Bangladesh) or 911 (International).
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5" />
                    Zero-Hallucination Citation Policy
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                    The Clinical Copilot will NEVER fabricate lab test values or guess unrecorded medications. Every response links directly to the uploaded physical document with test dates and hospital credentials.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    Multi-Tier Health Literacy
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Patients can toggle between Layman (conversational analogies), Balanced (recommended mix of biomarkers and plain language), and Clinical (in-depth physiological terminology) explanation modes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Lock className="h-5 w-5 text-emerald-500" />
                    Cryptographic Multi-Tenant Isolation
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Supabase PostgreSQL Row-Level Security (RLS) ensures that authenticated users can only query their own records. Service-role master keys are strictly isolated on the backend.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. QUICKSTART & CURL */}
          {activeSection === "quickstart" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Developer Integration
                </span>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Quickstart Guide & cURL Examples
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Integrate ChronicAI endpoints directly into your web, mobile, or hospital management system.
                </p>
              </div>

              {/* cURL Example Card */}
              <div className="rounded-2.5xl border border-slate-200 dark:border-white/10 bg-slate-900 p-6 text-slate-200 font-mono text-xs shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <Terminal className="h-4 w-4" /> cURL: Analyze Prescription
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `curl -X POST https://chronicai.vercel.app/api/records/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileBase64": "data:image/jpeg;base64,/9j/4AAQSk...",
    "fileName": "Prescription_Nov2026.jpg",
    "documentType": "prescription"
  }'`,
                        "curl-1"
                      )
                    }
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "curl-1" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto text-emerald-300 leading-relaxed">
{`curl -X POST https://chronicai.vercel.app/api/records/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "fileName": "Prescription_Nov2026.jpg",
    "documentType": "prescription"
  }'`}
                </pre>
              </div>

              {/* TypeScript Example Card */}
              <div className="rounded-2.5xl border border-slate-200 dark:border-white/10 bg-slate-900 p-6 text-slate-200 font-mono text-xs shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> TypeScript Fetch Example
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `const response = await fetch("/api/assistant/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What was my fasting glucose?",
    language: "en",
    depth: "balanced"
  })
});

const data = await response.json();
console.log(data.reply, data.sources);`,
                        "ts-1"
                      )
                    }
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "ts-1" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto text-slate-200 leading-relaxed">
{`const response = await fetch("/api/assistant/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What was my fasting glucose?",
    language: "en",
    depth: "balanced"
  })
});

const data = await response.json();
console.log(data.reply, data.sources);`}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
