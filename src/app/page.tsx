import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  FolderLock,
  HeartPulse,
  History,
  Pill,
  ScanLine,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderLock,
    title: "Personal Medical Vault",
    description:
      "Store prescriptions, lab panels, imaging, and discharge summaries in one encrypted vault with AI extraction and human review.",
  },
  {
    icon: History,
    title: "Lifelong Timeline",
    description:
      "Every visit, diagnosis, medication change, and result woven into one searchable medical trajectory.",
  },
  {
    icon: Pill,
    title: "Medication Intelligence",
    description:
      "Daily schedules, refill reminders, and adherence tracking that actually fits your routine.",
  },
  {
    icon: Bot,
    title: "Grounded AI Assistant",
    description:
      "Ask questions about your records and get answers with mandatory document citations — never guesswork.",
  },
  {
    icon: HeartPulse,
    title: "Chronic Care Modules",
    description:
      "Specialized tracking for diabetes, blood pressure, and more — glucose logs, HbA1c trends, and alerts.",
  },
  {
    icon: Share2,
    title: "Doctor-Ready Sharing",
    description:
      "One-tap clinical summaries and time-limited encrypted links for your next appointment.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload your records",
    description:
      "Snap a photo or drop a PDF. Our pipeline extracts the data and you verify it — you stay in control.",
  },
  {
    step: "02",
    title: "See the whole picture",
    description:
      "Vitals, medications, labs, and history organize themselves into a living timeline of your health.",
  },
  {
    step: "03",
    title: "Ask anything, safely",
    description:
      "The AI assistant answers only from your records, cites its sources, and flags emergencies.",
  },
];

export default function LandingPage() {
  return (
    <div className="mint-wash min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25">
              <Activity className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Chronic<span className="text-emerald-600">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--muted-foreground)] md:flex">
            <a href="#features" className="transition-colors hover:text-[var(--foreground)]">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--foreground)]">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Personal Medical Intelligence
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Your entire medical life.{" "}
            <span className="gradient-text">One intelligent platform.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Store your complete health history, understand every record, track
            medications and vitals, and get AI answers grounded in your own
            documents — with citations you can trust.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/signup">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">Explore the demo</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Encrypted at rest
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanLine className="h-3.5 w-3.5 text-emerald-600" />
              Citation-grounded AI
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
              You control your data
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your health generates,{" "}
            <span className="text-emerald-600">finally in one place</span>
          </h2>
          <p className="mt-4 text-[var(--muted-foreground)]">
            A calm, structured home for decades of medical history — designed
            for patients, not paperwork.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="soft-card hover-lift group p-6"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-base font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-[var(--border)]/60 bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="font-display text-4xl font-bold text-emerald-200">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="forest-surface relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your health story deserves better than a folder of PDFs.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-300">
              Create your account and bring your first record in under five
              minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:w-auto"
                asChild
              >
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-[var(--muted-foreground)] sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span className="font-display font-bold text-[var(--foreground)]">
              Chronic<span className="text-emerald-600">AI</span>
            </span>
            <span>· Your entire medical life, one intelligent platform.</span>
          </div>
          <p>Not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
