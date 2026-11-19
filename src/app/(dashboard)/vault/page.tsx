"use client";

import React, { useState } from "react";
import {
  FolderArchive,
  UploadCloud,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Check,
  X,
  FileCheck,
  Calendar,
  Building,
  User,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  // Upload simulation state
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

    // Update document status to verified
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeReviewDoc.id ? { ...d, status: "verified" as const } : d))
    );

    // Update record status
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
      <PageHeader
        title="Personal Medical Vault"
        description="Encrypted, searchable repository for your lifelong medical records. Upload prescriptions, lab panels, imaging, and hospital summaries."
        breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Medical Vault" }]}
      />

      {/* Upload Zone & Verification Notice */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dropzone Card */}
        <Card className="lg:col-span-2 border-dashed border-2 border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Upload New Medical Document
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Drag and drop your PDF, PNG, JPG or WebP files here (up to 25MB). AI OCR will parse key dates, doctor instructions, and lab values for your review.
            </p>

            <div className="mt-4 flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleSimulateUpload}
                  disabled={isUploading}
                />
                <Button
                  size="sm"
                  disabled={isUploading}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs h-8 gap-2"
                >
                  {isUploading ? "Uploading & OCR Processing..." : "Choose File to Upload"}
                </Button>
              </label>
            </div>

            {uploadSuccess && (
              <p className="mt-3 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> File uploaded! Medical facts parsed and ready for verification below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Security & Provenance Information Card */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <FileCheck className="h-4 w-4 text-teal-700" />
              Medical Data Provenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>Zero Unconfirmed Facts:</strong> Extracted data remains isolated until you review and verify each entry.
            </p>
            <p>
              <strong>AES-256 Cloud Encryption:</strong> Your documents are stored in private buckets and accessed solely via time-limited signed URLs.
            </p>
            <p>
              <strong>Immutable Original:</strong> Your original uploaded files are preserved unmodified forever.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Human-in-the-Loop Split-Screen Verification Drawer (When document needs review) */}
      {activeReviewDoc && reviewRecord && (
        <Card className="border-2 border-amber-300 bg-amber-50/30 shadow-md">
          <CardHeader className="border-b border-amber-200/60 bg-amber-50/70 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Human-in-the-Loop Verification Required
                </span>
                <Badge variant="outline" className="border-amber-300 bg-white text-amber-800 text-[10px]">
                  {Math.round(reviewRecord.confidence_score * 100)}% AI Confidence
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveReviewDoc(null)}
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Source Document Details */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-teal-700" />
                    Source File: {activeReviewDoc.file_name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {activeReviewDoc.category.replace("_", " ")}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Document Date: {formatDate(activeReviewDoc.document_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>Facility: {activeReviewDoc.facility_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Clinician: {activeReviewDoc.doctor_name}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold block text-slate-800 mb-1">OCR Abstract:</span>
                  {activeReviewDoc.summary}
                </div>
              </div>

              {/* Right Column: Extracted Editable Fields */}
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-900 block border-b border-slate-100 pb-2">
                    Extracted Findings for Confirmation
                  </span>

                  {reviewRecord.raw_extracted.diagnoses && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">Diagnoses / Screening Notes:</span>
                      <div className="p-2 rounded bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900">
                        {reviewRecord.raw_extracted.diagnoses.join(", ")}
                      </div>
                    </div>
                  )}

                  {reviewRecord.raw_extracted.lab_results && reviewRecord.raw_extracted.lab_results.length > 0 && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">Extracted Measurements:</span>
                      <div className="space-y-1.5">
                        {reviewRecord.raw_extracted.lab_results.map((res, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded border border-slate-200 text-xs bg-slate-50">
                            <span className="font-medium text-slate-800">{res.test_name}</span>
                            <span className="font-bold text-slate-900">
                              {res.value} {res.unit}{" "}
                              <span className="text-[10px] font-normal text-slate-500">
                                (Ref: {res.reference_range})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reviewRecord.raw_extracted.instructions && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">Instructions:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                        {reviewRecord.raw_extracted.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveReviewDoc(null)}
                    className="text-xs h-8"
                  >
                    Postpone Review
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmVerification}
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-8 gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Verify & Commit to Health Record
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Search files, facilities, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "lab_report", "prescription", "imaging", "doctor_note"].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat)}
              className="text-xs h-8 capitalize shrink-0"
            >
              {cat === "all" ? "All Documents" : cat.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="hover:border-slate-300 transition-all flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <div className="p-2 rounded-md bg-teal-50 text-teal-700 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <CardTitle className="text-xs font-semibold text-slate-900 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </CardTitle>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatDate(doc.document_date)} • {(doc.file_size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                </div>

                <Badge
                  variant={doc.status === "verified" ? "success" : "warning"}
                  className="text-[10px] shrink-0 capitalize"
                >
                  {doc.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-1 pb-4 flex-1">
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {doc.summary || "No document summary available."}
              </p>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="truncate max-w-[140px]">{doc.facility_name || "Diagnostic Center"}</span>
                <span className="text-teal-700 font-medium capitalize">{doc.category.replace("_", " ")}</span>
              </div>
            </CardContent>

            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between rounded-b-lg">
              {doc.status === "needs_review" ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveReviewDoc(doc);
                    setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                  }}
                  className="w-full text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Verify Extraction
                </Button>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Confirmed
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setActiveReviewDoc(doc);
                      setReviewRecord(extractedRecords.find((r) => r.document_id === doc.id) || null);
                    }}
                    className="text-xs h-7 text-slate-600 hover:text-slate-900"
                  >
                    View Details
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
