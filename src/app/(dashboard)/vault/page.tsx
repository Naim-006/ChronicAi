"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Check,
  SlidersHorizontal,
  Eye,
  Download,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { mockDocuments, mockExtractedRecords } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { MedicalDocument, ExtractedRecord } from "@/types/medical";
import { Input } from "@/components/ui/input";

const iconTones = [
  "bg-rose-50 text-rose-600 border-rose-100",
  "bg-sky-50 text-sky-600 border-sky-100",
  "bg-amber-50 text-amber-600 border-amber-100",
  "bg-emerald-50 text-emerald-600 border-emerald-100",
];

export default function VaultPage() {
  const [documents, setDocuments] = useState<MedicalDocument[]>(mockDocuments);
  const [extractedRecords, setExtractedRecords] =
    useState<ExtractedRecord[]>(mockExtractedRecords);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeReviewDoc, setActiveReviewDoc] = useState<MedicalDocument | null>(
    documents.find((d) => d.status === "needs_review") || null
  );
  const [reviewRecord, setReviewRecord] = useState<ExtractedRecord | null>(
    extractedRecords.find((r) => r.status === "pending") || null
  );
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        summary:
          "Uploaded laboratory panel pending clinical biomarker confirmation.",
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
          instructions: [
            "Continue current hydration and ACE inhibitor regimen.",
          ],
        },
        created_at: new Date().toISOString(),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setExtractedRecords((prev) => [newExtracted, ...prev]);
      setActiveReviewDoc(newDoc);
      setReviewRecord(newExtracted);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1000);
  };

  const handleConfirmVerification = () => {
    if (!activeReviewDoc || !reviewRecord) return;
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Medical Records</h1>
          <p className="text-sm text--[var(--muted-foreground)] mt-0.5">
            Encrypted storage with OCR biomarker extraction
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-xl border border-[var(--border)] bg-white p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "cards"
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
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
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition-transform active:scale-95">
            <UploadCloud className="h-4 w-4" />
            Upload
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleSimulateUpload}
            />
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Document uploaded. Review the extracted biomarkers below.
        </div>
      )}

      {activeReviewDoc && reviewRecord && (
        <section className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h3 className="text-sm font-extrabold text-amber-950">
                  Verification · {activeReviewDoc.file_name}
                </h3>
                <span className="text-[11px] text-amber-800">
                  OCR extracted{" "}
                  {reviewRecord.raw_extracted.lab_results?.length || 0} biomarkers
                  · {(reviewRecord.confidence_score * 100).toFixed(0)}% confidence
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

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="soft-card space-y-2 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Source
              </span>
              <span className="block font-bold text-[var(--foreground)]">
                {activeReviewDoc.file_name}
              </span>
              <span className="block text-[var(--muted-foreground)]">
                {formatDate(activeReviewDoc.document_date)} ·{" "}
                {activeReviewDoc.facility_name}
              </span>
              <p className="border-t border-[var(--border)] pt-2 leading-relaxed text-[var(--muted-foreground)]">
                {activeReviewDoc.summary}
              </p>
            </div>

            <div className="soft-card space-y-3 p-4">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Extracted findings
              </span>
              {reviewRecord.raw_extracted.diagnoses && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 font-semibold text-emerald-900">
                  {reviewRecord.raw_extracted.diagnoses.join(", ")}
                </div>
              )}
              {reviewRecord.raw_extracted.lab_results && (
                <div className="space-y-1.5">
                  {reviewRecord.raw_extracted.lab_results.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-[var(--muted)] p-2"
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
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveReviewDoc(null)}
                  className="rounded-xl border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={handleConfirmVerification}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            type="search"
            placeholder="Search by title, doctor, facility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          title="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {[
          { id: "all", label: "All" },
          { id: "lab_report", label: "Labs" },
          { id: "prescription", label: "Prescriptions" },
          { id: "imaging", label: "Imaging" },
          { id: "doctor_note", label: "Notes" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`shrink-0 cursor-pointer rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
              categoryFilter === cat.id
                ? "bg-[var(--forest)] text-white shadow-sm"
                : "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {viewMode === "table" ? (
        <div className="soft-card overflow-hidden max-w-full">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60 text-[11px] font-extrabold uppercase text-[var(--muted-foreground)]">
                  <th className="py-3.5 pl-6">Name</th>
                  <th className="px-4 py-3.5">Owner</th>
                  <th className="px-4 py-3.5">Modified</th>
                  <th className="px-4 py-3.5">Size</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/70">
                {filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="transition-colors hover:bg-[var(--muted)]/50"
                  >
                    <td className="py-3.5 pl-6 font-bold text-[var(--foreground)]">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconTones[idx % iconTones.length]}`}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="block leading-tight">
                            {doc.file_name
                              .replace(".pdf", "")
                              .replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] font-normal text-[var(--muted-foreground)]">
                            {doc.facility_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--muted-foreground)]">
                      Elena Vance
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--muted-foreground)]">
                      {formatDate(doc.document_date)}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(doc.file_size / 1024).toFixed(0)} KB
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {doc.status === "needs_review" ? "Review" : "Verified"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[var(--muted-foreground)]">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReviewDoc(doc);
                            setReviewRecord(
                              extractedRecords.find(
                                (r) => r.document_id === doc.id
                              ) || null
                            );
                          }}
                          className="p-1 hover:text-[var(--foreground)]"
                          title="Inspect"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <a
                          href={doc.file_path}
                          download
                          className="p-1 hover:text-[var(--foreground)]"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <span className="block px-0.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Recent documents
          </span>
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredDocs.map((doc, idx) => {
              const isPending = doc.status === "needs_review";
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setActiveReviewDoc(doc);
                    setReviewRecord(
                      extractedRecords.find((r) => r.document_id === doc.id) ||
                        null
                    );
                  }}
                  className="soft-card flex cursor-pointer flex-col gap-3 p-5 text-left transition-all hover:border-emerald-200 group sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconTones[idx % iconTones.length]}`}
                    >
                      <FileText className="h-6 w-6 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-extrabold text-[var(--foreground)] transition-colors group-hover:text-emerald-700">
                          {doc.file_name.replace(".pdf", "").replace(/_/g, " ")}
                        </h3>
                        {isPending && (
                          <span className="rounded-xl bg-amber-100 px-2.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                            Needs review
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[var(--muted-foreground)]">
                        {doc.facility_name} · {doc.doctor_name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">
                        {formatDate(doc.document_date)} ·{" "}
                        {(doc.file_size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border)]/70 pt-2 sm:justify-end sm:border-0 sm:pt-0">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {isPending ? "Pending" : "Verified"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition-colors group-hover:text-emerald-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
