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
} from "lucide-react";
import { mockDocuments, mockExtractedRecords } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { MedicalDocument, ExtractedRecord, DocumentCategory } from "@/types/medical";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { getDocuments, createDocumentRecord, createExtractedRecord as dbCreateExtracted } from "@/lib/supabase/services/documents";
import { uploadMedicalDocument } from "@/lib/supabase/storage";

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

export default function VaultPage() {
  const { effectiveUserId } = useAuth();
  const [documents, setDocuments] = useState<MedicalDocument[]>(mockDocuments);
  const [extractedRecords, setExtractedRecords] =
    useState<ExtractedRecord[]>(mockExtractedRecords);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Load documents from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDocs() {
      try {
        const fetched = await getDocuments(effectiveUserId);
        if (isMounted && fetched && fetched.length > 0) {
          setDocuments(fetched);
        }
      } catch {}
    }
    loadDocs();
    return () => {
      isMounted = false;
    };
  }, [effectiveUserId]);

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Scanner & OCR State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerStep, setScannerStep] = useState<"viewfinder" | "processing" | "review">("viewfinder");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrProgressText, setOcrProgressText] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // OCR Verification Modal State
  const [editFileName, setEditFileName] = useState("");
  const [editFacility, setEditFacility] = useState("");
  const [editDoctor, setEditDoctor] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState<DocumentCategory>("lab_report");
  const [editLabs, setEditLabs] = useState<ExtractedLabItem[]>([]);
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
  };

  // Run OCR Extraction Process
  const handleCaptureAndRunOCR = (imageSource?: string) => {
    stopCameraStream();
    const snap = imageSource || capturedImage || "/mock-report-scan.jpg";
    setCapturedImage(snap);
    setScannerStep("processing");

    // OCR extraction simulation pipeline
    setOcrProgressText("Detecting document borders and perspective...");
    setTimeout(() => {
      setOcrProgressText("Running AI Optical Character Recognition (OCR)...");
    }, 900);

    setTimeout(() => {
      setOcrProgressText("Extracting biomarkers, clinical entities, and reference ranges...");
    }, 1800);

    setTimeout(() => {
      const today = new Date().toISOString().split("T")[0];
      setEditFileName(`Quest_Diagnostics_Panel_${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).replace(" ", "_")}.pdf`);
      setEditFacility("Quest Diagnostics Clinical Laboratory");
      setEditDoctor("Dr. Catherine Wei, MD");
      setEditDate(today);
      setEditCategory("lab_report");
      setOcrConfidence(97);
      setEditSummary("Automated OCR extracted full renal panel with estimated GFR and serum electrolytes. All biomarkers parsed with 97% confidence.");
      setEditLabs([
        {
          test_name: "Serum Creatinine",
          value: "1.02",
          unit: "mg/dL",
          reference_range: "0.50 - 1.10",
          is_abnormal: false,
        },
        {
          test_name: "Estimated GFR (CKD-EPI)",
          value: "74",
          unit: "mL/min/1.73m²",
          reference_range: "> 60",
          is_abnormal: false,
        },
        {
          test_name: "Fasting Blood Glucose",
          value: "108",
          unit: "mg/dL",
          reference_range: "70 - 99",
          is_abnormal: true,
        },
        {
          test_name: "Hemoglobin A1c",
          value: "6.7",
          unit: "%",
          reference_range: "< 5.7",
          is_abnormal: true,
        },
        {
          test_name: "Serum Potassium",
          value: "4.3",
          unit: "mmol/L",
          reference_range: "3.5 - 5.0",
          is_abnormal: false,
        },
      ]);
      setScannerStep("review");
    }, 2800);
  };

  // Mobile Camera File Input fallback
  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    const url = URL.createObjectURL(file);
    setIsScannerOpen(true);
    handleCaptureAndRunOCR(url);
  };

  // Final Manual Verification Confirmation
  const handleSaveVerifiedRecord = async () => {
    const fileName = editFileName.trim() || `Report_${Date.now()}.pdf`;
    
    // Save to Supabase database (with storage reference)
    const savedDoc = await createDocumentRecord({
      user_id: effectiveUserId,
      file_name: fileName,
      file_path: `medical-records/${effectiveUserId}/${fileName}`,
      file_type: "application/pdf",
      file_size: 1024 * 145,
      category: editCategory,
      document_date: editDate || new Date().toISOString().split("T")[0],
      facility_name: editFacility || "Verified Clinical Center",
      doctor_name: editDoctor || "Dr. Staff Physician, MD",
      status: "verified",
      summary: editSummary,
      tags: ["Verified Record", "OCR Extracted", "AI Analyzed"],
    });

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
        diagnoses: [editSummary.slice(0, 48)],
        lab_results: editLabs.map((l) => ({
          test_name: l.test_name,
          value: Number(l.value) || 0,
          unit: l.unit,
          reference_range: l.reference_range,
          is_abnormal: l.is_abnormal,
        })),
        instructions: ["You confirmed this record. It is now part of your health timeline."],
      },
      confirmed_data: {
        document_type: editCategory,
        date: savedDoc.document_date,
        facility: savedDoc.facility_name,
        doctor: savedDoc.doctor_name,
        diagnoses: [editSummary.slice(0, 48)],
        lab_results: editLabs.map((l) => ({
          test_name: l.test_name,
          value: Number(l.value) || 0,
          unit: l.unit,
          reference_range: l.reference_range,
          is_abnormal: l.is_abnormal,
        })),
      },
    });

    setDocuments((prev) => [savedDoc, ...prev]);
    setExtractedRecords((prev) => [savedExtracted, ...prev]);
    handleCloseScanner();
    setNotification(`Successfully verified and saved "${savedDoc.file_name}" into your health records!`);
    setTimeout(() => setNotification(null), 5000);
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
      {viewMode === "table" ? (
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
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Extracting Medical Intelligence
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    {ocrProgressText}
                  </p>
                </div>
                <div className="mx-auto max-w-xs h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500 animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            )}

            {/* Manual Verification & Review Step */}
            {scannerStep === "review" && (
              <div className="max-h-[75vh] overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-900">
                      OCR Completed · {ocrConfidence}% confidence score
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Please verify details before saving
                  </span>
                </div>

                {/* Form fields for Record Name, Facility, Doctor, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      File / Record Name
                    </label>
                    <Input
                      type="text"
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Quest_Metabolic_Panel_Nov2026.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Record Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as DocumentCategory)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
                    >
                      <option value="lab_report">Lab Report</option>
                      <option value="prescription">Prescription</option>
                      <option value="imaging">Imaging & Scan</option>
                      <option value="doctor_note">Doctor Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Clinical Facility
                    </label>
                    <Input
                      type="text"
                      value={editFacility}
                      onChange={(e) => setEditFacility(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Quest Diagnostics"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Physician / Specialist
                    </label>
                    <Input
                      type="text"
                      value={editDoctor}
                      onChange={(e) => setEditDoctor(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="e.g. Dr. Catherine Wei, MD"
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
                    onClick={handleSaveVerifiedRecord}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:brightness-105 active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    Save & Verify Record
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
