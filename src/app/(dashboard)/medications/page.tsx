"use client";

import React, { useState } from "react";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Building,
  User,
  ShieldAlert,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { mockMedications } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Medication } from "@/types/medical";

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
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("");
  const [doc, setDoc] = useState("");
  const [cond, setCond] = useState("");
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
      instructions: notes || "Take as prescribed.",
      start_date: new Date().toISOString().split("T")[0],
      prescribing_doctor: doc || "Dr. Catherine Wei, MD",
      related_condition: cond || "General Care",
      status: "active",
      created_at: new Date().toISOString(),
    };

    setMedications((prev) => [newMed, ...prev]);
    setShowAddModal(false);
    setName("");
    setDose("");
    setFreq("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Current Medications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            4 active daily prescriptions tracked with daily adherence history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Prescription</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-3xl border border-emerald-300 bg-white p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-900">Add Prescribed Medication</span>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Medication Name *</label>
              <input
                required
                placeholder="e.g. Metformin Extended Release"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Strength / Dose *</label>
                <input
                  required
                  placeholder="e.g. 1000mg"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Frequency</label>
                <input
                  placeholder="e.g. Twice daily"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor</label>
                <input
                  placeholder="e.g. Dr. Catherine Wei"
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Condition</label>
                <input
                  placeholder="e.g. Type 2 Diabetes"
                  value={cond}
                  onChange={(e) => setCond(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Instructions</label>
              <input
                placeholder="e.g. Take with food. Drink water."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter Pills (Image 3 style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        {[
          { id: "all", label: "All Active" },
          { id: "diabetes", label: "Diabetes (Metformin & Jardiance)" },
          { id: "cardio", label: "Cardiovascular (Lisinopril & Statin)" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Medication Adherence Matrix (Exact replica of Image 3 screen 3) */}
      <div className="rounded-3xl bg-white border border-slate-100/90 p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Adherence History Matrix (Last 6 Months)
          </span>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Metformin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              Empagliflozin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Lisinopril
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              Atorvastatin
            </span>
          </div>
        </div>

        {/* Matrix Table with Month Rows and Dot/Check Indicators */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-slate-400 text-[10px] font-extrabold uppercase">
                <th className="text-left pb-2">Month</th>
                <th className="pb-2">Metformin</th>
                <th className="pb-2">Empagliflozin</th>
                <th className="pb-2">Lisinopril</th>
                <th className="pb-2">Atorvastatin</th>
                <th className="text-right pb-2">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { month: "November", r1: true, r2: true, r3: true, r4: true, score: "100%" },
                { month: "October", r1: true, r2: true, r3: true, r4: true, score: "100%" },
                { month: "September", r1: true, r2: true, r3: true, r4: true, score: "100%" },
                { month: "August", r1: true, r2: true, r3: true, r4: false, score: "96%" },
                { month: "July", r1: true, r2: true, r3: true, r4: true, score: "100%" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="text-left py-2.5 font-bold text-slate-800">{row.month}</td>
                  <td className="py-2.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">✓</span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold">✓</span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">✓</span>
                  </td>
                  <td className="py-2.5">
                    {row.r4 ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">✓</span>
                    ) : (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-[10px]">●</span>
                    )}
                  </td>
                  <td className="text-right py-2.5 font-extrabold text-emerald-600">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Prescription Cards */}
      <div className="space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
          Daily Dosing Checklist
        </span>

        {medications.map((med) => {
          const isTaken = loggedMeds[med.id];
          return (
            <div
              key={med.id}
              className="rounded-3xl bg-white border border-slate-100/90 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
            >
              <div
                onClick={() => toggleMed(med.id)}
                className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
              >
                <button
                  type="button"
                  aria-label={`Mark ${med.name}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all shrink-0 ${
                    isTaken
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xs scale-105"
                      : "border-slate-300 hover:border-slate-400 bg-white"
                  }`}
                >
                  {isTaken && <Check className="h-4 w-4 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-extrabold truncate ${
                        isTaken ? "text-slate-400 line-through" : "text-slate-900"
                      }`}
                    >
                      {med.name}
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {med.strength}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block truncate mt-0.5">
                    {med.frequency} • {med.instructions}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Prescribed by {med.prescribing_doctor} for {med.related_condition}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-bold shrink-0 ${
                  isTaken ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {isTaken ? "Taken" : "Tap to log"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
