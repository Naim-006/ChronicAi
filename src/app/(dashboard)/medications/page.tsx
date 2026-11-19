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
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Medications
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            4 active daily prescriptions tracked.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-600 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="h-4 w-4 text-teal-800 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Prescription Safety:</strong> Dosages reflect your doctor's exact instructions. The AI assistant does not alter prescribed medical regimens.
        </span>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Add Prescribed Medication</span>
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
              <label className="font-semibold text-slate-700 block mb-1">Medication Name *</label>
              <input
                required
                placeholder="e.g. Metformin ER"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Strength / Dose *</label>
                <input
                  required
                  placeholder="e.g. 1000mg"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Frequency</label>
                <input
                  placeholder="e.g. Twice daily"
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Doctor</label>
                <input
                  placeholder="e.g. Dr. Wei"
                  value={doc}
                  onChange={(e) => setDoc(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Condition</label>
                <input
                  placeholder="e.g. Type 2 Diabetes"
                  value={cond}
                  onChange={(e) => setCond(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Instructions</label>
              <input
                placeholder="e.g. Take with food"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-xs font-semibold text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medication Details Modal */}
      {selectedMed && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">{selectedMed.name} Details</span>
            <button
              type="button"
              onClick={() => setSelectedMed(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] uppercase">Generic Name</span>
              <span className="font-bold text-slate-900">{selectedMed.generic_name || selectedMed.name}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] uppercase">Dosage & Schedule</span>
              <span>{selectedMed.dosage} • {selectedMed.frequency}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] uppercase">Instructions</span>
              <span className="text-teal-900 font-medium">{selectedMed.instructions}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <div>Prescriber: {selectedMed.prescribing_doctor}</div>
              <div>Condition: {selectedMed.related_condition}</div>
            </div>
          </div>
        </div>
      )}

      {/* Structured Grouped Medication List */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 block mb-2">
          Daily Dosing Checklist
        </span>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {medications.map((med) => {
            const isTaken = loggedMeds[med.id];
            return (
              <div
                key={med.id}
                className="flex items-center justify-between p-3.5 sm:px-4 hover:bg-slate-50/70 transition-colors select-none"
              >
                <div
                  onClick={() => toggleMed(med.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <button
                    type="button"
                    aria-label={`Mark ${med.name}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors shrink-0 ${
                      isTaken
                        ? "bg-teal-700 border-teal-700 text-white"
                        : "border-slate-300 hover:border-slate-400 bg-white"
                    }`}
                  >
                    {isTaken && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isTaken ? "text-slate-500 line-through" : "text-slate-900"
                        }`}
                      >
                        {med.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {med.strength}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {med.frequency}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMed(med)}
                  className="text-xs font-medium text-teal-800 hover:underline p-1 shrink-0 ml-2"
                >
                  Details
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
