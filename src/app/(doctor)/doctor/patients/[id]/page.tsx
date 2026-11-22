import React from "react";
import { PreVisitBriefView } from "@/components/doctor/PreVisitBriefView";

interface PatientBriefPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientBriefPage({ params }: PatientBriefPageProps) {
  const { id } = await params;
  return <PreVisitBriefView patientId={id} />;
}
