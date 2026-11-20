"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  FileText,
  FolderLock,
  HeartPulse,
  History,
  Pill,
  Quote,
  ScanLine,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true, margin: "-40px" },
};

const fadeUpChild = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

const features = [
  {
    icon: FolderLock,
    title: "Medical Vault",
    description:
      "Keep every prescription, lab result, scan, and discharge paper in one safe place.",
  },
  {
    icon: History,
    title: "Health Timeline",
    description:
      "See every visit, test, and medicine change in date order, all in one list.",
  },
  {
    icon: Pill,
    title: "Medications",
    description:
      "Track what you take each day, get refill reminders, and never miss a dose.",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    description:
      "Ask about your records and get answers that quote the exact document they came from.",
  },
  {
    icon: HeartPulse,
    title: "Chronic Care",
    description:
      "Log glucose, blood pressure, and weight. Get alerts when something looks off.",
  },
  {
    icon: Share2,
    title: "Doctor Sharing",
    description:
      "Send your doctor a clean summary or a private link that expires on its own.",
  },
];

const steps = [
  {
    step: "1",
    title: "Add your records",
    description:
      "Take a photo or upload a PDF. The app reads it and you check the result before it is saved.",
  },
  {
    step: "2",
    title: "See your whole health picture",
    description:
      "Tests, medicines, visits, and vitals line up on one timeline you can search anytime.",
  },
  {
    step: "3",
    title: "Ask the AI anything",
    description:
      "It answers only from your own records and shows you the verified source for every answer.",
  },
];

const marqueeItems = [
  "Lab results",
  "Prescriptions",
  "Vitals & trends",
  "Doctor visits",
  "Medication reminders",
  "AI answers with sources",
  "Emergency card",
  "Private doctor links",
];

