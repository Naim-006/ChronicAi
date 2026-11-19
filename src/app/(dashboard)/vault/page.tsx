"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  UploadCloud,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  FileCheck,
  Calendar,
  Building,
  User,
  Check,
  Plus,
  SlidersHorizontal,
  Users,
  Eye,
  Download,
} from "lucide-react";
import { mockDocuments, mockExtractedRecords } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { MedicalDocument, DocumentCategory, ExtractedRecord } from "@/types/medical";

export default function VaultPage() {
  const [documents, setDocuments] = useState<MedicalDocument[]>(mockDocuments);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>(mockExtractedRecords);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeReviewDoc, setActiveReviewDoc] = useState<MedicalDocument | null>(
    documents.find((d) => d.status === "needs_review") || null
  );
  const [reviewRecord, setReviewRecord] = useState<ExtractedRecord | null>(
    extractedRecords.find((r) => r.status === "pending") || null
  );

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (doc.facility_name && doc.facility_name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.summary && doc.summary.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: MedicalDocument = {
        id: `doc-${Date.now()}`,
        user_id: "user-elena-vance",
        file_name: file.name,
        file_path: `/vault/${file.name}`,
        file_type: file.type || "application/pdf",
        file_size: file.size,
        category: "lab_report",
        document_date: new Date().toISOString().split("T")[0],
        facility_name: "Diagnostic Medical Imaging Center",
        doctor_name: "Dr. Catherine Wei, MD",
        status: "needs_review",
        summary: "Uploaded medical document awaiting user extraction confirmation.",
        tags: ["Recent Upload", "Needs Review"],
        created_at: new Date().toISOString(),
      };

      const newExtracted: ExtractedRecord = {
        id: `ext-${Date.now()}`,
        document_id: newDoc.id,
        user_id: "user-elena-vance",
        confidence_score: 0.92,
        status: "pending",
        raw_extracted: {
          document_type: "lab_report",
          date: newDoc.document_date,
          facility: newDoc.facility_name,
          doctor: newDoc.doctor_name,
          diagnoses: ["Routine Lab Panel Verification"],
          lab_results: [
            {
              test_name: "Serum Creatinine",
              value: 1.05,
              unit: "mg/dL",
              reference_range: "0.50 - 1.10",
              is_abnormal: false,
            },
            {
              test_name: "Estimated GFR",
              value: 70,
              unit: "mL/min/1.73m2",
              reference_range: "> 60",
              is_abnormal: false,
            },
          ],
          instructions: ["Continue current hydration and ACE inhibitor regimen."],
        },
        created_at: new Date().toISOString(),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setExtractedRecords((prev) => [newExtracted, ...prev]);
      setActiveReviewDoc(newDoc);
      setReviewRecord(newExtracted);
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1200);
  };

  const handleConfirmVerification = () => {
    if (!activeReviewDoc || !reviewRecord) return;

    setDocuments((prev) =>
      prev.map((d) => (d.id === activeReviewDoc.id ? { ...d, status: "verified" as const } : d))
    );

    setExtractedRecords((prev) =>
      prev.map((r) =>
        r.id === reviewRecord.id
          ? { ...r, status: "confirmed" as const, reviewed_at: new Date().toISOString() }
          : r
      )
    );

    setActiveReviewDoc(null);
    setReviewRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header (Inspired by Image 2 & 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Medical Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted storage safeguarding your lifelong medical reports, tests, and prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleSimulateUpload}
              disabled={isUploading}
            />
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
              <UploadCloud className="h-4 w-4" />
              <span>{isUploading ? "Processing..." : "Upload Document"}</span>
            </div>
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Document uploaded and parsed! Please review findings below.
        </div>
      )}

      {/* Human-in-the-Loop Review Sheet (if document needs review) */}
      {activeReviewDoc && reviewRecord && (
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/40 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700" />
              <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                Verification Required: Human-in-the-Loop
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2">
              <span className="font-extrabold text-slate-900 block text-sm">
                {activeReviewDoc.file_name}
              </span>
              <span className="text-slate-500 block">
                {formatDate(activeReviewDoc.document_date)} • {activeReviewDoc.facility_name}
              </span>
              <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                {activeReviewDoc.summary}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Extracted Clinical Biomarkers
              </span>

              {reviewRecord.raw_extracted.diagnoses && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200">
                  {reviewRecord.raw_extracted.diagnoses.join(", ")}
                </div>
              )}

              {reviewRecord.raw_extracted.lab_results && (
                <div className="space-y-1.5">
                  {reviewRecord.raw_extracted.lab_results.map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-700 font-medium">{res.test_name}</span>
                      <span className="font-extrabold text-slate-900">{res.value} {res.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReviewDoc(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Postpone
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm Findings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Input with Filter Icon (Exact design from Image 2 & 6) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search records by title, doctor, or biomarker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs shrink-0"
          title="Filter Options"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        {[
          { id: "all", label: "All Documents" },
          { id: "lab_report", label: "Lab Reports" },
          { id: "prescription", label: "Prescriptions" },
          { id: "imaging", label: "ECG & Scans" },
          { id: "doctor_note", label: "Clinical Notes" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grouped Document Cards (Design from Image 2 & Image 6) */}
      <div className="space-y-4">
        {/* Date Group Header */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
            November 2026
          </span>

          {filteredDocs.slice(0, 3).map((doc) => {
            const isPending = doc.status === "needs_review";
            return (
              <div
                key={doc.id}
                onClick={() => {
                  setActiveReviewDoc(doc);
                  setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                }}
                className="rounded-3xl bg-white border border-slate-100/90 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-xs ${
                      isPending
                        ? "bg-amber-100 text-amber-800"
                        : doc.category === "prescription"
                        ? "bg-teal-50 text-teal-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <FileText className="h-6 w-6 stroke-[2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                      </h3>
                      {isPending && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {doc.facility_name} • {doc.doctor_name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDate(doc.document_date)} • {(doc.file_size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Verified
                  </span>

                  <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <span className="text-xs font-bold hidden sm:inline">Inspect</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Older Records Date Group Header */}
        {filteredDocs.length > 3 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
              Earlier Records (August - May 2026)
            </span>

            {filteredDocs.slice(3).map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setActiveReviewDoc(doc);
                  setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                }}
                className="rounded-3xl bg-white border border-slate-100/90 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 shrink-0">
                    <FileText className="h-6 w-6 stroke-[2]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">
                      {doc.facility_name} • {doc.doctor_name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatDate(doc.document_date)} • {(doc.file_size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Archived
                  </span>

                  <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <span className="text-xs font-bold hidden sm:inline">Inspect</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
