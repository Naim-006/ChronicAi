"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Building,
  User,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockAppointments, mockDoctors } from "@/lib/mock-data";
import { formatDate, formatTime } from "@/lib/utils";
import { Appointment } from "@/types/medical";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [showAddModal, setShowAddModal] = useState(false);

  // New appointment form state
  const [newDocName, setNewDocName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newLoc, setNewLoc] = useState("");

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDate || !newReason) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      user_id: "user-elena-vance",
      doctor_name: newDocName,
      specialty: newSpecialty || "General Medicine",
      clinic_or_hospital: newLoc || "Metro Medical Center",
      appointment_date: newDate,
      appointment_time: newTime || "09:00:00",
      reason: newReason,
      location: newLoc,
      status: "upcoming",
      preparation_questions: [
        `Review recent lab results regarding ${newReason}.`,
        "Confirm current medication tolerance.",
      ],
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    setShowAddModal(false);
    setNewDocName("");
    setNewSpecialty("");
    setNewDate("");
    setNewReason("");
    setNewLoc("");
  };

  const upcomingApts = appointments.filter((a) => a.status === "upcoming");
  const pastApts = appointments.filter((a) => a.status !== "upcoming");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments & Medical Consultations"
        description="Organize your upcoming and past doctor visits, track consultation instructions, and review AI appointment preparation checklists."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Appointments" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Visit
          </Button>
        }
      />

      {/* Schedule Modal */}
      {showAddModal && (
        <Card className="border-2 border-teal-600 bg-white p-5 shadow-lg">
          <CardHeader className="p-0 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900">
              Schedule Medical Visit
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
          <form onSubmit={handleCreateAppointment} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Doctor Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Dr. Catherine Wei, MD"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Specialty
                </label>
                <Input
                  placeholder="e.g. Endocrinology"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Appointment Date *
                </label>
                <Input
                  required
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Appointment Time
                </label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Visit *
                </label>
                <Input
                  required
                  placeholder="e.g. Quarterly Diabetes & Lab Review"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinic or Hospital Location
                </label>
                <Input
                  placeholder="e.g. Medical Park Blvd, Seattle"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  className="text-xs"
                />
              </div>
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
                Save Appointment
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Upcoming Visits */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
          Upcoming Consultations ({upcomingApts.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingApts.map((apt) => (
            <Card key={apt.id} className="border-teal-200 bg-white hover:border-teal-400 transition-all">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">{apt.doctor_name}</CardTitle>
                    <span className="text-xs text-teal-800 font-semibold block">{apt.specialty}</span>
                  </div>
                  <Badge variant="default" className="text-[10px] capitalize">
                    {apt.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-3">
                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900">{formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{apt.clinic_or_hospital}</span>
                  </div>
                  <div className="pt-1">
                    <span className="font-semibold text-slate-800">Reason: </span>
                    <span>{apt.reason}</span>
                  </div>
                </div>

                {apt.preparation_questions && apt.preparation_questions.length > 0 && (
                  <div className="rounded-md bg-teal-50/70 border border-teal-200 p-3 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                      <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                      AI Preparation Checklist
                    </div>
                    <ul className="list-disc pl-4 text-slate-700 space-y-0.5 text-[11px]">
                      {apt.preparation_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Past Visits History */}
      <div className="pt-4">
        <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
          Completed Consultations ({pastApts.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastApts.map((apt) => (
            <Card key={apt.id} className="bg-slate-50/60">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{apt.doctor_name}</span>
                  <span className="text-[11px] text-slate-500">{formatDate(apt.appointment_date)}</span>
                </div>
                <span className="text-xs text-slate-600 block">{apt.specialty} • {apt.clinic_or_hospital}</span>
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                  <strong>Doctor Notes:</strong> {apt.consultation_notes || "Routine follow-up completed."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
