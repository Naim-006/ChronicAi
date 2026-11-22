"use client";

import React, { useRef } from "react";
import { Printer, X, ShieldCheck, HeartPulse, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "@/components/shared/QRCodeSVG";

export interface PrescriptionPrintData {
  doctor: {
    fullName: string;
    bmdcRegNo: string;
    specialty: string;
    qualifications?: string;
    chamberName?: string;
    chamberAddress?: string;
    phone?: string;
  };
  patient: {
    fullName: string;
    age?: string | number;
    sex?: string;
    patientCode?: string;
    serialNo?: string | number;
  };
  consultation: {
    date: string;
    chiefComplaints?: string;
    clinicalFindings?: string;
    diagnosis?: string;
    advice?: string;
    followUpDate?: string;
    recommendedTests?: string[];
  };
  prescription: {
    id: string;
    items: Array<{
      medication_name: string;
      generic_name?: string;
      strength?: string;
      dosage: string;
      frequency: string;
      route?: string;
      duration_days?: number;
      instructions?: string;
    }>;
  };
}

interface PrintablePrescriptionProps {
  data: PrescriptionPrintData;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintablePrescription({
  data,
  isOpen,
  onClose,
}: PrintablePrescriptionProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const verificationUrl = `https://chronicai.health/verify/rx/${data.prescription.id}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center print:p-0 print:bg-white print:static print:z-auto print:overflow-visible">
      {/* Screen action bar (hidden during print) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <Button
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Prescription
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-white/90 hover:bg-white text-slate-700 shadow-md"
        >
          <X className="h-4 w-4 mr-1" />
          Close
        </Button>
      </div>

      {/* Main Prescription Sheet */}
      <div
        ref={printAreaRef}
        id="printable-rx-sheet"
        className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-rx-sheet, #printable-rx-sheet * {
                visibility: visible;
              }
              #printable-rx-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
              }
              @page {
                size: A4;
                margin: 12mm;
              }
            }
          `
        }} />

        {/* Prescription Header / Chamber Letterhead */}
        <div className="p-6 sm:p-8 border-b-2 border-emerald-600/30 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {data.doctor.fullName}
                </h1>
              </div>
              <p className="text-sm font-semibold text-emerald-800">
                {data.doctor.qualifications || "MBBS, Specialist Practitioner"}
              </p>
              <p className="text-xs text-slate-600">
                {data.doctor.specialty} • <span className="font-medium text-slate-700">BMDC Reg: {data.doctor.bmdcRegNo}</span>
              </p>
              {data.doctor.chamberName && (
                <p className="text-xs text-slate-500 pt-1">
                  Chamber: {data.doctor.chamberName} {data.doctor.chamberAddress ? `(${data.doctor.chamberAddress})` : ""}
                </p>
              )}
            </div>

            <div className="text-right space-y-1 hidden sm:block">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <HeartPulse className="h-3.5 w-3.5" />
                ChronicAI E-Rx
              </div>
              <p className="text-xs text-slate-400">
                Prescription ID: #{data.prescription.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-500">
                Date: {data.consultation.date}
              </p>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Patient Name:</span>
              <span className="font-bold text-slate-900 text-sm">{data.patient.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Age / Gender:</span>
              <span className="font-semibold text-slate-800">
                {data.patient.age ? `${data.patient.age} yrs` : "N/A"} / {data.patient.sex || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Patient Code:</span>
              <span className="font-mono font-semibold text-emerald-700">
                {data.patient.patientCode || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Serial / Token:</span>
              <span className="font-semibold text-slate-800">
                #{data.patient.serialNo || "Walk-in"}
              </span>
            </div>
          </div>
        </div>

        {/* Prescription Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 min-h-[460px]">
          {/* Left Column (Clinical Notes & Tests) */}
          <div className="md:col-span-4 border-r-0 md:border-r border-slate-200 pr-0 md:pr-6 space-y-5 text-xs">
            {data.consultation.chiefComplaints && (
              <div>
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Chief Complaints
                </h3>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.consultation.chiefComplaints}
                </p>
              </div>
            )}

            {data.consultation.clinicalFindings && (
              <div>
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  On Examination (O/E)
                </h3>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.consultation.clinicalFindings}
                </p>
              </div>
            )}

            {data.consultation.diagnosis && (
              <div>
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Diagnosis
                </h3>
                <p className="text-slate-900 font-semibold bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-100">
                  {data.consultation.diagnosis}
                </p>
              </div>
            )}

            {data.consultation.recommendedTests && data.consultation.recommendedTests.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Investigations Advised
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {data.consultation.recommendedTests.map((t, idx) => (
                    <li key={idx} className="leading-snug">{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.consultation.followUpDate && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] block">
                  Next Follow-up
                </span>
                <span className="font-semibold text-slate-900 text-sm">
                  {new Date(data.consultation.followUpDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Right Column (Rx symbol + Medications) */}
          <div className="md:col-span-8 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black font-serif text-emerald-700 select-none">
                ℞
              </span>
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Prescribed Medications
              </span>
            </div>

            {/* Medication Items List */}
            <div className="space-y-4">
              {data.prescription.items.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No medications prescribed.</p>
              ) : (
                data.prescription.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {item.medication_name}
                          </span>
                          {item.strength && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {item.strength}
                            </span>
                          )}
                        </div>
                        {item.generic_name && (
                          <p className="text-[11px] text-slate-500 italic ml-5">
                            ({item.generic_name})
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                          {item.frequency}
                        </span>
                      </div>
                    </div>

                    <div className="ml-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                      {item.dosage && (
                        <span>
                          <strong className="text-slate-700">Dosage:</strong> {item.dosage}
                        </span>
                      )}
                      {item.instructions && (
                        <span>
                          <strong className="text-slate-700">Timing:</strong> {item.instructions}
                        </span>
                      )}
                      {item.duration_days && (
                        <span>
                          <strong className="text-slate-700">Duration:</strong> {item.duration_days} days
                        </span>
                      )}
                      {item.route && item.route !== "Oral" && (
                        <span>
                          <strong className="text-slate-700">Route:</strong> {item.route}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* General Advice */}
            {data.consultation.advice && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  General Advice & Lifestyle
                </h4>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                  {data.consultation.advice}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Footer & Signature Line */}
        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <QRCodeSVG value={verificationUrl} size={64} className="rounded border border-slate-200 bg-white p-1" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Electronic Prescription
              </div>
              <p className="text-[11px] text-slate-400">
                Scan QR to verify prescription on ChronicAI
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Rx #{data.prescription.id.slice(0, 16)}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1 w-full sm:w-auto">
            <div className="w-48 border-b-2 border-slate-400 mx-auto sm:ml-auto mb-1"></div>
            <p className="text-xs font-bold text-slate-800">
              {data.doctor.fullName}
            </p>
            <p className="text-[11px] text-slate-500">
              Authorized Signature & Stamp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
