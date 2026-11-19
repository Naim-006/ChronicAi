"use client";

import React, { useState } from "react";
import {
  UserRound,
  ShieldAlert,
  AlertTriangle,
  Phone,
  Heart,
  Save,
  CheckCircle2,
  Calendar,
  Activity,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState(mockProfile);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Health Profile"
        description="Comprehensive demographic baseline, confirmed allergies, emergency contacts, and chronic health history."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Health Profile" }]}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            className="text-xs h-8 gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Save className="h-3.5 w-3.5" />
            Save Profile
          </Button>
        }
      />

      {isSaved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Health profile changes successfully updated and synchronized.
        </div>
      )}

      {/* Profile Overview & Emergency Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Demographics & Emergency Card */}
        <div className="space-y-6">
          {/* Emergency Identification Card */}
          <Card className="border-red-200 bg-red-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                Emergency Medical Card
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
                <span className="text-slate-600">Blood Group:</span>
                <span className="font-extrabold text-red-700 text-sm">{profile.blood_group}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-red-200/60">
                <span className="text-slate-600">Primary Emergency Contact:</span>
                <span className="font-semibold text-slate-900">{profile.emergency_contact?.name} ({profile.emergency_contact?.relationship})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Emergency Phone:</span>
                <span className="font-bold text-slate-900">{profile.emergency_contact?.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Core Demographics Form */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">Demographic Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Height (cm)</label>
                  <Input
                    type="number"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: parseFloat(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Confirmed Allergies & Chronic Conditions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Confirmed Allergies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Confirmed Allergies & Adverse Drug Reactions ({profile.allergies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {profile.allergies.map((allergy) => (
                <div key={allergy.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{allergy.substance}</span>
                    <Badge variant={allergy.severity === "severe" ? "destructive" : "warning"} className="text-[10px] capitalize">
                      {allergy.severity} Reaction
                    </Badge>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Reaction: {allergy.reaction}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    Documented: {formatDate(allergy.diagnosed_date)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Chronic Conditions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-4 w-4 text-teal-700" />
                Documented Chronic Medical Conditions ({profile.chronic_conditions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {profile.chronic_conditions.map((cond) => (
                <div key={cond.id} className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cond.name}</span>
                    <Badge variant="default" className="text-[10px] capitalize">
                      {cond.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    ICD-10: <strong>{cond.icd10}</strong> • Diagnosed on {formatDate(cond.diagnosed_date)}
                  </div>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {cond.notes}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
