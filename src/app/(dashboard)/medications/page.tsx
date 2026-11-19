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
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockMedications, mockMedicationLogs } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Medication, AdherenceStatus } from "@/types/medical";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [logs, setLogs] = useState(mockMedicationLogs);
  const [adherenceMap, setAdherenceMap] = useState<Record<string, AdherenceStatus>>({
    "med-1": "taken",
    "med-2": "taken",
    "med-3": "taken",
    "med-4": "snoozed",
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // New medication form state
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedDoc, setNewMedDoc] = useState("");
  const [newMedCond, setNewMedCond] = useState("");
  const [newMedNotes, setNewMedNotes] = useState("");

  const handleLogAdherence = (medId: string, status: AdherenceStatus) => {
    setAdherenceMap((prev) => ({
      ...prev,
      [medId]: status,
    }));
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDose) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      user_id: "user-elena-vance",
      name: newMedName,
      strength: newMedDose,
      dosage: newMedDose,
      frequency: newMedFreq || "Once daily",
      instructions: newMedNotes || "Take as prescribed.",
      start_date: new Date().toISOString().split("T")[0],
      prescribing_doctor: newMedDoc || "Dr. Catherine Wei, MD",
      related_condition: newMedCond || "General Healthcare",
      status: "active",
      created_at: new Date().toISOString(),
    };

    setMedications((prev) => [newMed, ...prev]);
    setShowAddModal(false);
    setNewMedName("");
    setNewMedDose("");
    setNewMedFreq("");
    setNewMedNotes("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medication Management & Adherence"
        description="Organize your active prescriptions, monitor daily dosing schedules, log adherence, and receive refill reminders."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Medications" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Prescription
          </Button>
        }
      />

      {/* Safety Notice */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3.5 text-teal-900 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed">
          <span className="font-semibold block text-teal-950">Medication Safety Guardrail</span>
          Dosage and frequency must reflect your licensed doctor's prescription. The AI assistant will never independently alter, discontinue, or prescribe new pharmaceutical treatments.
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <Card className="border-2 border-teal-600 bg-white p-5 shadow-lg">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Add Prescribed Medication
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="h-7 w-7 p-0 text-slate-400"
            >
              ×
            </Button>
          </CardHeader>
          <form onSubmit={handleAddMedication} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Medication Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Metformin Extended Release"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Strength & Dosage *
                </label>
                <Input
                  required
                  placeholder="e.g. 1000mg tablet"
                  value={newMedDose}
                  onChange={(e) => setNewMedDose(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Frequency / Timing
                </label>
                <Input
                  placeholder="e.g. Twice daily with breakfast and dinner"
                  value={newMedFreq}
                  onChange={(e) => setNewMedFreq(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Prescribing Physician
                </label>
                <Input
                  placeholder="e.g. Dr. Catherine Wei, MD"
                  value={newMedDoc}
                  onChange={(e) => setNewMedDoc(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Associated Health Condition
                </label>
                <Input
                  placeholder="e.g. Type 2 Diabetes"
                  value={newMedCond}
                  onChange={(e) => setNewMedCond(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Special Instructions (Food, storage, warnings)
              </label>
              <Input
                placeholder="e.g. Take with food. Drink full glass of water."
                value={newMedNotes}
                onChange={(e) => setNewMedNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-8"
              >
                Save Medication
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Active Medications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((med) => {
          const currentStatus = adherenceMap[med.id] || "snoozed";
          return (
            <Card key={med.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-800 mt-0.5">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-slate-900">{med.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          {med.strength}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {med.generic_name || med.name}
                      </span>
                    </div>
                  </div>

                  <Badge variant="success" className="text-[10px] capitalize">
                    {med.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                <div className="rounded-md bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Dosing Schedule:</span>
                    <span className="font-medium text-teal-800">{med.frequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">{med.instructions}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span>Prescribed by:</span>
                    <span className="font-medium text-slate-700">{med.prescribing_doctor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Indication:</span>
                    <span className="font-medium text-slate-700">{med.related_condition}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Start Date:</span>
                    <span>{formatDate(med.start_date)}</span>
                  </div>
                </div>
              </CardContent>

              {/* Action Bar */}
              <div className="border-t border-slate-100 bg-slate-50/60 p-3 rounded-b-lg flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500">Today: </span>
                  {currentStatus === "taken" ? (
                    <span className="font-semibold text-emerald-700">✓ Taken</span>
                  ) : currentStatus === "skipped" ? (
                    <span className="font-semibold text-slate-600">Skipped</span>
                  ) : (
                    <span className="font-semibold text-amber-700">Pending</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={currentStatus === "taken" ? "default" : "outline"}
                    onClick={() => handleLogAdherence(med.id, "taken")}
                    className="text-xs h-7 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  >
                    Taken
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLogAdherence(med.id, "skipped")}
                    className="text-xs h-7 text-slate-500 hover:bg-slate-100"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
