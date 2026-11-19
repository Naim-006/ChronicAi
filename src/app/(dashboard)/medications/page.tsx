"use client";

import React, { useState } from "react";
import { Pill, Plus, Check, X, ShieldAlert, ShieldCheck, AlertTriangle, Search, Stethoscope } from "lucide-react";
import { mockMedications } from "@/lib/mock-data";
import { Medication } from "@/types/medical";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [loggedMeds, setLoggedMeds] = useState<Record<string, boolean>>({
    "med-1": true,
    "med-2": true,
    "med-3": true,
    "med-4": false,
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [testDrugInput, setTestDrugInput] = useState("");
  const [interactionResult, setInteractionResult] = useState<{
    drug: string;
    level: "safe" | "moderate" | "severe";
    interactingWith?: string;
    mechanism: string;
    alternative?: string;
  } | null>({
    drug: "Ibuprofen (Advil)",
    level: "moderate",
    interactingWith: "Lisinopril 20mg & Jardiance 10mg",
    mechanism: "NSAIDs inhibit renal prostaglandins, which blunts Lisinopril's antihypertensive action and causes acute decreases in glomerular filtration (eGFR).",
    alternative: "Acetaminophen (Tylenol) 500mg as needed is safer for renal protection.",
  });

  const checkDrugInteraction = (drugName: string) => {
    const q = drugName.toLowerCase().trim();
    if (!q) return;

    if (q.includes("ibuprofen") || q.includes("advil") || q.includes("aleve") || q.includes("naproxen") || q.includes("motrin")) {
      setInteractionResult({
        drug: drugName,
        level: "moderate",
        interactingWith: "Lisinopril 20mg & Jardiance 10mg",
        mechanism: "NSAIDs inhibit renal vasodilatory prostaglandins, decreasing eGFR and counteracting ACE-inhibitor blood pressure reduction.",
        alternative: "Acetaminophen (Tylenol) 500mg every 6 hours (max 2000mg/day) is recommended.",
      });
    } else if (q.includes("sudafed") || q.includes("pseudoephedrine") || q.includes("decongestant")) {
      setInteractionResult({
        drug: drugName,
        level: "moderate",
        interactingWith: "Lisinopril 20mg",
        mechanism: "Sympathomimetic alpha-1 stimulation triggers systemic vasoconstriction, elevating systolic blood pressure by 10-15 mmHg.",
        alternative: "Saline nasal irrigation or Coricidin HBP (decongestant-free cold relief).",
      });
    } else if (q.includes("amoxicillin") || q.includes("penicillin") || q.includes("antibiotic")) {
      setInteractionResult({
        drug: drugName,
        level: "severe",
        interactingWith: "Patient Allergy Profile",
        mechanism: "Severe anaphylactic allergy documented on Elena's Emergency Medical Card. Beta-lactam antibiotics are strictly contraindicated.",
        alternative: "Azithromycin (Macrolide) or Doxycycline as approved by Dr. Catherine Wei.",
      });
    } else if (q.includes("aspirin")) {
      setInteractionResult({
        drug: drugName,
        level: "safe",
        interactingWith: "Cardiovascular Regimen",
        mechanism: "Low-dose 81mg enteric-coated aspirin is compatible with Lisinopril and Atorvastatin under clinical guidance.",
      });
    } else {
      setInteractionResult({
        drug: drugName,
        level: "safe",
        mechanism: `No critical clinical interactions detected between ${drugName} and your 4 active prescriptions. Always verify with your pharmacist.`,
      });
    }
  };

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("");
  const [doc, setDoc] = useState("");
  const [notes, setNotes] = useState("");

  const toggleMed = (medId: string) => {
    setLoggedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dose) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      user_id: "user-elena-vance",
      name,
      strength: dose,
      dosage: dose,
      frequency: freq || "Once daily",
      instructions: notes || "Take as prescribed with water.",
      start_date: new Date().toISOString().split("T")[0],
      prescribing_doctor: doc || "Dr. Catherine Wei, MD",
      related_condition: "General Care",
      status: "active",
      created_at: new Date().toISOString(),
    };

    setMedications((prev) => [newMed, ...prev]);
    setShowAddModal(false);
    setName("");
    setDose("");
    setFreq("");
    setDoc("");
    setNotes("");
  };

  const takenCount = Object.values(loggedMeds).filter(Boolean).length;
  const adherence = Math.round((takenCount / Math.max(medications.length, 1)) * 100);

  const matrixMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Treatment"
        title="Medications"
        description={`${medications.length} active prescriptions · ${adherence}% logged today`}
        actions={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-3.5 w-3.5" />
            Add med
          </Button>
        }
        className="lg:mb-2"
      />

      {/* Soft emerald summary banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-[var(--shadow-lift)] sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Daily protocol</h2>
              <p className="text-xs text-emerald-50/90">
                {takenCount} of {medications.length} doses logged today
              </p>
            </div>
          </div>
          <div className="soft-inset flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md">
            <div className="text-3xl font-extrabold">{adherence}%</div>
            <div className="text-[11px] font-semibold leading-tight text-emerald-50">
              Adherence
              <br />
              today
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "metabolic", label: "Metabolic" },
            { id: "cardio", label: "Cardio" },
            { id: "statin", label: "Lipids" },
            { id: "supplements", label: "Supplements" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 cursor-pointer rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Adherence matrix */}
      <section className="soft-card space-y-4 p-5">
        <div className="flex flex-col gap-3 border-b border-[var(--border)]/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Monthly adherence
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Metformin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Lisinopril
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Atorvastatin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              Vitamin D3
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[320px] text-center text-xs">
            <thead>
              <tr className="text-[11px] font-extrabold uppercase text-[var(--muted-foreground)]">
                <th className="pb-3 pl-2 text-left">Month</th>
                <th className="pb-3">Met</th>
                <th className="pb-3">Lis</th>
                <th className="pb-3">Ato</th>
                <th className="pb-3">Vit D</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/70">
              {matrixMonths.map((month) => (
                <tr key={month} className="transition-colors hover:bg-[var(--muted)]/50">
                  <td className="py-3 pl-2 text-left font-bold text-[var(--foreground)]">
                    {month}
                  </td>
                  {[
                    "bg-slate-100 text-slate-600",
                    "bg-emerald-100 text-emerald-700",
                    "bg-amber-100 text-amber-700",
                    "bg-sky-100 text-sky-700",
                  ].map((tone, i) => (
                    <td key={i} className="py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${tone}`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </span>
                    </td>
                  ))}
                  <td className="py-3 pr-2 text-right">
                    <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      100%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Clinical Drug-Drug Interaction Safety Engine */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[var(--shadow-soft)] space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] leading-tight">
                Drug-Drug Interaction Safety Engine
              </h2>
              <span className="text-[11px] text-[var(--muted-foreground)] block">
                Instant safety screening against Elena&apos;s 4 active prescriptions and allergies.
              </span>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100 hidden sm:inline">
            4 Meds Cross-Referenced
          </span>
        </div>

        {/* Search input to test drug */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
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
              className="h-11 w-full rounded-2xl border border-slate-200/90 bg-slate-50/60 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="button"
            onClick={() => checkDrugInteraction(testDrugInput)}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 px-4 rounded-2xl bg-[#18261F] text-white text-xs font-bold shadow-sm hover:bg-[#253D30] transition-colors cursor-pointer"
          >
            <span>Analyze Safety</span>
          </button>
        </div>

        {/* Quick test chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600 max-w-full hide-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold shrink-0">Quick Check:</span>
          {["Ibuprofen (Advil)", "Pseudoephedrine (Sudafed)", "Amoxicillin", "Aspirin 81mg"].map((drug) => (
            <button
              key={drug}
              type="button"
              onClick={() => {
                setTestDrugInput(drug);
                checkDrugInteraction(drug);
              }}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {drug}
            </button>
          ))}
        </div>

        {/* Interaction Results Banner */}
        {interactionResult && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 animate-in fade-in ${
              interactionResult.level === "severe"
                ? "bg-rose-50/80 border-rose-200 text-rose-950"
                : interactionResult.level === "moderate"
                ? "bg-amber-50/80 border-amber-200 text-amber-950"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0">
                {interactionResult.level === "severe" ? (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                ) : interactionResult.level === "moderate" ? (
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
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
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/70 border border-slate-200/60 self-start sm:self-auto shrink-0">
                  Affects: {interactionResult.interactingWith}
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed text-slate-700">
              {interactionResult.mechanism}
            </p>

            {interactionResult.alternative && (
              <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60 text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Clinical Alternative: {interactionResult.alternative}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Today's checklist */}
      <section>
        <div className="mb-3 flex items-center justify-between px-0.5">
          <h2 className="text-sm font-extrabold text-[var(--foreground)]">
            Today&apos;s doses
          </h2>
          <span className="text-xs font-bold text-emerald-600">
            {takenCount} of {medications.length} logged
          </span>
        </div>

        <div className="soft-card divide-y divide-[var(--border)]/80 overflow-hidden">
          {medications.map((med) => {
            const isTaken = loggedMeds[med.id];
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMed(med.id)}
                className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--muted)]/60"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isTaken
                        ? "scale-105 border-emerald-500 bg-emerald-500 text-white shadow-sm"
                        : "border-[var(--border)] bg-white"
                    }`}
                  >
                    {isTaken && <Check className="h-4 w-4 stroke-[3]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`truncate text-sm font-extrabold ${
                          isTaken
                            ? "text-[var(--muted-foreground)] line-through"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {med.name}
                      </h3>
                      <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {med.strength}
                      </span>
                    </div>
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                      {med.frequency} · {med.prescribing_doctor}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`block text-xs font-bold ${
                      isTaken ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {isTaken ? "Logged" : "Tap to log"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="soft-card-lift w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-extrabold text-[var(--foreground)]">
                Add prescription
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-bold">Medication *</label>
                <Input
                  required
                  placeholder="e.g. Metformin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold">Dose *</label>
                  <Input
                    required
                    placeholder="500 mg"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold">Frequency</label>
                  <Input
                    placeholder="Twice daily"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-bold">Physician</label>
                <Input
                  placeholder="Prescribing doctor"
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block font-bold">Instructions</label>
                <Input
                  placeholder="Take with food"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2.5 border-t border-[var(--border)] pt-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
