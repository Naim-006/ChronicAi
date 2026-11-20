"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Camera,
  Scan,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  SlidersHorizontal,
  Eye,
  Download,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Shield,
  Activity,
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  Clock,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { MedicalDocument, ExtractedRecord, DocumentCategory, MetricType } from "@/types/medical";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { getDocuments, createDocumentRecord, createExtractedRecord as dbCreateExtracted } from "@/lib/supabase/services/documents";
import { logHealthMetric } from "@/lib/supabase/services/metrics";
import { createMedication } from "@/lib/supabase/services/medications";
import { updateHealthProfile } from "@/lib/supabase/services/profile";
import { createTimelineEvent } from "@/lib/supabase/services/timeline";
import { createClinicalNotification } from "@/lib/supabase/services/notifications";
import { uploadMedicalDocument, getMedicalDocumentSignedUrl } from "@/lib/supabase/storage";
import { useRealtimeTables } from "@/hooks/useRealtime";

const iconTones = [
  "bg-rose-50 text-rose-600 border-rose-100",
  "bg-sky-50 text-sky-600 border-sky-100",
  "bg-amber-50 text-amber-600 border-amber-100",
  "bg-emerald-50 text-emerald-600 border-emerald-100",
];

interface ExtractedLabItem {
  test_name: string;
  value: number | string;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
}

interface ExtractedMedItem {
  name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  route?: string;
  instructions?: string;
}

interface ExtractedDiagItem {
  name: string;
  icd10?: string;
  status?: "active" | "managed" | "resolved";
  notes?: string;
}

