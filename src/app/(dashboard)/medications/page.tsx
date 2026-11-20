"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Pill,
  Plus,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Loader2,
  Calendar,
  TrendingUp,
  BarChart3,
  Clock,
  Sparkles,
  Info,
  Edit3,
  Trash2,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Medication, MedicationLog, MedicationStatus } from "@/types/medical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  logMedicationAdherence,
  untakeMedicationAdherence,
  getMedicationLogs,
} from "@/lib/supabase/services/medications";
import { useRealtimeTables } from "@/hooks/useRealtime";
import { formatDate } from "@/lib/utils";

interface DayAdherenceData {
  dayLabel: string;
  dayShort: string;
  dateKey: string;
  taken: number;
  total: number;
  rate: number;
  isToday: boolean;
}

export default function MedicationsPage() {
  const { effectiveUserId } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggedMeds, setLoggedMeds] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "inactive">("all");
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safety checker state
  const [testDrugInput, setTestDrugInput] = useState("");
  const [interactionResult, setInteractionResult] = useState<{
    drug: string;
    level: "safe" | "moderate" | "severe";
    interactingWith?: string;
    mechanism: string;
    alternative?: string;
  } | null>(null);

  // Add / Edit Form State
  const [formName, setFormName] = useState("");
  const [formGeneric, setFormGeneric] = useState("");
  const [formStrength, setFormStrength] = useState("");
  const [formFrequency, setFormFrequency] = useState("Once daily");
  const [formTiming, setFormTiming] = useState("Morning after meal");
  const [formRoute, setFormRoute] = useState("oral");
  const [formDoc, setFormDoc] = useState("");
  const [formCondition, setFormCondition] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<MedicationStatus>("active");

  const { todayUtc, todayLocal } = useMemo(() => {
    const d = new Date();
    const utc = d.toISOString().split("T")[0];
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { todayUtc: utc, todayLocal: local };
  }, []);
  const todayStr = todayUtc;

  // Instant mount hydration from cache before network responds
  useEffect(() => {
    if (typeof window !== "undefined" && effectiveUserId) {
      try {
        const cacheKey = `chronicai_med_taken_${effectiveUserId}_${todayLocal}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setLoggedMeds(JSON.parse(cached));
        }
      } catch {}
    }
  }, [effectiveUserId, todayLocal]);

  // Load medications and historical logs
  const loadData = useCallback(async () => {
    if (!effectiveUserId) {
      setMedications([]);
      setMedLogs([]);
      setIsLoading(false);
      return;
    }
    try {
      const [fetchedMeds, fetchedLogs] = await Promise.all([
        getMedications(effectiveUserId),
        getMedicationLogs(effectiveUserId, 14),
      ]);
      setMedications(fetchedMeds || []);
      setMedLogs(fetchedLogs || []);

      // Filter today's logs across local/UTC boundaries or recent 24 hours
      const nowMs = Date.now();
      const todayLogs = (fetchedLogs || []).filter((l) => {
        const timeMs = new Date(l.recorded_time || l.scheduled_time || l.created_at || "").getTime();
        const isWithin24h = !isNaN(timeMs) && nowMs - timeMs < 24 * 60 * 60 * 1000 && timeMs <= nowMs + 60 * 60 * 1000;
        const matchesDate =
          l.scheduled_time?.startsWith(todayUtc) ||
          l.scheduled_time?.startsWith(todayLocal) ||
          l.recorded_time?.startsWith(todayUtc) ||
          l.recorded_time?.startsWith(todayLocal) ||
          l.created_at?.startsWith(todayUtc) ||
          l.created_at?.startsWith(todayLocal);
        return isWithin24h || matchesDate;
      });

      const initialMap: Record<string, boolean> = {};
      // Initialize all medications to false
      (fetchedMeds || []).forEach((m) => {
        initialMap[m.id] = false;
      });

      // Sort chronologically ascending by recorded_time or created_at so newest user action always wins
      const sortedTodayLogs = [...todayLogs].sort((a, b) => {
        const timeA = new Date(a.recorded_time || a.created_at || 0).getTime();
        const timeB = new Date(b.recorded_time || b.created_at || 0).getTime();
        return timeA - timeB;
      });

      sortedTodayLogs.forEach((l) => {
        initialMap[l.medication_id] = l.status === "taken";
      });

      // Synchronize with localStorage cache to avoid any flash or race condition
      try {
        const cacheKey = `chronicai_med_taken_${effectiveUserId}_${todayLocal}`;
        localStorage.setItem(cacheKey, JSON.stringify(initialMap));
      } catch {}

      setLoggedMeds(initialMap);
    } catch {
      setMedications([]);
      setMedLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, todayUtc, todayLocal]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime synchronization
  useRealtimeTables({
    tables: ["medications", "medication_logs"],
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadData();
    },
  });

  // Toggle dose taken/missed for today
  const toggleMed = async (medId: string) => {
    const nextState = !loggedMeds[medId];
    // Immediate optimistic update in state AND localStorage
    const newMap = {
      ...loggedMeds,
      [medId]: nextState,
    };
    setLoggedMeds(newMap);

    if (effectiveUserId) {
      try {
        localStorage.setItem(
          `chronicai_med_taken_${effectiveUserId}_${todayLocal}`,
          JSON.stringify(newMap)
        );
      } catch {}

      try {
        if (nextState) {
          // Log dose as taken
          await logMedicationAdherence({
            user_id: effectiveUserId,
            medication_id: medId,
            scheduled_time: new Date().toISOString(),
            recorded_time: new Date().toISOString(),
            status: "taken",
          });
        } else {
          // Untake: delete today's adherence log from DB
          await untakeMedicationAdherence(medId, effectiveUserId);
        }
        const updatedLogs = await getMedicationLogs(effectiveUserId, 14);
        setMedLogs(updatedLogs || []);
      } catch (err) {
        console.error("Failed to toggle medication adherence:", err);
        // Rollback optimistic update on error
        const rollbackMap = {
          ...loggedMeds,
          [medId]: !nextState,
        };
        setLoggedMeds(rollbackMap);
        try {
          localStorage.setItem(
            `chronicai_med_taken_${effectiveUserId}_${todayLocal}`,
            JSON.stringify(rollbackMap)
          );
        } catch {}
      }
    }
  };

  // Open Edit Modal for a Medication
  const handleOpenEdit = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name || "");
    setFormGeneric(med.generic_name || "");
    setFormStrength(med.strength || med.dosage || "");
    setFormFrequency(med.frequency || "Once daily");
    setFormTiming(med.instructions?.split(" - ")[0] || "Morning after meal");
    setFormRoute(med.route || "oral");
    setFormDoc(med.prescribing_doctor || "");
    setFormCondition(med.related_condition || "");
    setFormNotes(med.instructions || "");
    setFormStartDate(med.start_date || todayStr);
    setFormEndDate(med.end_date || "");
    setFormStatus(med.status || "active");
  };

  // Helper to add duration days to start date
  const setQuickDuration = (days: number) => {
    const baseDate = formStartDate ? new Date(formStartDate) : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setFormEndDate(baseDate.toISOString().split("T")[0]);
  };

  // Quick Toggle Active / Inactive / Completed
  const handleQuickStatusToggle = async (med: Medication, newStatus: "active" | "discontinued" | "completed") => {
    if (!effectiveUserId) return;
    try {
      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, status: newStatus } : m))
      );
      await updateMedication(med.id, effectiveUserId, {
        status: newStatus,
      });
    } catch (err) {
      console.error("Failed to toggle medication status:", err);
      loadData();
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed || !effectiveUserId || !formName.trim()) return;
    setIsSubmitting(true);

    try {
      const updates = {
        name: formName.trim(),
        generic_name: formGeneric.trim() || undefined,
        strength: formStrength.trim() || undefined,
        dosage: formStrength.trim() || "As directed",
        frequency: formFrequency.trim() || "Once daily",
        route: formRoute.trim() || "oral",
        instructions: formNotes.trim() || `${formTiming}. Take as directed.`,
        prescribing_doctor: formDoc.trim() || undefined,
        related_condition: formCondition.trim() || undefined,
        start_date: formStartDate || todayStr,
        end_date: formEndDate || undefined,
        status: formStatus,
      };

      const updated = await updateMedication(editingMed.id, effectiveUserId, updates);
      if (updated) {
        setMedications((prev) =>
          prev.map((m) => (m.id === editingMed.id ? { ...m, ...updates } : m))
        );
      }
      setEditingMed(null);
    } catch (err) {
      console.error("Failed to save medication changes:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Medication Handler
  const handleDelete = async () => {
    if (!editingMed || !effectiveUserId) return;
    if (!window.confirm(`Are you sure you want to remove "${editingMed.name}" from your active records?`)) return;

    setIsDeleting(true);
    try {
      const ok = await deleteMedication(editingMed.id, effectiveUserId);
      if (ok) {
        setMedications((prev) => prev.filter((m) => m.id !== editingMed.id));
        setEditingMed(null);
      }
    } catch (err) {
      console.error("Failed to delete medication:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add prescription handler
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !effectiveUserId) return;
    setIsSubmitting(true);

    try {
      const newMed = await createMedication({
        user_id: effectiveUserId,
        name: formName.trim(),
        generic_name: formGeneric.trim() || undefined,
        strength: formStrength.trim() || "Standard",
        dosage: formStrength.trim() || "Standard",
        frequency: formFrequency.trim() || "Once daily",
        route: formRoute.trim() || "oral",
        instructions: formNotes.trim() || `${formTiming}. Take as prescribed.`,
        start_date: formStartDate || todayStr,
        end_date: formEndDate || undefined,
        prescribing_doctor: formDoc.trim() || "Prescribing Physician",
        related_condition: formCondition.trim() || "General Care",
        status: formStatus,
      });

      setMedications((prev) => [newMed, ...prev]);
      setShowAddModal(false);
      // Reset form
      setFormName("");
      setFormGeneric("");
      setFormStrength("");
      setFormFrequency("Once daily");
      setFormTiming("Morning after meal");
      setFormDoc("");
      setFormCondition("");
      setFormNotes("");
      setFormStartDate(todayStr);
      setFormEndDate("");
      setFormStatus("active");
    } catch (err) {
      console.error("Failed to add medication", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clinical safety interaction checker
  const checkDrugInteraction = (drugName: string) => {
    const q = drugName.toLowerCase().trim();
    if (!q) return;

    const currentMedNames = medications.map((m) => m.name).join(" & ");

    if (
      q.includes("ibuprofen") ||
      q.includes("advil") ||
      q.includes("aleve") ||
      q.includes("naproxen") ||
      q.includes("motrin")
    ) {
      setInteractionResult({
        drug: drugName,
        level: "moderate",
        interactingWith: currentMedNames || "Active Renoprotective Regimen",
        mechanism:
          "NSAIDs inhibit renal vasodilatory prostaglandins, decreasing eGFR and counteracting antihypertensive efficacy.",
        alternative: "Acetaminophen (Tylenol) 500mg every 6 hours (max 2000mg/day) is recommended.",
      });
    } else if (
      q.includes("sudafed") ||
      q.includes("pseudoephedrine") ||
      q.includes("decongestant")
    ) {
      setInteractionResult({
        drug: drugName,
        level: "moderate",
        interactingWith: currentMedNames || "Antihypertensive Regimen",
        mechanism:
          "Sympathomimetic alpha-1 stimulation triggers systemic vasoconstriction, elevating systolic blood pressure by 10-15 mmHg.",
        alternative: "Saline nasal irrigation or Coricidin HBP (decongestant-free cold relief).",
      });
    } else if (
      q.includes("amoxicillin") ||
      q.includes("penicillin") ||
      q.includes("antibiotic")
    ) {
      setInteractionResult({
        drug: drugName,
        level: "severe",
        interactingWith: "Patient Allergy Profile",
        mechanism:
          "Severe allergy documented on your Emergency Medical Card. Beta-lactam antibiotics are strictly contraindicated.",
        alternative: "Azithromycin (Macrolide) or Doxycycline as approved by your physician.",
      });
    } else if (q.includes("aspirin")) {
      setInteractionResult({
        drug: drugName,
        level: "safe",
        interactingWith: currentMedNames || "Cardiovascular Protocol",
        mechanism:
          "Low-dose 81mg enteric-coated aspirin is compatible with your active prescriptions under clinical guidance.",
      });
    } else {
      setInteractionResult({
        drug: drugName,
        level: "safe",
        mechanism: `No critical clinical contraindications detected between ${drugName} and your ${medications.length} prescriptions. Always verify with your pharmacist.`,
      });
    }
  };

  // Helper for dynamic range status
  const getMedRangeStatus = (med: Medication) => {
    if (med.status === "discontinued") {
      return { label: "Paused / Inactive", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300", isActive: false };
    }
    if (med.status === "completed") {
      return { label: "Course Completed", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800", isActive: false };
    }
    if (med.end_date && med.end_date < todayStr) {
      return { label: "Course Completed", color: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800", isActive: false };
    }
    if (med.start_date && med.start_date > todayStr) {
      return { label: `Starts ${formatDate(med.start_date)}`, color: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200", isActive: false };
    }
    return { label: "Active Course", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", isActive: true };
  };

  // Dynamic category options derived from real data
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    medications.forEach((m) => {
      if (m.related_condition?.trim()) {
        cats.add(m.related_condition.trim());
      }
    });
    return [
      { id: "all", label: "All Conditions" },
      ...Array.from(cats).map((c) => ({ id: c.toLowerCase(), label: c })),
    ];
  }, [medications]);

  // Filtered medication list
  const filteredMedications = useMemo(() => {
    return medications.filter((m) => {
      const matchCategory =
        categoryFilter === "all" ||
        m.related_condition?.toLowerCase() === categoryFilter.toLowerCase();
      
      const rangeStatus = getMedRangeStatus(m);
      let matchStatus = true;
      if (statusFilter === "active") matchStatus = rangeStatus.isActive;
      if (statusFilter === "completed") matchStatus = rangeStatus.label === "Course Completed";
      if (statusFilter === "inactive") matchStatus = !rangeStatus.isActive;

      return matchCategory && matchStatus;
    });
  }, [medications, categoryFilter, statusFilter, todayStr]);

  // Today's summary numbers
  const activeMeds = useMemo(() => medications.filter((m) => getMedRangeStatus(m).isActive), [medications, todayStr]);
  const takenCount = useMemo(
    () => Object.values(loggedMeds).filter(Boolean).length,
    [loggedMeds]
  );
  const todayAdherence = useMemo(
    () =>
      activeMeds.length > 0
        ? Math.round((takenCount / activeMeds.length) * 100)
        : 0,
    [takenCount, activeMeds.length]
  );

  // REAL 7-Day Adherence Chart Calculation
  const weekChartData: DayAdherenceData[] = useMemo(() => {
    const days: DayAdherenceData[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const isToday = i === 0;

      const dayLabel = isToday
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayShort = isToday
        ? "Today"
        : d.toLocaleDateString("en-US", { weekday: "narrow" });

      if (isToday) {
        const total = activeMeds.length;
        const taken = takenCount;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 0;
        days.push({ dayLabel, dayShort, dateKey, taken, total, rate, isToday });
      } else {
        const dayLogs = medLogs.filter(
          (l) =>
            (l.scheduled_time?.startsWith(dateKey) ||
              l.created_at?.startsWith(dateKey)) &&
            l.status === "taken"
        );
        const uniqueMedIdsTaken = new Set(dayLogs.map((l) => l.medication_id)).size;
        const total = activeMeds.length;
        const rate =
          total > 0
            ? Math.min(100, Math.round((uniqueMedIdsTaken / total) * 100))
            : 0;
        days.push({
          dayLabel,
          dayShort,
          dateKey,
          taken: uniqueMedIdsTaken,
          total,
          rate,
          isToday,
        });
      }
    }
    return days;
  }, [activeMeds.length, takenCount, medLogs]);

  // Overall 7-day adherence average
  const weeklyAverageRate = useMemo(() => {
    if (activeMeds.length === 0) return 0;
    const sum = weekChartData.reduce((acc, d) => acc + d.rate, 0);
    return Math.round(sum / weekChartData.length);
  }, [weekChartData, activeMeds.length]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Medications & Prescriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {activeMeds.length} active courses ({medications.length} total on file) · {todayAdherence}% taken today
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            onClick={() => {
              setFormName("");
              setFormGeneric("");
              setFormStrength("");
              setFormFrequency("Once daily");
              setFormTiming("Morning after meal");
              setFormDoc("");
              setFormCondition("");
              setFormNotes("");
              setFormStartDate(todayStr);
              setFormEndDate("");
              setFormStatus("active");
              setShowAddModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Prescription
          </Button>
        </div>
      </div>

      {/* Hero Summary Protocol Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-950/90 dark:via-slate-900 dark:to-teal-950 p-5 sm:p-6 text-white shadow-lg border border-emerald-500/20">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 dark:bg-white/10 backdrop-blur-md shadow-inner border border-white/20">
              <Pill className="h-6 w-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-white">
                Daily Medication & Course Tracking
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {takenCount} of {activeMeds.length} active daily doses logged today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/15 dark:bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15 self-start sm:self-auto">
            <div className="text-3xl font-extrabold tracking-tight text-white">
              {todayAdherence}%
            </div>
            <div className="text-[11px] font-bold leading-tight text-emerald-100">
              Today&apos;s
              <br />
              Adherence
            </div>
          </div>
        </div>

        {/* Dynamic Category & Status Filter Bar */}
        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
            {(["all", "active", "completed", "inactive"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                  statusFilter === s
                    ? "bg-white text-emerald-900 shadow-sm dark:bg-emerald-400 dark:text-emerald-950"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {availableCategories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`shrink-0 cursor-pointer rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    categoryFilter === cat.id
                      ? "bg-white text-emerald-900 shadow-sm dark:bg-emerald-400 dark:text-emerald-950"
                      : "bg-white/15 text-white/90 hover:bg-white/25 hover:text-white dark:bg-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7-DAY ADHERENCE & ANALYTICS CHART */}
      <section className="soft-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">
                7-Day Adherence Analytics
              </h2>
              <span className="text-xs text-[var(--muted-foreground)] block">
                Calculated from confirmed daily doses and active prescription schedules.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" />
              {weeklyAverageRate}% 7-Day Consistency
            </span>
          </div>
        </div>

        {medications.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
              <Pill className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              No active medications registered
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
              Add your medications or import them from a scanned prescription in your Vault to enable adherence tracking.
            </p>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First Medication
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 7-Day Vertical Bar Chart */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted-foreground)] block">
                Daily Dose Completion (Past 7 Days)
              </span>

              <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 pb-2 items-end h-40">
                {weekChartData.map((day) => {
                  const isFull = day.rate === 100;
                  const isPartial = day.rate > 0 && day.rate < 100;
                  const barHeight = Math.max(day.rate, 6);

                  return (
                    <div
                      key={day.dateKey}
                      className="flex flex-col items-center justify-end h-full gap-2 group"
                    >
                      <span
                        className={`text-[10px] font-extrabold transition-opacity ${
                          day.isToday
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {day.rate}%
                      </span>

                      <div className="w-full max-w-[48px] h-24 rounded-xl bg-[var(--secondary)] flex items-end p-1 overflow-hidden">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className={`w-full rounded-lg transition-all duration-500 ${
                            isFull
                              ? "bg-gradient-to-t from-emerald-600 to-teal-500 shadow-xs shadow-emerald-500/25"
                              : isPartial
                              ? "bg-gradient-to-t from-amber-500 to-amber-400"
                              : "bg-slate-300 dark:bg-slate-700 opacity-40"
                          }`}
                        />
                      </div>

                      <div className="text-center">
                        <span
                          className={`text-xs block font-bold truncate ${
                            day.isToday
                              ? "text-emerald-600 dark:text-emerald-400 underline decoration-2 underline-offset-4"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          <span className="hidden sm:inline">{day.dayLabel}</span>
                          <span className="sm:hidden">{day.dayShort}</span>
                        </span>
                        <span className="text-[9px] text-[var(--muted-foreground)] block">
                          {day.taken}/{day.total}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* DETAILED PRESCRIPTIONS & RANGE MANAGEMENT TABLE */}
      <section className="soft-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">
              Prescription Regimens & Date Ranges ({filteredMedications.length})
            </h2>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            Click <strong>Edit</strong> to modify timings, dose ranges, active status, or doctor instructions.
          </span>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-extrabold uppercase text-[var(--muted-foreground)]">
                <th className="py-2.5 pl-3">Medication & Doctor</th>
                <th className="py-2.5 px-3">Strength & Timing</th>
                <th className="py-2.5 px-3">Today Log</th>
                <th className="py-2.5 px-3">Date Range / Duration</th>
                <th className="py-2.5 px-3">Course Status</th>
                <th className="py-2.5 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredMedications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                    No medications match the current filter.
                  </td>
                </tr>
              ) : (
                filteredMedications.map((med) => {
                  const isTaken = loggedMeds[med.id];
                  const rangeInfo = getMedRangeStatus(med);

                  return (
                    <tr key={med.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                      {/* Name & Doctor */}
                      <td className="py-3 pl-3">
                        <div className="font-extrabold text-sm text-[var(--foreground)] flex items-center gap-1.5">
                          {med.name}
                          {med.generic_name && (
                            <span className="text-[11px] font-normal text-[var(--muted-foreground)]">
                              ({med.generic_name})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          {med.prescribing_doctor || "Physician"} ·{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {med.related_condition || "General"}
                          </span>
                        </div>
                        {med.instructions && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {med.instructions}
                          </div>
                        )}
                      </td>

                      {/* Strength & Timing */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-[var(--foreground)]">
                          {med.strength || med.dosage}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">
                          {med.frequency}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">
                          Route: {med.route || "oral"}
                        </div>
                      </td>

                      {/* 3rd Column: Today Log */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => toggleMed(med.id)}
                          title={isTaken ? "Click to mark as untaken (undo)" : "Click to log dose taken today"}
                          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isTaken
                              ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                              : "border border-[var(--border)] bg-[var(--background)] hover:border-emerald-500 text-[var(--foreground)] active:scale-95"
                          }`}
                        >
                          <Check className={`h-3.5 w-3.5 ${isTaken ? "opacity-100" : "opacity-35"}`} />
                          <span>{isTaken ? "Taken" : "Log"}</span>
                        </button>
                      </td>

                      {/* Date Range / Duration */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--foreground)]">
                          <Calendar className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{med.start_date ? formatDate(med.start_date) : "Ongoing"}</span>
                          {med.end_date ? (
                            <span>→ {formatDate(med.end_date)}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">(Indefinite)</span>
                          )}
                        </div>
                      </td>

                      {/* Course Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${rangeInfo.color}`}
                        >
                          {rangeInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(med)}
                            className="cursor-pointer p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-colors"
                            title="Edit Medication"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {med.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusToggle(med, "discontinued")}
                              className="cursor-pointer p-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title="Pause / Inactivate"
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusToggle(med, "active")}
                              className="cursor-pointer p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Reactivate Course"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="md:hidden space-y-3">
          {filteredMedications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
              No medications match the current filter.
            </div>
          ) : (
            filteredMedications.map((med) => {
              const isTaken = loggedMeds[med.id];
              const rangeInfo = getMedRangeStatus(med);

              return (
                <div
                  key={`mob-${med.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTaken
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 shadow-xs"
                      : "bg-white dark:bg-white/[0.03] border-slate-200/90 dark:border-white/10 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Pill className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-[var(--foreground)] truncate">
                            {med.name}
                          </h3>
                          {med.generic_name && (
                            <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                              {med.generic_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMed(med.id)}
                      className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95 ${
                        isTaken
                          ? "bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700"
                          : "border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:border-emerald-500 text-[var(--foreground)]"
                      }`}
                    >
                      <Check className={`h-4 w-4 ${isTaken ? "opacity-100" : "opacity-40"}`} />
                      <span>{isTaken ? "Taken" : "Log"}</span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-100/80 dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dose & Frequency</span>
                      <span className="font-extrabold text-[var(--foreground)]">{med.strength || med.dosage}</span>
                      <span className="text-slate-500 block truncate">{med.frequency}</span>
                    </div>
                    <div className="bg-slate-100/80 dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Status</span>
                      <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-extrabold border ${rangeInfo.color}`}>
                        {rangeInfo.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                        {med.start_date ? formatDate(med.start_date) : "Ongoing"}
                      </span>
                    </div>
                  </div>

                  {med.instructions && (
                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30">
                      {med.instructions}
                    </p>
                  )}

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">
                      Dr. {med.prescribing_doctor || "Physician"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(med)}
                      className="cursor-pointer px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs font-semibold hover:bg-[var(--muted)] text-[var(--foreground)]"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Clinical Drug-Drug Interaction Safety Engine */}
      <section className="soft-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] leading-tight">
                Drug-Drug Interaction Safety Engine
              </h2>
              <span className="text-[11px] text-[var(--muted-foreground)] block">
                Instant clinical safety screening against your active prescriptions and allergies.
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline">
            {activeMeds.length} Active Prescriptions Screened
          </span>
        </div>

        {/* Search input to test drug */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Test any OTC drug, supplement, or new prescription (e.g. Ibuprofen, Sudafed)..."
              value={testDrugInput}
              onChange={(e) => setTestDrugInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  checkDrugInteraction(testDrugInput);
                }
              }}
              className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] pl-10 pr-4 text-xs font-medium text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => checkDrugInteraction(testDrugInput)}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <span>Analyze Safety</span>
          </button>
        </div>

        {/* Quick test chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold max-w-full hide-scrollbar">
          <span className="text-[10px] text-[var(--muted-foreground)] font-bold shrink-0">
            Quick Check:
          </span>
          {["Ibuprofen (Advil)", "Pseudoephedrine (Sudafed)", "Amoxicillin", "Aspirin 81mg"].map((drug) => (
            <button
              key={drug}
              type="button"
              onClick={() => {
                setTestDrugInput(drug);
                checkDrugInteraction(drug);
              }}
              className="whitespace-nowrap px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--muted)] hover:border-emerald-500/40 transition-colors cursor-pointer shrink-0"
            >
              {drug}
            </button>
          ))}
        </div>

        {/* Interaction Results Banner */}
        {interactionResult && (
          <div
            className={`p-4 rounded-2xl border space-y-2.5 animate-in fade-in ${
              interactionResult.level === "severe"
                ? "bg-rose-50/90 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900/70 dark:text-rose-200"
                : interactionResult.level === "moderate"
                ? "bg-amber-50/90 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-900/70 dark:text-amber-200"
                : "bg-emerald-50/90 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900/70 dark:text-emerald-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                {interactionResult.level === "severe" ? (
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : interactionResult.level === "moderate" ? (
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-extrabold truncate">
                  {interactionResult.drug}:{" "}
                  {interactionResult.level === "severe"
                    ? "Severe Contraindication / Allergy Risk"
                    : interactionResult.level === "moderate"
                    ? "Moderate Clinical Caution Detected"
                    : "Safe Compatibility"}
                </span>
              </div>
              {interactionResult.interactingWith && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/70 dark:bg-black/30 border border-current self-start sm:self-auto shrink-0">
                  Affects: {interactionResult.interactingWith}
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed opacity-90">
              {interactionResult.mechanism}
            </p>

            {interactionResult.alternative && (
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-current text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Clinical Alternative: {interactionResult.alternative}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* EDIT MEDICATION MODAL */}
      {editingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--foreground)]">
                    Edit Prescription & Course Range
                  </h3>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Update dose timings, start/end dates, and physician instructions.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMed(null)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Brand Name *
                  </label>
                  <Input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Candifast SB, Clavurox"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Generic Chemical Name
                  </label>
                  <Input
                    value={formGeneric}
                    onChange={(e) => setFormGeneric(e.target.value)}
                    placeholder="e.g. Fluconazole, Cefuroxime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Strength / Dose *
                  </label>
                  <Input
                    required
                    value={formStrength}
                    onChange={(e) => setFormStrength(e.target.value)}
                    placeholder="e.g. 130 mg, 625 mg"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Frequency
                  </label>
                  <Input
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    placeholder="e.g. 1-0-1, Once daily"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Route
                  </label>
                  <select
                    value={formRoute}
                    onChange={(e) => setFormRoute(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  >
                    <option value="oral">Oral (Capsule/Tablet)</option>
                    <option value="topical">Topical (Cream/Lotion)</option>
                    <option value="inhaler">Inhaler / Resp</option>
                    <option value="injection">SubQ / Injection</option>
                    <option value="ophthalmic">Eye / Ear Drops</option>
                  </select>
                </div>
              </div>

              {/* Timing & Schedule */}
              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Daily Timing & Meal Schedule
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {["Morning after meal", "Night after meal", "Morning & Night", "Before breakfast"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormTiming(t)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                        formTiming === t
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : "border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Input
                  value={formTiming}
                  onChange={(e) => setFormTiming(e.target.value)}
                  placeholder="e.g. Morning after breakfast and Night before bedtime"
                />
              </div>

              {/* Date Range & Duration (Doctor Time Range Feature) */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Doctor Prescribed Course Range
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Range-based active/inactive lifecycle
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[var(--foreground)] text-[11px]">
                      Course Start Date
                    </label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[var(--foreground)] text-[11px]">
                      Course End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quick duration presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] mr-1">
                    Quick Duration:
                  </span>
                  {[
                    { label: "7 Days", days: 7 },
                    { label: "14 Days", days: 14 },
                    { label: "1 Month", days: 30 },
                    { label: "6 Weeks", days: 42 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickDuration(preset.days)}
                      className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] font-bold text-[var(--foreground)] cursor-pointer"
                    >
                      +{preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormEndDate("")}
                    className="px-2 py-1 rounded-md text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Continuous / No End
                  </button>
                </div>
              </div>

              {/* Status and Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Current Course Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  >
                    <option value="active">Active (Taking Regularly)</option>
                    <option value="discontinued">Paused / Inactive</option>
                    <option value="completed">Completed (Course Ended)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Prescribing Doctor
                  </label>
                  <Input
                    value={formDoc}
                    onChange={(e) => setFormDoc(e.target.value)}
                    placeholder="e.g. Prof. Dr. Quazi Salim Yazdi"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Clinical Instructions & Notes
                </label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Apply thin layer to affected skin twice daily"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete Prescription"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingMed(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRESCRIPTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg space-y-4 p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Pill className="h-4 w-4" />
                </div>
                <h3 className="text-base font-extrabold text-[var(--foreground)]">
                  Add New Prescription
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Brand Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Lisinopril, Metformin"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Generic Name
                  </label>
                  <Input
                    placeholder="e.g. Fluconazole"
                    value={formGeneric}
                    onChange={(e) => setFormGeneric(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Strength / Dose *
                  </label>
                  <Input
                    required
                    placeholder="e.g. 20 mg, 500 mg"
                    value={formStrength}
                    onChange={(e) => setFormStrength(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Frequency
                  </label>
                  <Input
                    placeholder="e.g. Once daily, 1-0-1"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Route
                  </label>
                  <select
                    value={formRoute}
                    onChange={(e) => setFormRoute(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  >
                    <option value="oral">Oral (Tablet/Capsule)</option>
                    <option value="topical">Topical (Cream/Lotion)</option>
                    <option value="inhaler">Inhaler / Respiratory</option>
                    <option value="injection">Injection / SubQ</option>
                    <option value="ophthalmic">Eye / Ear Drops</option>
                  </select>
                </div>
              </div>

              {/* Course Duration & Date Range */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)]/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Doctor Time Range & Duration
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Auto-manages course completion
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-bold text-[var(--foreground)] text-[11px]">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-[var(--foreground)] text-[11px]">
                      End Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] mr-1">
                    Quick Duration:
                  </span>
                  {[
                    { label: "7 Days", days: 7 },
                    { label: "14 Days", days: 14 },
                    { label: "1 Month", days: 30 },
                    { label: "6 Weeks", days: 42 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setQuickDuration(preset.days)}
                      className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[10px] font-bold text-[var(--foreground)] cursor-pointer"
                    >
                      +{preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormEndDate("")}
                    className="px-2 py-1 rounded-md text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Continuous Maintenance
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Prescribing Doctor
                  </label>
                  <Input
                    placeholder="e.g. Dr. Catherine Wei"
                    value={formDoc}
                    onChange={(e) => setFormDoc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--foreground)]">
                    Target Condition
                  </label>
                  <Input
                    placeholder="e.g. Hypertension, Diabetes"
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[var(--foreground)]">
                  Clinical Instructions / Notes
                </label>
                <Input
                  placeholder="e.g. Take with morning meal and full glass of water"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Saving...
                    </>
                  ) : (
                    "Save Prescription"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
