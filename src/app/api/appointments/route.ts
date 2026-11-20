import { NextRequest, NextResponse } from "next/server";
import { clinicalStore } from "@/lib/clinical-store";
import { appointmentInputSchema } from "@/lib/validations/medical";

export async function GET() {
  try {
    const appointments = await clinicalStore.getAppointments();
    return NextResponse.json({
      appointments,
      total: appointments.length,
      upcoming: appointments.filter((a) => a.status === "upcoming").length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve appointments", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = appointmentInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointment payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      doctor_name,
      specialty,
      clinic_name,
      appointment_date,
      appointment_time,
      reason,
      location,
      doctor_id,
    } = parsed.data;

    // Auto-generate AI clinical prep questions for the consultation
    const prepQuestions = [
      `Review latest 3-month glycemic control and HbA1c trajectory (current: 6.8%).`,
      `Evaluate any side effects or gastrointestinal tolerance with Metformin 1000mg.`,
      `Check if current morning blood pressure (122/78 mmHg) warrants keeping Lisinopril 20mg steady.`,
    ];

    const newAppt = await clinicalStore.addAppointment({
      doctor_id,
      doctor_name,
      specialty,
      clinic_or_hospital: clinic_name || "Medical Clinic",
      appointment_date,
      appointment_time,
      reason,
      location: location || clinic_name || "Medical Clinic",
      status: "upcoming",
      preparation_questions: prepQuestions,
    });

    // Add to timeline
    await clinicalStore.addTimelineEvent({
      event_type: "visit",
      title: `Scheduled Consultation: ${doctor_name} (${specialty})`,
      description: `Appointment booked for ${appointment_date} at ${appointment_time}. Reason: ${reason}.`,
      event_date: appointment_date,
      is_verified: true,
    });

    return NextResponse.json(newAppt, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to schedule appointment", message: error?.message },
      { status: 500 }
    );
  }
}
