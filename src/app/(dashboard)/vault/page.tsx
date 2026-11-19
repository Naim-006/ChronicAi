"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  LayoutGrid,
  Table as TableIcon,
  MoreVertical,
} from "lucide-react";
import { mockDocuments, mockExtractedRecords } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { MedicalDocument, DocumentCategory, ExtractedRecord } from "@/types/medical";

export default function VaultPage() {
  const [documents, setDocuments] = useState<MedicalDocument[]>(mockDocuments);
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>(mockExtractedRecords);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
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
        facility_name: "Quest Diagnostics Clinical Laboratory",
        doctor_name: "Dr. Catherine Wei, MD",
        status: "needs_review",
        summary: "Uploaded laboratory panel pending clinical biomarker confirmation.",
        tags: ["Recent Upload", "Needs Review"],
        created_at: new Date().toISOString(),
      };

      const newExtracted: ExtractedRecord = {
        id: `ext-${Date.now()}`,
        document_id: newDoc.id,
        user_id: "user-elena-vance",
        confidence_score: 0.94,
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
    }, 1000);
  };

  const handleConfirmVerification = () => {
    if (!activeReviewDoc || !reviewRecord) return;
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeReviewDoc.id ? { ...d, status: "verified" } : d))
    );
    setExtractedRecords((prev) =>
      prev.map((r) => (r.id === reviewRecord.id ? { ...r, status: "confirmed" } : r))
    );
    setActiveReviewDoc(null);
    setReviewRecord(null);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* 1. Header Bar with Upload & View Switcher (Matching Image 5 & Image 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Medical Document Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted storage and OCR biomarker extraction for verified medical records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Desktop View Switcher */}
          <div className="hidden sm:flex items-center rounded-2xl bg-white border border-slate-200/90 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === "cards" ? "bg-emerald-50 text-emerald-800" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === "table" ? "bg-emerald-50 text-emerald-800" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Table View (Image 5)"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          <label className="flex items-center gap-2 rounded-full bg-[#22C55E] hover:bg-[#16A34A] px-5 py-2 text-xs font-bold text-white shadow-md shadow-green-600/30 transition-all cursor-pointer active:scale-95">
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleSimulateUpload}
            />
          </label>
        </div>
      </div>

      {/* Upload Success Alert */}
      {uploadSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Document uploaded successfully! Please review the extracted biomarkers below.</span>
        </div>
      )}

      {/* Human-in-the-Loop OCR Verification Drawer */}
      {activeReviewDoc && reviewRecord && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/70 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700" />
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">
                  Verification Required: {activeReviewDoc.file_name}
                </h3>
                <span className="text-[11px] text-amber-800">
                  Automated OCR extracted {reviewRecord.raw_extracted.lab_results?.length || 0} biomarkers (Confidence: {(reviewRecord.confidence_score * 100).toFixed(0)}%).
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveReviewDoc(null)}
              className="text-amber-800 hover:text-amber-950 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Source Document Information
              </span>
              <span className="font-bold text-slate-900 block">{activeReviewDoc.file_name}</span>
              <span className="text-slate-500 block">
                {formatDate(activeReviewDoc.document_date)} · {activeReviewDoc.facility_name}
              </span>
              <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                {activeReviewDoc.summary}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Extracted Biomarkers & Diagnoses
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
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-xs font-bold text-white shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm Findings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Search & Category Filters (Image 2 & Image 5 Style) */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search records by document title, doctor, facility, or biomarker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors shrink-0"
          title="Filter Parameters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
        {[
          { id: "all", label: "All Documents" },
          { id: "lab_report", label: "Laboratory Reports" },
          { id: "prescription", label: "Prescriptions" },
          { id: "imaging", label: "Diagnostic Imaging" },
          { id: "doctor_note", label: "Clinical Notes" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? "bg-[#18261F] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Document Presentation: Table View (Image 5) OR Card View (Image 2 & 6) */}
      {viewMode === "table" ? (
        /* Image 5 Smile Labs / Lumino Table Layout */
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 text-[11px] font-extrabold uppercase">
                  <th className="py-3.5 pl-6">Name ↑</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Last Modified</th>
                  <th className="py-3.5 px-4">File Size</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc, idx) => {
                  const colors = [
                    "bg-rose-50 text-rose-600 border-rose-200",
                    "bg-purple-50 text-purple-600 border-purple-200",
                    "bg-blue-50 text-blue-600 border-blue-200",
                    "bg-emerald-50 text-emerald-600 border-emerald-200",
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-6 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass} shrink-0`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="block leading-tight">{doc.file_name.replace(".pdf", "").replace(/_/g, " ")}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{doc.facility_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">Elena Vance</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{formatDate(doc.document_date)}</td>
                      <td className="py-3.5 px-4 text-slate-500">{(doc.file_size / 1024).toFixed(0)} KB</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Verified
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReviewDoc(doc);
                              setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                            }}
                            className="p-1 hover:text-slate-800 transition-colors"
                            title="Inspect"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <a
                            href={doc.file_path}
                            download
                            className="p-1 hover:text-slate-800 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Image 2 & 6 Wide Rounded Document Cards */
        <div className="space-y-4">
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1 block">
              Recent Clinical Documentation
            </span>

            {filteredDocs.map((doc, idx) => {
              const isPending = doc.status === "needs_review";
              const colors = [
                "bg-rose-50 text-rose-600 border-rose-200",
                "bg-purple-50 text-purple-600 border-purple-200",
                "bg-blue-50 text-blue-600 border-blue-200",
                "bg-emerald-50 text-emerald-600 border-emerald-200",
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveReviewDoc(doc);
                    setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                  }}
                  className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${colorClass} shrink-0 shadow-2xs`}>
                      <FileText className="h-6 w-6 stroke-[2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                        </h3>
                        {isPending && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                            Needs Review
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5">
                        {doc.facility_name} · {doc.doctor_name}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {formatDate(doc.document_date)} · {(doc.file_size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
        </div>
      )}
    </div>
  );
}
