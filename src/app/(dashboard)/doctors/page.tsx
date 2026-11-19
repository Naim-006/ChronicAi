"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  X,
} from "lucide-react";
import { mockDoctors } from "@/lib/mock-data";
import { Doctor } from "@/types/medical";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty) return;

    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      user_id: "user-elena-vance",
      name,
      specialty,
      clinic_name: clinic,
      phone,
      notes,
      created_at: new Date().toISOString(),
    };

    setDoctors((prev) => [newDoc, ...prev]);
    setShowAddModal(false);
    setName("");
    setSpecialty("");
    setClinic("");
    setPhone("");
    setNotes("");
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Healthcare Providers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your personal directory of {doctors.length} consulting doctors.
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="rounded-2xl border border-teal-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">Add Healthcare Provider</span>
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
              <label className="font-semibold text-slate-700 block mb-1">Doctor Name *</label>
              <input
                required
                placeholder="e.g. Dr. Catherine Wei, MD"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specialty *</label>
                <input
                  required
                  placeholder="e.g. Endocrinology"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinic Name</label>
                <input
                  placeholder="e.g. Metabolic Health"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                placeholder="e.g. +1 (555) 789-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-200 px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Clinical Context</label>
              <input
                placeholder="e.g. Primary endocrinologist for quarterly diabetes workup."
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

      {/* Grouped Doctors List */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {doctors.map((doc) => (
          <div key={doc.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 font-bold text-xs shrink-0">
                  {doc.name.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{doc.name}</span>
                  <span className="text-[11px] text-teal-800 font-medium block">{doc.specialty}</span>
                  {doc.clinic_name && (
                    <span className="text-[11px] text-slate-400 block">{doc.clinic_name}</span>
                  )}
                </div>
              </div>

              {doc.phone && (
                <a
                  href={`tel:${doc.phone}`}
                  className="flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call</span>
                </a>
              )}
            </div>

            {doc.notes && (
              <p className="text-[11px] text-slate-500 pl-12 leading-relaxed">
                {doc.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
