"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Trash2,
  Stethoscope,
  Pill,
  Send,
  ArrowLeft,
  Search,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  createConsultation,
  createPrescription,
  publishPrescription,
  createFollowUp,
  getDoctorConsultations,
  getPatientSnapshot,
  checkMedicationAllergy,
  type DetailedConsultation,
  type PatientSnapshot,
  type PrescriptionItemInput,
} from "@/lib/supabase/services/consultation";
import { getAuthorizedPatients, type AuthorizedPatientRecord } from "@/lib/supabase/services/queue";
import { PrintablePrescription, type PrescriptionPrintData } from "@/components/doctor/PrintablePrescription";

// Quick chronic diagnosis options
const COMMON_DIAGNOSES = [
  "Type 2 Diabetes Mellitus",
  "Essential (Primary) Hypertension",
  "Dyslipidemia",
  "Ischemic Heart Disease (IHD)",
  "Gastroesophageal Reflux Disease (GERD)",
  "Chronic Kidney Disease (Stage 2/3)",
  "Bronchial Asthma / COPD",
  "Osteoarthritis",
];

// Quick symptom tags
const QUICK_SYMPTOMS = [
  "Chest tightness",
  "High morning glucose",
  "Occasional dizziness",
  "Shortness of breath on exertion",
  "Joint pain / swelling",
  "Post-prandial heartburn",
  "Routine chronic review",
];

// Quick common chronic lab tests
const COMMON_LAB_TESTS = [
  "Fasting Blood Sugar (FBS)",
  "HbA1c",
  "Lipid Profile",
  "Serum Creatinine",
  "eGFR",
  "Urine Routine & Micro (R/M/E)",
  "12-Lead ECG",
  "Liver Function Test (SGPT)",
];

function ConsultationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const tokenParam = searchParams.get("token");

  const { doctorProfile, user } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<"list" | "writer">("list");
  const [consultations, setConsultations] = useState<DetailedConsultation[]>([]);
  const [authorizedPatients, setAuthorizedPatients] = useState<AuthorizedPatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Writer State
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientSnapshot, setPatientSnapshot] = useState<PatientSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);

  // Clinical note inputs
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icd10, setIcd10] = useState("");
  const [advice, setAdvice] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Prescription items state
  const [items, setItems] = useState<PrescriptionItemInput[]>([
    {
      medication_name: "",
      generic_name: "",
      strength: "",
      dosage: "1 tablet",
      frequency: "1+0+1",
      route: "Oral",
      duration_days: 14,
      instructions: "After meals",
    },
  ]);

  // Allergy overrides
  const [allergyOverrides, setAllergyOverrides] = useState<Record<number, boolean>>({});

  // Follow-up state
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDays, setFollowUpDays] = useState<number | null>(14);
  const [customFollowUpDate, setCustomFollowUpDate] = useState("");
  const [followUpReason, setFollowUpReason] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Submission & printing states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    consultationId: string;
    prescriptionId: string;
    itemsPublished: number;
  } | null>(null);
  const [printData, setPrintData] = useState<PrescriptionPrintData | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      if (doctorProfile?.id) {
        const [cons, pats] = await Promise.all([
          getDoctorConsultations(doctorProfile.id),
          getAuthorizedPatients(doctorProfile.id),
        ]);
        setConsultations(cons);
        setAuthorizedPatients(pats);
      }
      setIsLoading(false);
    }
    loadData();
  }, [doctorProfile?.id]);

  // Handle URL param activation
  useEffect(() => {
    if (patientIdParam) {
      setSelectedPatientId(patientIdParam);
      setMode("writer");
    }
  }, [patientIdParam]);

  // Load patient snapshot when selected
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientSnapshot(null);
      return;
    }
    async function fetchSnapshot() {
      setIsLoadingSnapshot(true);
      const snapshot = await getPatientSnapshot(selectedPatientId);
      setPatientSnapshot(snapshot);
      setIsLoadingSnapshot(false);
    }
    fetchSnapshot();
  }, [selectedPatientId]);

  // Calculate follow-up date
  const calculatedFollowUpDate = useMemo(() => {
    if (customFollowUpDate) return customFollowUpDate;
    if (!followUpDays) return "";
    const d = new Date();
    d.setDate(d.getDate() + followUpDays);
    return d.toISOString().split("T")[0];
  }, [followUpDays, customFollowUpDate]);

  // Allergen cross-checks
  const allergyConflicts = useMemo(() => {
    const conflicts: Array<{ index: number; drugName: string; allergyName: string }> = [];
    if (!patientSnapshot || !patientSnapshot.allergies || patientSnapshot.allergies.length === 0) {
      return conflicts;
    }

    items.forEach((item, idx) => {
      if (!item.medication_name && !item.generic_name) return;
      const check = checkMedicationAllergy(
        item.medication_name,
        item.generic_name,
        patientSnapshot.allergies
      );
      if (check.hasConflict && check.matchedAllergy) {
        conflicts.push({
          index: idx,
          drugName: item.medication_name || item.generic_name || "Prescribed drug",
          allergyName: check.matchedAllergy,
        });
      }
    });

    return conflicts;
  }, [items, patientSnapshot]);

  // Prescription items helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        medication_name: "",
        generic_name: "",
        strength: "",
        dosage: "1 tablet",
        frequency: "1+0+1",
        route: "Oral",
        duration_days: 14,
        instructions: "After meals",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    setAllergyOverrides((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItemInput, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Test tag toggle
  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  // Save consultation & publish prescription
  const handleSaveAndPublish = async () => {
    if (!doctorProfile?.id) {
      setErrorMessage("Doctor profile not found or not verified");
      return;
    }
    if (!selectedPatientId) {
      setErrorMessage("Please select a patient");
      return;
    }
    if (!diagnosis.trim()) {
      setErrorMessage("Please enter a clinical diagnosis");
      return;
    }

    // Verify un-overridden allergy conflicts
    for (const conflict of allergyConflicts) {
      if (!allergyOverrides[conflict.index]) {
        setErrorMessage(
          `Please review allergy conflict for "${conflict.drugName}" (Allergy: ${conflict.allergyName}) and tick clinical override before publishing.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create Consultation
      const consRes = await createConsultation({
        patientId: selectedPatientId,
        doctorId: doctorProfile.id,
        visitTokenId: tokenParam || null,
        chiefComplaints,
        clinicalFindings,
        diagnosis,
        icd10,
        advice,
        clinicalNotes,
      });

      if (!consRes.success || !consRes.consultationId) {
        throw new Error(consRes.error || "Failed to create consultation note");
      }

      // 2. Filter valid prescription items
      const validItems = items.filter((i) => i.medication_name.trim().length > 0);
      let publishedCount = 0;
      let rxId = "";

      if (validItems.length > 0) {
        const rxRes = await createPrescription({
          consultationId: consRes.consultationId,
          patientId: selectedPatientId,
          doctorId: doctorProfile.id,
          diagnosis,
          generalAdvice: advice,
          items: validItems,
        });

        if (!rxRes.success || !rxRes.prescriptionId) {
          throw new Error(rxRes.error || "Failed to create prescription");
        }

        rxId = rxRes.prescriptionId;

        // 3. Atomically publish prescription (syncs to medications & notifications)
        const pubRes = await publishPrescription(rxRes.prescriptionId);
        if (!pubRes.success) {
          throw new Error(pubRes.error || "Failed to publish prescription to patient app");
        }
        publishedCount = pubRes.publishedCount || validItems.length;
      }

      // 4. Schedule follow-up if checked
      if (scheduleFollowUp && calculatedFollowUpDate) {
        await createFollowUp({
          consultationId: consRes.consultationId,
          patientId: selectedPatientId,
          doctorId: doctorProfile.id,
          scheduledDate: calculatedFollowUpDate,
          reason: followUpReason || diagnosis,
          recommendedTests: selectedTests,
        });
      }

      // 5. Build print data payload
      const patientName =
        patientSnapshot?.full_name ||
        authorizedPatients.find((p) => p.patient_id === selectedPatientId)?.patient_name ||
        "Patient";

      const printPayload: PrescriptionPrintData = {
        doctor: {
          fullName: doctorProfile.full_name || "Dr. Medical Practitioner",
          bmdcRegNo: doctorProfile.bmdc_number || "N/A",
          specialty: doctorProfile.specialty || "General Medicine",
          qualifications: doctorProfile.qualifications || "MBBS",
          chamberName: (doctorProfile.chamber_info as any)?.clinic_name || undefined,
          chamberAddress: (doctorProfile.chamber_info as any)?.address || undefined,
        },
        patient: {
          fullName: patientName,
          age: patientSnapshot?.date_of_birth
            ? Math.floor((Date.now() - new Date(patientSnapshot.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
            : undefined,
          sex: patientSnapshot?.sex || undefined,
          patientCode: authorizedPatients.find((p) => p.patient_id === selectedPatientId)?.patient_code,
          serialNo: tokenParam || undefined,
        },
        consultation: {
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          chiefComplaints,
          clinicalFindings,
          diagnosis,
          advice,
          followUpDate: scheduleFollowUp ? calculatedFollowUpDate : undefined,
          recommendedTests: selectedTests,
        },
        prescription: {
          id: rxId || consRes.consultationId,
          items: validItems,
        },
      };

      setPrintData(printPayload);
      setSuccessData({
        consultationId: consRes.consultationId,
        prescriptionId: rxId,
        itemsPublished: publishedCount,
      });

      // Refresh list in background
      getDoctorConsultations(doctorProfile.id).then(setConsultations);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to open print view from consultation list
  const handleOpenPrintForExisting = (c: DetailedConsultation) => {
    if (!doctorProfile) return;
    const rx = c.prescriptions?.[0];
    const pData: PrescriptionPrintData = {
      doctor: {
        fullName: doctorProfile.full_name || "Doctor",
        bmdcRegNo: doctorProfile.bmdc_number || "N/A",
        specialty: doctorProfile.specialty || "Specialist",
        qualifications: doctorProfile.qualifications || "MBBS",
        chamberName: (doctorProfile.chamber_info as any)?.clinic_name || undefined,
        chamberAddress: (doctorProfile.chamber_info as any)?.address || undefined,
      },
      patient: {
        fullName: c.patient_name || "Patient",
      },
      consultation: {
        date: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        chiefComplaints: c.chief_complaints || undefined,
        clinicalFindings: c.clinical_findings || undefined,
        diagnosis: c.diagnosis || undefined,
        advice: c.advice || undefined,
      },
      prescription: {
        id: rx?.id || c.id,
        items: rx?.items || [],
      },
    };
    setPrintData(pData);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-emerald-600" />
            {mode === "writer" ? "Consultation Note & E-Prescription" : "Consultation History & E-Prescriptions"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {mode === "writer"
              ? "Draft structured clinical observations, cross-check allergens, prescribe medications, and sync directly to patient app."
              : "Past patient consultations, prescribed regimens, and printable electronic prescription records."}
          </p>
        </div>

        {mode === "list" ? (
          <Button
            size="sm"
            onClick={() => {
              setMode("writer");
              setSuccessData(null);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Consultation Note
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("list");
              setSuccessData(null);
            }}
            className="text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Consultations
          </Button>
        )}
      </div>

      {/* Success Modal / Banner */}
      {successData && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/40 p-6 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Consultation Saved & Prescription Published!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  Synced <strong>{successData.itemsPublished} active medication(s)</strong> directly to the patient's ChronicAI app and emitted a confirmation alert.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                onClick={() => setIsPrintModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Prescription Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMode("list");
                  setSuccessData(null);
                }}
                className="text-xs bg-white/80 dark:bg-card/80 border-emerald-300 dark:border-emerald-800"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: List of Consultations */}
      {mode === "list" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-card/40 animate-pulse border border-slate-200 dark:border-border" />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 p-8 backdrop-blur-md">
              <EmptyState
                icon={FileText}
                title="No Recorded Consultations"
                description="Completed patient consultation notes and published e-prescriptions will be archived here. Call a patient from the queue or click 'New Consultation Note' to begin."
                actionLabel="Draft First Note"
                onAction={() => setMode("writer")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {consultations.map((c) => {
                const rx = c.prescriptions?.[0];
                const rxCount = rx?.items?.length || 0;
                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {c.patient_name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Badge>
                        {rx?.published_at ? (
                          <Badge variant="success" className="text-[10px]">
                            Rx Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Note Only
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Diagnosis:</strong>{" "}
                          {c.diagnosis || "Unspecified"}
                        </span>
                        {rxCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Pill className="h-3 w-3" />
                            {rxCount} medication(s) prescribed
                          </span>
                        )}
                      </div>

                      {c.chief_complaints && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic">
                          "{c.chief_complaints}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPrintForExisting(c)}
                        className="text-xs font-semibold border-slate-200 dark:border-border"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                        View / Print Rx
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WRITER MODE: Consultation Note & Rx Builder */}
      {mode === "writer" && (
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Patient Selector & Clinical Header */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              1. Patient Selection & Clinical Vitals
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Patient (Active Access Grant Required)
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Authorized Patient --</option>
                  {authorizedPatients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.patient_name} ({p.patient_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Snapshot summary pill */}
              {isLoadingSnapshot ? (
                <div className="h-11 rounded-xl bg-slate-100 dark:bg-card animate-pulse border border-slate-200 dark:border-border" />
              ) : patientSnapshot ? (
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {patientSnapshot.full_name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sex: {patientSnapshot.sex || "N/A"} • Blood: {patientSnapshot.blood_group || "N/A"}
                    </span>
                  </div>
                  {patientSnapshot.allergies.length > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                        Known Allergies
                      </span>
                      <div className="flex flex-wrap gap-1 justify-end mt-0.5">
                        {patientSnapshot.allergies.map((a, i) => (
                          <Badge key={i} variant="destructive" className="text-[9px] px-1.5 py-0">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* 2. Structured Clinical Observations */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              2. Clinical Examination & Diagnosis
            </h2>

            {/* Chief Complaints */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chief Complaints (C/C)
              </label>
              <textarea
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                placeholder="e.g. Uncontrolled fasting blood glucose, morning dizziness, fatigue for 2 weeks..."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 self-center mr-1">Quick tags:</span>
                {QUICK_SYMPTOMS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setChiefComplaints((prev) => (prev ? `${prev}, ${s}` : s))
                    }
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-card dark:hover:bg-accent text-[10px] text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Findings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                On Examination (O/E & Findings)
              </label>
              <textarea
                value={clinicalFindings}
                onChange={(e) => setClinicalFindings(e.target.value)}
                placeholder="e.g. BP: 135/85 mmHg, Pulse: 76 bpm, BMI: 26.4 kg/m², Heart sounds: S1+S2 heard, Lungs: Clear bilaterally..."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Diagnosis + ICD-10 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnosis <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes Mellitus with Mild Neuropathy"
                  className="text-xs h-10"
                />
                {/* Common options */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_DIAGNOSES.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-[10px] text-emerald-800 dark:text-emerald-300 transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ICD-10 Code (Optional)
                </label>
                <Input
                  value={icd10}
                  onChange={(e) => setIcd10(e.target.value)}
                  placeholder="e.g. E11.9, I10"
                  className="text-xs h-10 font-mono"
                />
              </div>
            </div>

            {/* Advice & Lifestyle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Advice & Patient Instructions
              </label>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="e.g. 30 minutes brisk walking daily. Reduce dietary sodium and processed sugars. Maintain daily glucose log."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* 3. E-Prescription Builder with Allergen Cross-Check */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" />
                  3. Electronic Prescription (℞)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Medications prescribed here will immediately sync to the patient's active medication drawer upon publishing.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Medicine
              </Button>
            </div>

            {/* Dynamic Medication Cards */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const hasAllergyConflict = allergyConflicts.some((c) => c.index === index);
                const matchedAllergy = allergyConflicts.find((c) => c.index === index)?.allergyName;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${hasAllergyConflict
                      ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-700"
                      : "border-slate-200 dark:border-border bg-slate-50/50 dark:bg-card/50"
                      }`}
                  >
                    {/* Allergy Warning Banner */}
                    {hasAllergyConflict && (
                      <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Potential Allergen Conflict Detected</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Patient profile records allergy to: <strong>{matchedAllergy}</strong>. The prescribed medication or generic class matches this allergen.
                        </p>
                        <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!allergyOverrides[index]}
                            onChange={(e) =>
                              setAllergyOverrides((prev) => ({
                                ...prev,
                                [index]: e.target.checked,
                              }))
                            }
                            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[11px]">
                            Clinical Override: I have reviewed allergy risk and approve prescribing this drug.
                          </span>
                        </label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Drug Name */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Brand / Drug Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={item.medication_name}
                          onChange={(e) => handleUpdateItem(index, "medication_name", e.target.value)}
                          placeholder="e.g. Tab. Metformin"
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Generic Name */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Generic Name
                        </label>
                        <Input
                          value={item.generic_name || ""}
                          onChange={(e) => handleUpdateItem(index, "generic_name", e.target.value)}
                          placeholder="e.g. Metformin HCl"
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Strength */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Strength
                        </label>
                        <Input
                          value={item.strength || ""}
                          onChange={(e) => handleUpdateItem(index, "strength", e.target.value)}
                          placeholder="e.g. 500mg"
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Frequency
                        </label>
                        <select
                          value={item.frequency}
                          onChange={(e) => handleUpdateItem(index, "frequency", e.target.value)}
                          className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-medium text-slate-900 dark:text-white"
                        >
                          <option value="1+0+1">1 + 0 + 1 (Morning & Night)</option>
                          <option value="1+1+1">1 + 1 + 1 (Three times daily)</option>
                          <option value="1+0+0">1 + 0 + 0 (Morning only)</option>
                          <option value="0+0+1">0 + 0 + 1 (Night only)</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="As needed (PRN)">As needed (PRN)</option>
                        </select>
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Secondary row: Timing, Duration, Instructions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/50 dark:border-border/50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Timing / Instructions:</span>
                        <Input
                          value={item.instructions || ""}
                          onChange={(e) => handleUpdateItem(index, "instructions", e.target.value)}
                          placeholder="e.g. After meals with water"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Duration (Days):</span>
                        <Input
                          type="number"
                          value={item.duration_days || ""}
                          onChange={(e) => handleUpdateItem(index, "duration_days", Number(e.target.value) || undefined)}
                          placeholder="14"
                          className="h-8 text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Route:</span>
                        <select
                          value={item.route || "Oral"}
                          onChange={(e) => handleUpdateItem(index, "route", e.target.value)}
                          className="w-full h-8 px-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-medium text-slate-900 dark:text-white"
                        >
                          <option value="Oral">Oral (Tablet / Syrup)</option>
                          <option value="Subcutaneous">Subcutaneous (Insulin)</option>
                          <option value="Inhalation">Inhalation (Inhaler / Nebulizer)</option>
                          <option value="Topical">Topical (Ointment / Gel)</option>
                          <option value="IV">Intravenous (IV)</option>
                          <option value="IM">Intramuscular (IM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Follow-up & Lab Investigations Scheduler */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                4. Follow-up Review & Investigations
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFollowUp}
                  onChange={(e) => setScheduleFollowUp(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Schedule Follow-up Visit
              </label>
            </div>

            {scheduleFollowUp && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-border">
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 mr-2">Review in:</span>
                  {[
                    { label: "+7 Days", days: 7 },
                    { label: "+14 Days", days: 14 },
                    { label: "+1 Month", days: 30 },
                    { label: "+3 Months", days: 90 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setFollowUpDays(p.days);
                        setCustomFollowUpDate("");
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${followUpDays === p.days && !customFollowUpDate
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-card text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-400">Exact Date:</span>
                    <Input
                      type="date"
                      value={calculatedFollowUpDate}
                      onChange={(e) => {
                        setCustomFollowUpDate(e.target.value);
                        setFollowUpDays(null);
                      }}
                      className="h-8 text-xs w-36"
                    />
                  </div>
                </div>

                {/* Recommended Investigations */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recommended Lab Tests for Next Visit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_LAB_TESTS.map((test) => {
                      const isSelected = selectedTests.includes(test);
                      return (
                        <button
                          key={test}
                          type="button"
                          onClick={() => toggleTest(test)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${isSelected
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50 dark:bg-card text-slate-600 dark:text-slate-400 border-slate-200 dark:border-border hover:bg-slate-100"
                            }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {test}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submission Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("list")}
              className="w-full sm:w-auto"
            >
              Discard / Cancel
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                onClick={handleSaveAndPublish}
                disabled={isSubmitting || !selectedPatientId || !diagnosis.trim()}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md"
              >
                {isSubmitting ? (
                  "Publishing to Patient App..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Save & Publish to Patient App
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {printData && (
        <PrintablePrescription
          data={printData}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function DoctorConsultationsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-slate-100 dark:bg-card animate-pulse" />}>
      <ConsultationsContent />
    </Suspense>
  );
}
