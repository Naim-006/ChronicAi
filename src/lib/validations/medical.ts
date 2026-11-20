import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message too long"),
  conversation_id: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      })
    )
    .optional(),
  include_clinical_context: z.boolean().default(true),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const metricInputSchema = z.object({
  metric_type: z.enum([
    "blood_pressure",
    "heart_rate",
    "glucose",
    "hba1c",
    "weight",
    "temperature",
    "spo2",
    "other",
  ]),
  value_primary: z.number().positive("Primary value must be positive"),
  value_secondary: z.number().positive().optional(),
  unit: z.string().min(1, "Unit required"),
  context: z
    .enum(["fasting", "postprandial", "resting", "random", "bedtime"])
    .optional(),
  recorded_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type MetricInput = z.infer<typeof metricInputSchema>;

export const medicationLogSchema = z.object({
  medication_id: z.string().min(1, "Medication ID required"),
  scheduled_time: z.string().datetime(),
  status: z.enum(["taken", "skipped", "snoozed", "missed"]),
  recorded_time: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type MedicationLogInput = z.infer<typeof medicationLogSchema>;

export const appointmentInputSchema = z.object({
  doctor_id: z.string().optional(),
  doctor_name: z.string().min(2, "Doctor name required"),
  specialty: z.string().min(2, "Specialty required"),
  clinic_name: z.string().optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  appointment_time: z.string().min(2, "Time required"),
  reason: z.string().min(3, "Reason required"),
  location: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentInputSchema>;

export const documentConfirmSchema = z.object({
  document_id: z.string().min(1, "Document ID required"),
  confirmed_labs: z
    .array(
      z.object({
        test_name: z.string(),
        value: z.number(),
        unit: z.string(),
        reference_range: z.string().optional(),
        is_abnormal: z.boolean().default(false),
      })
    )
    .optional(),
  confirmed_medications: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        instructions: z.string().optional(),
      })
    )
    .optional(),
});

export type DocumentConfirmInput = z.infer<typeof documentConfirmSchema>;