function HealthRing({ percent }: { percent: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg viewBox="0 0 84 84" className="h-20 w-20 sm:h-24 sm:w-24 shrink-0">
      <circle
        cx="42"
        cy="42"
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-slate-200 dark:text-white/10"
        strokeWidth="8"
      />
      <circle
        cx="42"
        cy="42"
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="progress-ring"
        transform="rotate(-90 42 42)"
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <text
        x="42"
        y="39"
        textAnchor="middle"
        className="fill-slate-900 dark:fill-white font-extrabold text-[18px] sm:text-[20px]"
        style={{ fontWeight: 800, fontFamily: "var(--font-display)" }}
      >
        {percent}%
      </text>
      <text
        x="42"
        y="53"
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400 font-bold text-[8px] sm:text-[8.5px]"
        style={{ fontWeight: 700 }}
      >
        ON TRACK
      </text>
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-lg">
      {/* Main dashboard showcase card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="soft-card relative w-full p-4.5 sm:p-6 rounded-2.5xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/95 shadow-xl sm:shadow-2xl backdrop-blur-2xl"
      >
        {/* Top bar with patient greeting */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              Good morning, Naim
            </p>
            <p className="font-display text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Here is your health today
            </p>
          </div>
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </span>
        </div>

        {/* Ring & Vitals */}
        <div className="mt-3.5 flex items-center gap-3.5 sm:gap-5">
          <HealthRing percent={88} />
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <div className="rounded-xl sm:rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3 py-2 sm:px-3.5 sm:py-2.5">
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Fasting glucose
              </p>
              <p className="font-display text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                108 <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">mg/dL</span>
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-sky-50/90 dark:bg-sky-500/15 border border-sky-200/80 dark:border-sky-500/30 px-3 py-2 sm:px-3.5 sm:py-2.5">
              <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Blood pressure
              </p>
              <p className="font-display text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                120/78 <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">mmHg</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actionable Schedule list */}
        <div className="mt-3.5 space-y-2">
          {[
            { icon: Pill, label: "Metformin 500mg", sub: "Taken · 8:00 AM", done: true },
            { icon: FileText, label: "Serum Creatinine Lab", sub: "0.84 mg/dL · Verified normal", done: true },
            { icon: Stethoscope, label: "Prof. Dr. Quazi Salim", sub: "Follow-up visit · CMH Dhaka", done: false },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.05] px-3 py-2 sm:px-3.5 sm:py-2.5 backdrop-blur-md"
            >
              <span
                className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${
                  row.done
                    ? "bg-emerald-50 border-emerald-200/80 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400"
                    : "bg-amber-50 border-amber-200/80 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400"
                }`}
              >
                <row.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">{row.label}</p>
                <p className="text-[9.5px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">{row.sub}</p>
              </div>
              {row.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Integrated AI Answer Card (Responsive for both mobile & desktop) */}
        <div className="mt-3.5 rounded-xl sm:rounded-2xl border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 sm:p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-white shadow-xs">
                <Bot className="h-3 w-3" />
              </span>
              <p className="text-[10px] sm:text-[11px] font-black text-emerald-900 dark:text-emerald-200">Grounded AI Analysis</p>
            </div>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
              Popular Lab · p.1
            </span>
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <Quote className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="text-[10.5px] sm:text-[11.5px] leading-snug font-semibold text-slate-800 dark:text-slate-200">
              “Serum creatinine is 0.84 mg/dL, well within the normal adult reference range (0.70 - 1.20).”
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating badges - visible on sm+ screens to add depth without cluttering mobile */}
      <div className="hidden sm:block">
        {/* Floating: dose logged */}
        <div className="animate-float absolute -right-4 -top-3" style={{ animationDelay: "0.8s" }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="soft-card-lift flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/90 shadow-lg backdrop-blur-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-bold shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Dose logged</p>
              <p className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                Metformin · 8:00 AM
              </p>
            </div>
          </motion.div>
        </div>

        {/* Floating: scan uploaded */}
        <div className="animate-float absolute -left-4 -bottom-3" style={{ animationDelay: "1.8s" }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="soft-card-lift flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/90 shadow-lg backdrop-blur-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400">
              <ScanLine className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Record parsed</p>
              <p className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400">
                12 biomarkers verified
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="mint-wash min-h-screen overflow-x-hidden bg-[var(--background)]">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-20 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl" />
        <div className="animate-blob-slow absolute -right-24 top-1/3 h-72 w-72 sm:h-[28rem] sm:w-[28rem] rounded-full bg-teal-300/15 dark:bg-teal-500/10 blur-3xl" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-emerald-400/10 dark:bg-emerald-600/10 blur-3xl" style={{ animationDelay: "4s" }} />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-[#070d18]/90 backdrop-blur-2xl">
        <div className="relative mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <motion.span
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl overflow-hidden shadow-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-0.5"
            >
              <Image
                src="/logo.png"
                alt="ChronicAI Logo"
                width={30}
                height={30}
                className="object-contain"
                priority
              />
            </motion.span>
            <span className="font-display text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              How it works
            </a>
            <a href="#safety" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              Safety
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer"
              title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle Theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-700" />
              )}
            </button>

            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-bold px-3 text-xs sm:text-sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-3.5 sm:px-5 text-xs sm:text-sm h-8 sm:h-9 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-sm shadow-emerald-500/25" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 lg:gap-14 px-4 pb-14 pt-7 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-2 lg:pt-20">
        <div className="dot-grid absolute inset-0 -z-10 opacity-30 sm:opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_30%_40%,black,transparent)]" />
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3 py-1 text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>Grounded Medical AI & Records Vault</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="mt-3.5 font-display text-3xl font-black leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.3rem]"
          >
            All your health records.{" "}
            <span className="relative inline-block text-emerald-600 dark:text-emerald-400">
              One calm place.
              <svg
                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M2 9C50 3 150 3 198 9"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-4 sm:mt-6 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium sm:text-lg"
          >
            ChronicAI keeps your test results, prescriptions, visits, and daily
            vitals together. Ask questions and get answers that cite the
            exact verified record they came from.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="mt-7 sm:mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <div className="w-full sm:w-auto">
              <Button size="lg" className="h-11 sm:h-12 w-full rounded-full px-7 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-emerald-500/25 sm:w-auto" asChild>
                <Link href="/signup">
                  Create free account
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
            <div className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="h-11 sm:h-12 w-full rounded-full border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white px-7 text-sm sm:text-base font-semibold backdrop-blur-md shadow-xs sm:w-auto"
                asChild
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
          </motion.div>

          {/* Trust Badges - Clean responsive grid on mobile, inline on desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-6 sm:mt-8 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Encrypted vault</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3 py-1.5">
              <ScanLine className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Grounded citations</span>
            </span>
            <span className="col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 px-3 py-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Patient privacy</span>
            </span>
          </motion.div>
        </div>

        {/* Hero Interactive Preview */}
        <div className="w-full pt-2 sm:pt-0">
          <DashboardPreview />
        </div>
      </section>

      {/* Marquee with smooth edge gradient fade */}
      <section className="relative border-y border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#070d18]/80 py-3 sm:py-4 backdrop-blur-xl [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-6 sm:gap-8 pr-6 sm:pr-8">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-6 sm:gap-8 whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            What you get
          </span>
          <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything your health produces,{" "}
            <span className="text-emerald-600 dark:text-emerald-400">in one app</span>
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-medium sm:text-base">
            No more digging through folders of PDFs. No more guessing what your
            last test said.
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          className="mt-10 sm:mt-12 grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              {...fadeUpChild}
              className="soft-card group relative overflow-hidden p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-white/[0.05] backdrop-blur-xl shadow-xs hover:shadow-md transition-all"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative mb-3.5 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/25">
                <feature.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </span>
              <h3 className="relative font-display text-base font-extrabold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="relative mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="relative border-y border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#070d18]/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              How it works
            </span>
            <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Three steps, then it runs itself
            </h2>
          </motion.div>

          <motion.div
            {...stagger}
            className="relative mt-10 sm:mt-14 grid gap-6 md:grid-cols-3 md:gap-8"
          >
            <div className="absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-emerald-300/60 dark:border-emerald-500/20 md:block" />
            {steps.map((item, idx) => (
              <motion.div
                key={item.step}
                {...fadeUpChild}
                className="relative flex md:block items-start gap-4 text-left p-4 sm:p-5 md:p-0 rounded-2xl border md:border-none border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] md:bg-transparent"
              >
                <span className="relative z-10 flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-white/10 bg-white dark:bg-[#0c1527] font-display text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 shadow-sm md:shadow-md">
                  {item.step}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="md:mt-5 font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div
          {...fadeUp}
          className="forest-surface relative overflow-hidden rounded-2.5xl sm:rounded-[2rem] px-5 py-9 sm:px-12 sm:py-14"
        >
          <div className="dot-grid-light absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <span className="inline-flex rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
                Security & Privacy First
              </span>
              <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-white sm:text-4xl">
                Built so you stay in charge
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-300 font-medium">
                Health data is sensitive. ChronicAI is designed around that —
                you decide what gets stored, what the AI can see, and who gets
                access.
              </p>
              <ul className="mt-5 space-y-2.5 sm:space-y-3.5">
                {[
                  "AI only answers from your own records, with citations",
                  "Red-flag symptoms get an emergency warning, not a chat reply",
                  "You review every extracted value before it is saved",
                  "Doctor links expire automatically — no permanent access",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {[
                { icon: FolderLock, title: "Encrypted vault", text: "Files stored encrypted, readable only by you." },
                { icon: ShieldCheck, title: "Row-level security", text: "Database rules make sure users only see their own data." },
                { icon: Bot, title: "Cited answers", text: "Every AI answer links back to the document it used." },
                { icon: Bell, title: "Emergency alerts", text: "Danger signs are flagged before anything else." },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-md"
                >
                  <card.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-400" />
                  <p className="mt-2.5 text-xs sm:text-sm font-bold text-white">{card.title}</p>
                  <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-slate-300">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:pb-24 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2.5xl sm:rounded-[2rem] border border-emerald-200/80 dark:border-white/10 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-[#0c192c] dark:via-[#091122] dark:to-[#061520] px-5 py-11 sm:px-12 sm:py-16 text-center shadow-sm backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-300/30 dark:bg-emerald-500/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Stop digging through folders of health papers.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-xs sm:text-base text-slate-600 dark:text-slate-300 font-medium">
              Create your account and add your first record in a few minutes.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <div className="w-full sm:w-auto">
                <Button size="lg" className="h-11 sm:h-12 w-full rounded-full px-8 sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-emerald-500/25 text-sm sm:text-base" asChild>
                  <Link href="/signup">
                    Get started free
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 sm:h-12 w-full rounded-full border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white px-8 sm:w-auto font-semibold backdrop-blur-md text-sm sm:text-base"
                  asChild
                >
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#070d18]/80 py-8 sm:py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center sm:text-left text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="relative flex h-6 w-6 items-center justify-center rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-0.5 shrink-0">
              <Image
                src="/logo.png"
                alt="ChronicAI"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="font-display font-extrabold text-slate-900 dark:text-white">
              Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
            </span>
            <span className="hidden sm:inline">· All your health records, one calm place.</span>
          </div>
          <p className="font-medium">Not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