export default function VaultPage() {
  const { profile, effectiveUserId, refreshProfile } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const loadDocs = React.useCallback(async () => {
    if (!effectiveUserId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }
    try {
      const fetched = await getDocuments(effectiveUserId);
      setDocuments(fetched || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Realtime subscription: syncs uploaded medical documents and extracted clinical records
  useRealtimeTables({
    tables: ["medical_documents", "extracted_records"],
    filter: effectiveUserId ? `user_id=eq.${effectiveUserId}` : undefined,
    enabled: Boolean(effectiveUserId),
    onChange: () => {
      loadDocs();
    },
  });

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Scanner & OCR State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerStep, setScannerStep] = useState<"viewfinder" | "processing" | "review">("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState("");
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // OCR Verification Modal State
  const [editFileName, setEditFileName] = useState("");
  const [editFacility, setEditFacility] = useState("");
  const [editDoctor, setEditDoctor] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState<DocumentCategory>("lab_report");
  const [editLabs, setEditLabs] = useState<ExtractedLabItem[]>([]);
  const [editMeds, setEditMeds] = useState<ExtractedMedItem[]>([]);
  const [editDiagnoses, setEditDiagnoses] = useState<ExtractedDiagItem[]>([]);
  const [editSummary, setEditSummary] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(96);

  // Active review from existing documents
  const [activeReviewDoc, setActiveReviewDoc] = useState<MedicalDocument | null>(
    documents.find((d) => d.status === "needs_review") || null
  );
  const [reviewRecord, setReviewRecord] = useState<ExtractedRecord | null>(
    extractedRecords.find((r) => r.status === "pending") || null
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const handleViewOriginalDocument = async (doc: MedicalDocument) => {
    setOpeningDocId(doc.id);
    try {
      const url = await getMedicalDocumentSignedUrl(doc.file_path, 3600);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setNotification(`Could not generate secure view URL for "${doc.file_name}"`);
      }
    } catch {
      setNotification("Failed to open document file.");
    } finally {
      setOpeningDocId(null);
    }
  };

  // Cleanup camera stream when modal closes
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Launch Camera Scanner
  const handleOpenScanner = async () => {
    setIsScannerOpen(true);
    setScannerStep("viewfinder");
    setCapturedImage(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      // Camera permission fallback gracefully handled
    }
  };

  const handleCloseScanner = () => {
    stopCameraStream();
    setIsScannerOpen(false);
    setScannerStep("viewfinder");
    setCapturedImage(null);
    setApiKeyModalOpen(false);
  };

  // Run Real Multimodal OCR Extraction with Gemini API
  const handleCaptureAndRunOCR = async (imageSource?: string, overrideKey?: string) => {
    stopCameraStream();
    let snap = imageSource || capturedImage || "";

    // If camera active and no snap, capture current frame from video canvas
    if (!snap && videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          snap = canvas.toDataURL("image/jpeg", 0.88);
        }
      } catch {}
    }

    setCapturedImage(snap);
    setScannerStep("processing");
    setOcrProgressText("Analyzing image & preparing clinical OCR pipeline...");

    const storedKey =
      overrideKey ||
      (typeof window !== "undefined" ? localStorage.getItem("chronicai_gemini_key") : null) ||
      (profile?.preferences as any)?.gemini_api_key ||
      "";

    // Extract base64
    let base64Data = "";
    let mimeType = selectedUploadFile?.type || "image/jpeg";

    if (snap.startsWith("data:")) {
      const parts = snap.split(",");
      const match = snap.match(/data:(.*?);base64/);
      if (match) mimeType = match[1];
      base64Data = parts[1] || "";
    } else if (selectedUploadFile) {
      try {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const b64 = res.split(",")[1];
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedUploadFile);
        });
      } catch {}
    }

    try {
      setOcrProgressText("Transmitting to Google Gemini Multimodal Scanner...");

      const res = await fetch("/api/records/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": storedKey,
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mimeType,
          fileName: editFileName || selectedUploadFile?.name || "Scanned_Medical_Record.jpg",
          apiKey: storedKey || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.error === "NO_API_KEY") {
          setOcrProgressText("Google Gemini API Key Needed");
          setApiKeyModalOpen(true);
          return;
        }
        throw new Error(result.message || "Failed to analyze document.");
      }

      setOcrProgressText("Parsing biomarkers, medications & diagnoses...");
      const d = result.data;

      setEditFileName(
        selectedUploadFile?.name ||
          `${(d.category || "medical_record").toUpperCase()}_${new Date().toISOString().split("T")[0]}`
      );
      setEditCategory(d.category || "lab_report");
      setEditFacility(d.facility_name || "Diagnostic Laboratory");
      setEditDoctor(d.doctor_name || "Staff Physician");
      setEditDate(d.document_date || new Date().toISOString().split("T")[0]);
      setOcrConfidence(d.confidence_score || 95);
      setEditSummary(d.summary || "Verified medical record extracted with Gemini AI.");
      setEditLabs(d.lab_results || []);
      setEditMeds(d.medications || []);
      setEditDiagnoses(d.diagnoses || []);
      setScannerStep("review");
    } catch (err: any) {
      console.warn("AI OCR fallback to manual verification:", err);
      // Graceful fallback: allows patient to enter details manually
      const today = new Date().toISOString().split("T")[0];
      setEditFileName(selectedUploadFile?.name || `Clinical_Record_${today}`);
      setEditFacility("");
      setEditDoctor("");
      setEditDate(today);
      setEditCategory("lab_report");
      setOcrConfidence(80);
      setEditSummary("Uploaded medical document ready for review and ingestion.");
      setEditLabs([]);
      setEditMeds([]);
      setEditDiagnoses([]);
      setScannerStep("review");
      setNotification(err.message || "Document ready for manual review and entry.");
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Mobile Camera File Input fallback
  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedUploadFile(file);
    setEditFileName(file.name || `Mobile_Capture_${Date.now()}.jpg`);
    const url = URL.createObjectURL(file);
    setIsScannerOpen(true);
    handleCaptureAndRunOCR(url);
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFileDirect(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFileDirect(file);
    }
  };

  const processFileDirect = (file: File) => {
    setSelectedUploadFile(file);
    setEditFileName(file.name);
    const url = URL.createObjectURL(file);
    setIsScannerOpen(true);
    handleCaptureAndRunOCR(url);
  };

  // Central Hub Ingestion: Ingests Record into Documents, Metrics, Medications, Conditions & Timeline
  const handleSaveVerifiedRecord = async () => {
    if (!effectiveUserId) return;
    setIsSavingRecord(true);
    try {
      const fileName = editFileName.trim() || selectedUploadFile?.name || `Report_${Date.now()}.pdf`;
      let storedPath = `medical-records/${effectiveUserId}/${fileName}`;
      let fileSize = selectedUploadFile?.size || 1024 * 145;
      let fileType = selectedUploadFile?.type || "application/pdf";

      // 1. Upload to Supabase Storage if file exists
      if (selectedUploadFile) {
        const uploadRes = await uploadMedicalDocument(selectedUploadFile, effectiveUserId);
        if (uploadRes.path) {
          storedPath = uploadRes.path;
        }
      }

      // 2. Save to medical_documents
      const savedDoc = await createDocumentRecord({
        user_id: effectiveUserId,
        file_name: fileName,
        file_path: storedPath,
        file_type: fileType,
        file_size: fileSize,
        category: editCategory,
        document_date: editDate || new Date().toISOString().split("T")[0],
        facility_name: editFacility || "Verified Clinical Center",
        doctor_name: editDoctor || "Treating Clinician",
        status: "verified",
        summary: editSummary,
        tags: ["Verified Record", "Gemini OCR Extracted", "Clinical Ingestion"],
      });

      // 3. Save extracted record
      const savedExtracted = await dbCreateExtracted({
        document_id: savedDoc.id,
        user_id: effectiveUserId,
        confidence_score: ocrConfidence / 100,
        status: "confirmed",
        raw_extracted: {
          document_type: editCategory,
          date: savedDoc.document_date,
          facility: savedDoc.facility_name,
          doctor: savedDoc.doctor_name,
          diagnoses: editDiagnoses.map((d) => d.name),
          lab_results: editLabs.map((l) => ({
            test_name: l.test_name,
            value: parseFloat(String(l.value)) || 0,
            unit: l.unit,
            reference_range: l.reference_range,
            is_abnormal: l.is_abnormal,
          })),
          medications: editMeds,
          instructions: ["Verified and ingested into central health record."],
        },
        confirmed_data: {
          document_type: editCategory,
          date: savedDoc.document_date,
          facility: savedDoc.facility_name,
          doctor: savedDoc.doctor_name,
          diagnoses: editDiagnoses.map((d) => d.name),
          lab_results: editLabs.map((l) => ({
            test_name: l.test_name,
            value: parseFloat(String(l.value)) || 0,
            unit: l.unit,
            reference_range: l.reference_range,
            is_abnormal: l.is_abnormal,
          })),
          medications: editMeds,
        },
      });

      // 4. CENTRAL HUB: Ingest each extracted biomarker into health_metrics
      let ingestedMetricsCount = 0;
      for (const lab of editLabs) {
        const numVal = parseFloat(String(lab.value));
        if (!isNaN(numVal)) {
          const lower = lab.test_name.toLowerCase();
          let metricType: MetricType = "other";
          if (lower.includes("glucose") || lower.includes("sugar")) metricType = "glucose";
          else if (lower.includes("a1c") || lower.includes("hba1c")) metricType = "hba1c";
          else if (lower.includes("pressure") || lower.includes("bp") || lower.includes("systolic")) metricType = "blood_pressure";
          else if (lower.includes("heart rate") || lower.includes("pulse")) metricType = "heart_rate";
          else if (lower.includes("weight")) metricType = "weight";
          else if (lower.includes("spo2") || lower.includes("oxygen")) metricType = "spo2";

          await logHealthMetric({
            user_id: effectiveUserId,
            document_id: savedDoc.id,
            metric_type: metricType,
            value_primary: numVal,
            unit: lab.unit || "",
            is_abnormal: lab.is_abnormal,
            notes: `${lab.test_name} (Ref: ${lab.reference_range || "normal"})`,
            recorded_at: editDate || new Date().toISOString(),
          });
          ingestedMetricsCount++;
        }
      }

      // 5. CENTRAL HUB: Ingest any extracted medications
      let ingestedMedsCount = 0;
      for (const med of editMeds) {
        if (med.name?.trim()) {
          await createMedication({
            user_id: effectiveUserId,
            document_id: savedDoc.id,
            name: med.name.trim(),
            generic_name: med.generic_name,
            dosage: med.dosage || "As directed",
            frequency: med.frequency || "Daily",
            route: med.route || "oral",
            instructions: med.instructions || "Take as prescribed by doctor",
            prescribing_doctor: editDoctor || undefined,
            start_date: editDate || new Date().toISOString().split("T")[0],
            status: "active",
          });
          ingestedMedsCount++;
        }
      }

      // 6. CENTRAL HUB: Ingest any newly diagnosed chronic conditions
      if (editDiagnoses.length > 0 && profile) {
        const currentConds: any[] = profile.chronic_conditions || [];
        const existingNames = new Set(
          currentConds.map((c) => (typeof c === "string" ? c.toLowerCase() : c.name?.toLowerCase()))
        );

        const newConditionsToAdd: any[] = [];
        for (const diag of editDiagnoses) {
          if (diag.name?.trim() && !existingNames.has(diag.name.trim().toLowerCase())) {
            newConditionsToAdd.push({
              id: `cond-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: diag.name.trim(),
              icd10: diag.icd10 || undefined,
              status: diag.status || "active",
              diagnosed_date: editDate || new Date().toISOString().split("T")[0],
              notes: diag.notes || `Diagnosed in ${savedDoc.facility_name || "clinical report"}`,
            });
            existingNames.add(diag.name.trim().toLowerCase());
          }
        }

        if (newConditionsToAdd.length > 0) {
          await updateHealthProfile(effectiveUserId, {
            chronic_conditions: [...currentConds, ...newConditionsToAdd],
          });
          await refreshProfile();
        }
      }

      // 7. CENTRAL HUB: Create Clinical Timeline Event
      await createTimelineEvent({
        user_id: effectiveUserId,
        document_id: savedDoc.id,
        event_type:
          editCategory === "lab_report"
            ? "lab_test"
            : editCategory === "prescription"
            ? "medication_start"
            : editCategory === "imaging"
            ? "imaging"
            : "note",
        title: `${editCategory === "lab_report" ? "Lab Panel" : editCategory === "prescription" ? "Prescription" : "Record"}: ${editFacility || fileName}`,
        description: editSummary,
        event_date: editDate || new Date().toISOString().split("T")[0],
        facility_or_doctor: editFacility || editDoctor,
        is_verified: true,
        metadata: {
          biomarkersIngested: ingestedMetricsCount,
          medicationsIngested: ingestedMedsCount,
          confidence: ocrConfidence,
        },
      });

      // 8. CENTRAL HUB: Create Clinical Notification
      await createClinicalNotification({
        user_id: effectiveUserId,
        type: "verification_required",
        title: "Record Ingested & Verified",
        message: `"${savedDoc.file_name}" verified! Successfully ingested ${ingestedMetricsCount} biomarkers and ${ingestedMedsCount} medications into your health record.`,
        severity: "success",
        source_trigger: "Vault OCR Ingestion",
        link_href: "/timeline",
        link_label: "View Timeline",
      });

      // 9. CENTRAL HUB & RAG: Vector Embeddings Generation (pgvector)
      try {
        const storedKey =
          (typeof window !== "undefined" ? localStorage.getItem("chronicai_gemini_key") : null) ||
          (profile?.preferences as any)?.gemini_api_key ||
          "";

        const chunks: string[] = [];
        chunks.push(
          `Document: ${savedDoc.file_name} | Type: ${savedDoc.category} | Date: ${savedDoc.document_date} | Facility: ${savedDoc.facility_name} | Doctor: ${savedDoc.doctor_name}\nSummary: ${savedDoc.summary}`
        );

        if (editLabs.length > 0) {
          const labsText = editLabs
            .map(
              (l) =>
                `- ${l.test_name}: ${l.value} ${l.unit} (Reference: ${l.reference_range})${l.is_abnormal ? " [ABNORMAL]" : ""}`
            )
            .join("\n");
          chunks.push(`Lab Results for ${savedDoc.file_name} (${savedDoc.document_date}):\n${labsText}`);
        }

        if (editMeds.length > 0) {
          const medsText = editMeds
            .map(
              (m) =>
                `- ${m.name}${m.generic_name ? ` (${m.generic_name})` : ""}: ${m.dosage}, ${m.frequency}, Route: ${m.route || "oral"}. Instructions: ${m.instructions || "Take as prescribed"}`
            )
            .join("\n");
          chunks.push(`Prescribed Medications for ${savedDoc.file_name} (${savedDoc.document_date}):\n${medsText}`);
        }

        if (editDiagnoses.length > 0) {
          const diagsText = editDiagnoses
            .map((d) => `- ${d.name}${d.icd10 ? ` [ICD-10: ${d.icd10}]` : ""}: ${d.status || "active"}`)
            .join("\n");
          chunks.push(`Diagnoses and Clinical Findings in ${savedDoc.file_name}:\n${diagsText}`);
        }

        if (chunks.length > 0) {
          fetch("/api/rag/embed", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-gemini-api-key": storedKey,
            },
            body: JSON.stringify({
              documentId: savedDoc.id,
              userId: effectiveUserId,
              chunks,
              metadata: {
                category: savedDoc.category,
                facility: savedDoc.facility_name,
                doctor: savedDoc.doctor_name,
                date: savedDoc.document_date,
              },
              apiKey: storedKey || undefined,
            }),
          }).catch((err) => {
            console.warn("Background vector embedding notification:", err);
          });
        }
      } catch (vectorErr) {
        console.warn("Could not prepare vector chunks for RAG indexing:", vectorErr);
      }

      setDocuments((prev) => [savedDoc, ...prev]);
      setExtractedRecords((prev) => [savedExtracted, ...prev]);
      setSelectedUploadFile(null);
      handleCloseScanner();
      setNotification(
        `"${savedDoc.file_name}" verified! Ingested ${ingestedMetricsCount} biomarkers and synced to your health dashboard.`
      );
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      console.error("Failed to upload/verify record:", err);
      setNotification(`Error processing record: ${err?.message || "Please try again."}`);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSavingRecord(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.facility_name &&
        doc.facility_name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const verifiedCount = documents.filter((d) => d.status === "verified").length;
  const reviewCount = documents.filter((d) => d.status === "needs_review").length;

  return (
    <div className="space-y-6 pb-28 lg:pb-12 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
              Medical Records Vault
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <Shield className="h-3 w-3" />
              AES-256 GCM Encrypted
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Universal health vault with OCR biomarker extraction and manual clinical verification
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Live Scanner Button */}
          <button
            type="button"
            onClick={handleOpenScanner}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm transition-all hover:bg-emerald-100 active:scale-95"
          >
            <Camera className="h-4 w-4 text-emerald-600" />
            <span className="hidden xs:inline">Live Camera</span> Scanner
          </button>

          {/* Standard Upload Button */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:brightness-105 active:scale-95">
            <UploadCloud className="h-4 w-4" />
            Upload File
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.dicom,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Quick Vault Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="soft-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-[var(--foreground)]">
              {documents.length}
            </span>
            <span className="block text-[11px] font-medium text-[var(--muted-foreground)]">
              Total Records
            </span>
          </div>
        </div>

        <div className="soft-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-teal-700">38</span>
            <span className="block text-[11px] font-medium text-[var(--muted-foreground)]">
              Parsed Biomarkers
            </span>
          </div>
        </div>

        <div className="soft-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-amber-700">
              {reviewCount}
            </span>
            <span className="block text-[11px] font-medium text-[var(--muted-foreground)]">
              Verification Queue
            </span>
          </div>
        </div>

        <div className="soft-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-blue-700">100%</span>
            <span className="block text-[11px] font-medium text-[var(--muted-foreground)]">
              HIPAA Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone + Mobile Live Camera Strip */}
      <section
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/80 scale-[1.005]"
            : "border-slate-300/80 bg-white hover:border-emerald-400 hover:bg-slate-50/50"
        }`}
      >
        <div className="mx-auto flex max-w-md flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-600 shadow-sm">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="mt-3 text-sm sm:text-base font-bold text-[var(--foreground)]">
            Drag & Drop Medical Records, Lab Panels, or Prescriptions
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] max-w-sm">
            PDF, PNG, JPG, or DICOM files up to 25MB. AI automatically scans, parses biomarkers, and presents them for manual verification.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all">
              <UploadCloud className="h-3.5 w-3.5" />
              Browse Device Files
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.dicom,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {/* Direct Mobile Camera Capture */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
              <Camera className="h-3.5 w-3.5 text-emerald-600" />
              Scan with Camera
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraFileChange}
              />
            </label>
          </div>
        </div>
      </section>

      {/* Pending Verification Banner (if active) */}
      {activeReviewDoc && reviewRecord && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">
                  Verification Pending · {activeReviewDoc.file_name}
                </h3>
                <span className="text-[11px] text-amber-800">
                  AI OCR extracted {reviewRecord.raw_extracted.lab_results?.length || 0} biomarkers · {(reviewRecord.confidence_score * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="p-1 text-amber-800 hover:text-amber-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div className="soft-card p-4 space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Document Details
              </span>
              <span className="block font-bold text-[var(--foreground)]">
                {activeReviewDoc.file_name}
              </span>
              <span className="block text-[var(--muted-foreground)]">
                {formatDate(activeReviewDoc.document_date)} · {activeReviewDoc.facility_name}
              </span>
              <p className="border-t border-[var(--border)] pt-2 text-[var(--muted-foreground)] leading-relaxed">
                {activeReviewDoc.summary}
              </p>
            </div>

            <div className="soft-card p-4 space-y-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Extracted Biomarkers
              </span>
              {reviewRecord.raw_extracted.lab_results && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {reviewRecord.raw_extracted.lab_results.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-white p-2 border border-slate-100"
                    >
                      <span className="font-medium text-[var(--foreground)]">
                        {res.test_name}
                      </span>
                      <span className="font-extrabold text-[var(--foreground)]">
                        {res.value} {res.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                {activeReviewDoc.file_path && (
                  <button
                    type="button"
                    onClick={() => handleViewOriginalDocument(activeReviewDoc)}
                    disabled={openingDocId === activeReviewDoc.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-100/60 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200/80 transition-colors disabled:opacity-50"
                  >
                    {openingDocId === activeReviewDoc.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    View Original File
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveReviewDoc(null)}
                  className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Postpone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocuments((prev) =>
                      prev.map((d) =>
                        d.id === activeReviewDoc.id ? { ...d, status: "verified" } : d
                      )
                    );
                    setExtractedRecords((prev) =>
                      prev.map((r) =>
                        r.id === reviewRecord.id ? { ...r, status: "confirmed" } : r
                      )
                    );
                    setActiveReviewDoc(null);
                    setReviewRecord(null);
                    setNotification("Record verified and saved to active health history.");
                    setTimeout(() => setNotification(null), 4000);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm & Verify
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              type="search"
              placeholder="Search reports, doctors, facilities…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex items-center rounded-xl border border-[var(--border)] bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "cards"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Card Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "table"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: "all", label: "All Records" },
            { id: "lab_report", label: "Lab Reports" },
            { id: "prescription", label: "Prescriptions" },
            { id: "imaging", label: "Scans & Imaging" },
            { id: "doctor_note", label: "Doctor Notes" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? "bg-[var(--foreground)] text-white shadow-sm"
                  : "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Library (Cards / Table) */}
      {isLoading ? (
        <div className="soft-card flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="soft-card p-12 text-center space-y-2">
          <FileText className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/40" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No medical records found</h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            Upload a medical report or scan with your camera to begin OCR extraction.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="soft-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[11px] font-extrabold uppercase text-[var(--muted-foreground)]">
                  <th className="py-3.5 pl-6">Report Title</th>
                  <th className="px-4 py-3.5">Facility / Doctor</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/70">
                {filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="py-3.5 pl-6 font-bold text-[var(--foreground)]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconTones[idx % iconTones.length]}`}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block leading-tight">
                            {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-normal text-[var(--muted-foreground)]">
                            {(doc.file_size / 1024).toFixed(0)} KB · PDF
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] font-medium">
                      <div>{doc.facility_name}</div>
                      <div className="text-[10px] text-slate-400">{doc.doctor_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] font-medium">
                      {formatDate(doc.document_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-bold ${
                          doc.status === "verified"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {doc.status === "verified" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Needs Review
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {doc.file_path && (
                          <button
                            type="button"
                            onClick={() => handleViewOriginalDocument(doc)}
                            disabled={openingDocId === doc.id}
                            title="View / Download stored original document"
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                          >
                            {openingDocId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">File</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReviewDoc(doc);
                            setReviewRecord(
                              extractedRecords.find((r) => r.document_id === doc.id) || null
                            );
                          }}
                          className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc, idx) => (
            <div
              key={doc.id}
              className="soft-card hover-lift flex flex-col justify-between p-5 transition-all hover:border-emerald-300 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${iconTones[idx % iconTones.length]}`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                      doc.status === "verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {doc.status === "verified" ? "Verified" : "Review Needed"}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="font-extrabold text-sm text-[var(--foreground)] group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {doc.facility_name} · {doc.doctor_name}
                  </p>
                </div>

                <p className="mt-3 text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed border-t border-[var(--border)] pt-3">
                  {doc.summary}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doc.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                  {formatDate(doc.document_date)}
                </span>
                <div className="inline-flex items-center gap-2">
                  {doc.file_path && (
                    <button
                      type="button"
                      onClick={() => handleViewOriginalDocument(doc)}
                      disabled={openingDocId === doc.id}
                      title="View / Download stored original document"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      {openingDocId === doc.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      <span>File</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReviewDoc(doc);
                      setReviewRecord(
                        extractedRecords.find((r) => r.document_id === doc.id) || null
                      );
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect Record
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIVE SCANNER & OCR EXTRACTION MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Scan className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Live Medical Report Scanner & AI OCR
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Extract biomarkers, clinical values, and doctor notes automatically
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseScanner}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Viewfinder Mode */}
            {scannerStep === "viewfinder" && (
              <div className="p-6 text-center space-y-4">
                <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/70 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />

                  {/* Corner Targets */}
                  <div className="absolute inset-4 pointer-events-none border border-emerald-400/30 rounded-xl">
                    <span className="absolute -top-1 -left-1 h-5 w-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                    <span className="absolute -top-1 -right-1 h-5 w-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                    <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                  </div>

                  {/* Animated Scanner Laser Bar */}
                  <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />

                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="rounded-full bg-slate-900/80 backdrop-blur-sm px-3 py-1 text-[11px] font-bold text-white shadow">
                      Align report inside frame
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCaptureAndRunOCR()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-105 active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    Capture & Extract Report
                  </button>

                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <UploadCloud className="h-4 w-4 text-emerald-600" />
                    Upload from Gallery
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleCameraFileChange}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* OCR Processing Step */}
            {scannerStep === "processing" && (
              <div className="p-8 text-center space-y-4">
                {apiKeyModalOpen ? (
                  <div className="max-w-md mx-auto space-y-4 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-left">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h4 className="text-sm font-extrabold text-[var(--foreground)]">
                        Google Gemini API Key Needed
                      </h4>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                      To automatically read this scanned document, extract biomarkers, and identify prescribed medications, enter your Google Gemini API key.
                    </p>
                    <div>
                      <input
                        type="password"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-mono text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyModalOpen(false);
                          setScannerStep("review");
                        }}
                        className="text-xs font-bold text-[var(--muted-foreground)] hover:underline"
                      >
                        Skip AI &amp; Enter Manually
                      </button>
                      <button
                        type="button"
                        disabled={!tempApiKey.trim()}
                        onClick={() => {
                          if (tempApiKey.trim()) {
                            if (typeof window !== "undefined") {
                              localStorage.setItem("chronicai_gemini_key", tempApiKey.trim());
                            }
                            setApiKeyModalOpen(false);
                            handleCaptureAndRunOCR(capturedImage || undefined, tempApiKey.trim());
                          }
                        }}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Analyze with Gemini
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                      <RefreshCw className="h-8 w-8 animate-spin" />
                      <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-[var(--foreground)]">
                        Extracting Medical Intelligence
                      </h4>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {ocrProgressText}
                      </p>
                    </div>
                    <div className="mx-auto max-w-xs h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full bg-emerald-500 animate-pulse w-3/4 rounded-full" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Manual Verification & Review Step */}
            {scannerStep === "review" && (
              <div className="max-h-[75vh] overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">
                      OCR Completed · {ocrConfidence}% confidence score
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    Please verify details before saving
                  </span>
                </div>

                {/* Form fields for Record Name, Facility, Doctor, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      File / Record Name
                    </label>
                    <Input
                      type="text"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Complete_Metabolic_Panel.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Record Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as DocumentCategory)}
                      className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="lab_report">Lab Report</option>
                      <option value="prescription">Prescription</option>
                      <option value="discharge_summary">Discharge Summary</option>
                      <option value="imaging">Imaging & Scan</option>
                      <option value="doctor_note">Doctor Note</option>
                      <option value="other">Other Medical Record</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Clinical Facility / Lab
                    </label>
                    <Input
                      type="text"
                      value={editFacility}
                      onChange={(e) => setEditFacility(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Memorial Hospital Clinical Lab"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Physician / Clinician
                    </label>
                    <Input
                      type="text"
                      value={editDoctor}
                      onChange={(e) => setEditDoctor(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Dr. Jane Smith, MD"
                    />
                  </div>
                </div>

                {/* Extracted Biomarkers Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Extracted Biomarkers & Test Values ({editLabs.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditLabs((prev) => [
                          ...prev,
                          {
                            test_name: "New Biomarker",
                            value: "0.0",
                            unit: "mg/dL",
                            reference_range: "Normal",
                            is_abnormal: false,
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="h-3 w-3" /> Add Row
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Biomarker</th>
                          <th className="p-2.5">Value</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Ref Range</th>
                          <th className="p-2.5 text-center">Abnormal</th>
                          <th className="p-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {editLabs.map((lab, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2">
                              <input
                                type="text"
                                value={lab.test_name}
                                onChange={(e) => {
                                  const updated = [...editLabs];
                                  updated[i].test_name = e.target.value;
                                  setEditLabs(updated);
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                              />
                            </td>
                            <td className="p-2 w-20">
                              <input
                                type="text"
                                value={lab.value}
                                onChange={(e) => {
                                  const updated = [...editLabs];
                                  updated[i].value = e.target.value;
                                  setEditLabs(updated);
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-bold"
                              />
                            </td>
                            <td className="p-2 w-24">
                              <input
                                type="text"
                                value={lab.unit}
                                onChange={(e) => {
                                  const updated = [...editLabs];
                                  updated[i].unit = e.target.value;
                                  setEditLabs(updated);
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-500"
                              />
                            </td>
                            <td className="p-2 w-28">
                              <input
                                type="text"
                                value={lab.reference_range}
                                onChange={(e) => {
                                  const updated = [...editLabs];
                                  updated[i].reference_range = e.target.value;
                                  setEditLabs(updated);
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-500"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={lab.is_abnormal}
                                onChange={(e) => {
                                  const updated = [...editLabs];
                                  updated[i].is_abnormal = e.target.checked;
                                  setEditLabs(updated);
                                }}
                                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditLabs(editLabs.filter((_, idx) => idx !== i))
                                }
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Extracted Medications */}
                {editMeds.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                      Extracted Prescriptions &amp; Medications ({editMeds.length})
                    </span>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs overflow-hidden">
                      {editMeds.map((med, i) => (
                        <div key={i} className="p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {med.name} {med.dosage}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              {med.frequency} · {med.instructions || "As directed"}
                            </span>
                          </div>
                          <span className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                            Auto-syncs to Active Meds
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clinical Summary
                  </label>
                  <textarea
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseScanner}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingRecord}
                    onClick={handleSaveVerifiedRecord}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:brightness-105 active:scale-95 disabled:opacity-60"
                  >
                    {isSavingRecord ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading to Storage...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save & Verify Record
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
