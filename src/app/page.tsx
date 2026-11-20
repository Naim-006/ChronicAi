"use client";

import Link from "next/link";
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
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.09 } },
  viewport: { once: true, margin: "-60px" },
};

const fadeUpChild = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
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
      "Tests, medicines, visits, and vitals line up on one timeline you can search.",
  },
  {
    step: "3",
    title: "Ask the AI anything",
    description:
      "It answers only from your own records and shows you the source for every answer.",
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
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg viewBox="0 0 84 84" className="h-24 w-24">
      <circle
        cx="42"
        cy="42"
        r={radius}
        fill="none"
        stroke="currentColor"
        className="text-slate-200 dark:text-white/10"
        strokeWidth="9"
      />
      <circle
        cx="42"
        cy="42"
        r={radius}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="9"
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
        y="40"
        textAnchor="middle"
        className="fill-slate-900 dark:fill-white font-extrabold"
        style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)" }}
      >
        {percent}%
      </text>
      <text
        x="42"
        y="54"
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400 font-bold"
        style={{ fontSize: 8.5, fontWeight: 700 }}
      >
        ON TRACK
      </text>
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-md sm:h-[500px]">
      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="soft-card absolute left-1/2 top-6 w-[86%] -translate-x-1/2 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0c1527]/90 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Good morning, Alex
            </p>
            <p className="font-display text-lg font-black text-slate-900 dark:text-white">Here is your health today</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <Activity className="h-4.5 w-4.5" />
          </span>
        </div>

        <div className="mt-4 flex items-center gap-5">
          <HealthRing percent={88} />
          <div className="flex-1 space-y-2.5">
            <div className="rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Fasting glucose
              </p>
              <p className="font-display text-lg font-black text-slate-900 dark:text-white">
                118 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">mg/dL</span>
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50/90 dark:bg-sky-500/15 border border-sky-200/80 dark:border-sky-500/30 px-3.5 py-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                Blood pressure
              </p>
              <p className="font-display text-lg font-black text-slate-900 dark:text-white">
                122/78 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">mmHg</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { icon: Pill, label: "Metformin 500mg", sub: "Taken · 8:00 AM", done: true },
            { icon: FileText, label: "HbA1c lab result", sub: "6.8% · reviewed", done: true },
            { icon: Stethoscope, label: "Dr. Chen visit", sub: "Tomorrow · 10:30 AM", done: false },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.05] px-3.5 py-2.5 backdrop-blur-md"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                  row.done
                    ? "bg-emerald-50 border-emerald-200/80 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400"
                    : "bg-amber-50 border-amber-200/80 text-amber-600 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400"
                }`}
              >
                <row.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{row.label}</p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{row.sub}</p>
              </div>
              {row.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Bell className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating: medication taken */}
      <div className="animate-float absolute -right-1 top-0 sm:right-0" style={{ animationDelay: "0.8s" }}>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="soft-card-lift flex items-center gap-3 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/90 shadow-xl backdrop-blur-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-bold shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Dose logged</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Metformin · 8:00 AM
            </p>
          </div>
        </motion.div>
      </div>

      {/* Floating: AI answer with citation */}
      <div className="animate-float-soft absolute -left-2 bottom-16 sm:left-0" style={{ animationDelay: "1.6s" }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="soft-card-lift w-52 rounded-2xl p-4 sm:w-60 border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/90 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
              <Bot className="h-4 w-4" />
            </span>
            <p className="text-[11px] font-black text-slate-900 dark:text-white">AI answer</p>
          </div>
          <div className="mt-2 flex gap-1.5">
            <Quote className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
            <p className="text-[11px] leading-snug font-semibold text-slate-700 dark:text-slate-200">
              “Your HbA1c is 6.8%, down from 7.4% in November.”
            </p>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200/80 dark:border-emerald-500/30 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">
              Lab PDF · p.2
            </span>
            <span className="rounded-full bg-sky-50 dark:bg-sky-500/20 border border-sky-200/80 dark:border-sky-500/30 px-2 py-0.5 text-[9px] font-extrabold text-sky-700 dark:text-sky-300">
              Timeline
            </span>
          </div>
        </motion.div>
      </div>

      {/* Floating: scan uploaded */}
      <div className="animate-float absolute bottom-2 right-6" style={{ animationDelay: "2.3s" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="soft-card-lift flex items-center gap-3 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1527]/90 shadow-xl backdrop-blur-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400">
            <ScanLine className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Record scanned</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              12 fields extracted · verified
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="mint-wash min-h-screen overflow-x-hidden bg-[var(--background)]">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-24 h-96 w-96 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl" />
        <div className="animate-blob-slow absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-teal-300/15 dark:bg-teal-500/10 blur-3xl" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 dark:bg-emerald-600/10 blur-3xl" style={{ animationDelay: "4s" }} />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#070d18]/85 backdrop-blur-2xl">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.span
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25"
            >
              <Activity className="h-5 w-5" />
            </motion.span>
            <span className="font-display text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
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

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer"
              title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle Theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            <Button variant="ghost" size="sm" className="text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-bold" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-emerald-500/25" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div className="dot-grid absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_30%_40%,black,transparent)]" />
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-2 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.4rem]"
          >
            All your health records.{" "}
            <span className="relative inline-block text-emerald-600 dark:text-emerald-400">
              One calm place.
              <svg
                className="absolute -bottom-2 left-0 w-full"
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
                  transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300 font-medium sm:text-lg"
          >
            ChronicAI keeps your test results, prescriptions, visits, and daily
            vitals together. Ask questions and get answers that point to the
            exact record they came from.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="h-12 w-full rounded-full px-8 text-base bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-emerald-500/25 sm:w-auto" asChild>
                <Link href="/signup">
                  Create free account
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white px-8 text-base font-semibold backdrop-blur-md shadow-sm sm:w-auto"
                asChild
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Encrypted storage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              AI answers show their sources
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              You control who sees your data
            </span>
          </motion.div>
        </div>

        <DashboardPreview />
      </section>

      {/* Marquee */}
      <section className="relative border-y border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#070d18]/80 py-4 backdrop-blur-xl">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-8 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            What you get
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything your health produces,{" "}
            <span className="text-emerald-600 dark:text-emerald-400">in one app</span>
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
            No more digging through folders of PDFs. No more guessing what your
            last test said.
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              {...fadeUpChild}
              whileHover={{ y: -6 }}
              className="soft-card hover-lift group relative overflow-hidden p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] backdrop-blur-xl shadow-sm"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-50 dark:bg-emerald-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/25">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="relative font-display text-base font-extrabold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative border-y border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#070d18]/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/80 dark:border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              How it works
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Three steps, then it runs itself
            </h2>
          </motion.div>

          <motion.div
            {...stagger}
            className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8"
          >
            <div className="absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-emerald-300/60 dark:border-emerald-500/20 md:block" />
            {steps.map((item) => (
              <motion.div
                key={item.step}
                {...fadeUpChild}
                className="relative text-center md:text-left"
              >
                <span className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 dark:border-white/10 bg-white dark:bg-[#0c1527] font-display text-xl font-black text-emerald-600 dark:text-emerald-400 shadow-md md:mx-0">
                  {item.step}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium md:mx-0">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...fadeUp}
          className="forest-surface relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12"
        >
          <div className="dot-grid-light absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Built so you stay in charge
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
                Health data is sensitive. ChronicAI is designed around that —
                you decide what gets stored, what the AI can see, and who gets
                access.
              </p>
              <ul className="mt-7 space-y-3.5">
                {[
                  "AI only answers from your own records, with citations",
                  "Red-flag symptoms get an emergency warning, not a chat reply",
                  "You review every extracted value before it is saved",
                  "Doctor links expire automatically — no permanent access",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: FolderLock, title: "Encrypted vault", text: "Files stored encrypted, readable only by you." },
                { icon: ShieldCheck, title: "Row-level security", text: "Database rules make sure users only see their own data." },
                { icon: Bot, title: "Cited answers", text: "Every AI answer links back to the document it used." },
                { icon: Bell, title: "Emergency alerts", text: "Danger signs are flagged before anything else." },
              ].map((card) => (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <card.icon className="h-5 w-5 text-emerald-400" />
                  <p className="mt-3 text-sm font-bold text-white">{card.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{card.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[2rem] border border-emerald-200/80 dark:border-white/10 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-[#0c192c] dark:via-[#091122] dark:to-[#061520] px-6 py-16 text-center sm:px-12 shadow-sm backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-emerald-300/30 dark:bg-emerald-500/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Stop digging through folders of health papers.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600 dark:text-slate-300 font-medium">
              Create your account and add your first record in a few minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="h-12 w-full rounded-full px-8 sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-emerald-500/25" asChild>
                  <Link href="/signup">
                    Get started free
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </motion.div>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full border border-slate-200/80 dark:border-white/15 bg-white/80 dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.15] text-slate-800 dark:text-white px-8 sm:w-auto font-semibold backdrop-blur-md"
                asChild
              >
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#070d18]/80 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-display font-extrabold text-slate-900 dark:text-white">
              Chronic<span className="text-emerald-500 dark:text-emerald-400">AI</span>
            </span>
            <span>· All your health records, one calm place.</span>
          </div>
          <p className="font-medium">Not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
