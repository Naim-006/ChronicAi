"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockDoctors } from "@/lib/mock-data";
import { Doctor } from "@/types/medical";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Doctor Form State
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty) return;

    const newDoc: Doctor = {
      id: `doc-${Date.now()}`,
      user_id: "user-elena-vance",
      name,
      specialty,
      clinic_name: clinic,
      phone,
      email,
      address,
      notes,
      created_at: new Date().toISOString(),
    };

    setDoctors((prev) => [newDoc, ...prev]);
    setShowAddModal(false);
    setName("");
    setSpecialty("");
    setClinic("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Healthcare Providers"
        description="Directory of physicians, specialists, and clinics you have consulted. Stores contact info, visit history, and consultation instructions."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Doctors" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Doctor
          </Button>
        }
      />

      {/* Add Doctor Modal */}
      {showAddModal && (
        <Card className="border-2 border-teal-600 bg-white p-5 shadow-lg">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Add Healthcare Provider
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
          <form onSubmit={handleAddDoctor} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Physician Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Dr. Catherine Wei, MD"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Medical Specialty *
                </label>
                <Input
                  required
                  placeholder="e.g. Endocrinology & Metabolism"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinic or Hospital Name
                </label>
                <Input
                  placeholder="e.g. Endocrine & Metabolic Health"
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <Input
                  placeholder="e.g. +1 (555) 789-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.g. doctor@clinic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Practice Address
                </label>
                <Input
                  placeholder="e.g. 450 Medical Park Blvd, Seattle, WA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Clinical Context & Consultation Notes
              </label>
              <Input
                placeholder="e.g. Primary doctor managing diabetes and quarterly lab panels."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                Save Provider
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc) => (
          <Card key={doc.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-teal-50 text-teal-800 font-bold text-xs shrink-0">
                  {doc.name.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">{doc.name}</CardTitle>
                  <span className="text-xs text-teal-800 font-medium block">{doc.specialty}</span>
                  {doc.clinic_name && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">{doc.clinic_name}</span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-3 pb-4 space-y-2 text-xs text-slate-600 flex-1">
              {doc.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{doc.phone}</span>
                </div>
              )}
              {doc.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{doc.email}</span>
                </div>
              )}
              {doc.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{doc.address}</span>
                </div>
              )}

              {doc.notes && (
                <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  {doc.notes}
                </div>
              )}
            </CardContent>

            <div className="p-3 border-t border-slate-100 bg-slate-50/60 rounded-b-lg flex justify-end">
              <Button size="sm" variant="outline" className="text-xs h-7">
                View History
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
