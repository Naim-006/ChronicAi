"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Stethoscope,
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
      instructions: notes || "Take as prescribed with water.",
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
    setDoc("");
    setCond("");
    setNotes("");
  };

  const matrixMonths = [
    { month: "Jan", c1: "checked", c2: "checked", c3: "checked", c4: "dot" },
    { month: "Feb", c1: "checked", c2: "checked", c3: "checked", c4: "dot" },
    { month: "Mar", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
    { month: "Apr", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
    { month: "May", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
    { month: "Jun", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
    { month: "Jul", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
    { month: "Aug", c1: "checked", c2: "checked", c3: "checked", c4: "checked" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* 1. Image 3 Screen 3 Vibrant Curved Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#7CD017] to-[#5BA510] text-white p-5 sm:p-6 shadow-lg shadow-green-700/20 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
                Current Medications
              </h1>
              <span className="text-[11px] font-semibold text-white/90 block">
                4 Active Daily Prescriptions · 96% Adherence
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 text-xs font-bold shadow-md shadow-black/10 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Medication</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Category Pill Filters (Matching Image 3 Screen 3) */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
          {[
            { id: "all", label: "All Medications" },
            { id: "metabolic", label: "Metabolic (Metformin)" },
            { id: "cardio", label: "Cardiovascular (Lisinopril)" },
            { id: "statin", label: "Lipids (Atorvastatin)" },
            { id: "supplements", label: "Supplements (Vitamin D3)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-white text-[#5BA510] shadow-sm"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Medication Adherence Matrix (Exact replica of Image 3 Screen 3) */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] space-y-4">
        {/* Legend Row with Colored Dots */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Monthly Adherence Compliance
          </span>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Amoxicillin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              Vitamin C
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Aspirin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              Metformin
            </span>
          </div>
        </div>

        {/* Matrix Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase">
                <th className="text-left pb-3 pl-2">Month</th>
                <th className="pb-3">Amoxicillin</th>
                <th className="pb-3">Vitamin C</th>
                <th className="pb-3">Aspirin</th>
                <th className="pb-3">Metformin</th>
                <th className="text-right pb-3 pr-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixMonths.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/70 transition-colors">
                  <td className="text-left py-3 pl-2 font-bold text-slate-700">
                    {row.month}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  </td>
                  <td className="text-right py-3 pr-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100">
                      100% Taken
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Daily Dose Log & Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-slate-900">
            Today's Prescriptions & Dosing Schedule
          </h2>
          <span className="text-xs font-bold text-emerald-600">
            3 of 4 Logged Today
          </span>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] divide-y divide-slate-100 overflow-hidden">
          {medications.map((med) => {
            const isTaken = loggedMeds[med.id];
            return (
              <div
                key={med.id}
                onClick={() => toggleMed(med.id)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    aria-label={`Mark ${med.name} as taken`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all shrink-0 ${
                      isTaken
                        ? "bg-[#22C55E] border-[#22C55E] text-white shadow-xs scale-105"
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
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {med.strength}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block truncate mt-0.5">
                      {med.frequency} · Prescribed by {med.prescribing_doctor}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold block ${
                      isTaken ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {isTaken ? "Logged" : "Tap to log"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {med.instructions}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Add New Prescription
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Medication Name *</label>
                <input
                  required
                  placeholder="e.g. Metformin Hydrochloride"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strength / Dosage *</label>
                  <input
                    required
                    placeholder="e.g. 500 mg"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Frequency</label>
                  <input
                    placeholder="e.g. Twice daily with meals"
                    value={freq}
                    onChange={(e) => setFreq(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prescribing Physician</label>
                <input
                  placeholder="e.g. Dr. Catherine Wei, MD"
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Instructions</label>
                <input
                  placeholder="e.g. Take with food to reduce GI upset."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-xs font-bold text-white shadow-md shadow-green-600/30"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
