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
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Medical Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {documents.length} encrypted documents preserved.
          </p>
        </div>

        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleSimulateUpload}
            disabled={isUploading}
          />
          <div className="flex items-center gap-1.5 rounded-full bg-teal-800 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-teal-900 active:scale-95 transition-all">
            <Plus className="h-3.5 w-3.5" />
            <span>{isUploading ? "Uploading..." : "Upload"}</span>
          </div>
        </label>
      </div>

      {uploadSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          File successfully uploaded! Extracted records ready for review.
        </div>
      )}

      {/* Human-In-The-Loop Verification Modal / Sheet (if active) */}
      {activeReviewDoc && reviewRecord && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Review Extracted Findings
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

          <div className="text-xs text-slate-700 space-y-2">
            <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-1.5">
              <span className="font-bold text-slate-900 block truncate">
                {activeReviewDoc.file_name}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {formatDate(activeReviewDoc.document_date)} • {activeReviewDoc.facility_name}
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
                {activeReviewDoc.summary}
              </p>
            </div>

            {reviewRecord.raw_extracted.diagnoses && (
              <div className="bg-white rounded-xl p-3 border border-amber-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Extracted Diagnoses
                </span>
                <span className="font-semibold text-teal-900 text-xs">
                  {reviewRecord.raw_extracted.diagnoses.join(", ")}
                </span>
              </div>
            )}

            {reviewRecord.raw_extracted.lab_results && reviewRecord.raw_extracted.lab_results.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-amber-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Extracted Lab Measurements
                </span>
                {reviewRecord.raw_extracted.lab_results.map((res, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="text-slate-700">{res.test_name}</span>
                    <span className="font-bold text-slate-900">{res.value} {res.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-50"
            >
              Postpone
            </button>
            <button
              type="button"
              onClick={handleConfirmVerification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 text-xs font-semibold text-white shadow-xs hover:bg-teal-900"
            >
              <Check className="h-3.5 w-3.5" />
              Verify & Save to Timeline
            </button>
          </div>
        </div>
      )}

      {/* Search Input & Scrollable Category Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search records, doctors, test names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Records" },
            { id: "lab_report", label: "Lab Reports" },
            { id: "prescription", label: "Prescriptions" },
            { id: "imaging", label: "Cardio & Imaging" },
            { id: "doctor_note", label: "Consult Notes" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-teal-800 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Library List (Compact Grouped Style) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredDocs.map((doc) => {
          const isPending = doc.status === "needs_review";
          return (
            <div
              key={doc.id}
              onClick={() => {
                setActiveReviewDoc(doc);
                setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
              }}
              className="flex items-center justify-between p-3.5 sm:px-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                    isPending ? "bg-amber-100 text-amber-800" : "bg-teal-50 text-teal-800"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {doc.file_name}
                    </span>
                    {isPending && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        Needs Review
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {formatDate(doc.document_date)} • {doc.facility_name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-2">
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-slate-400">
                  {doc.category.replace("_", " ")}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
