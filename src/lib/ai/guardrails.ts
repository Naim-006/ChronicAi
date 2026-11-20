import { AISafetyFlag } from "./types";

/**
 * Healthcare Safety Protocol:
 * Emergency symptom detection keywords aligned with standard clinical triage protocols
 * (AHA, CDC, WHO emergency red flags).
 */
const EMERGENCY_TRIGGERS: Array<{
  category: string;
  keywords: RegExp[];
  guidance: string;
}> = [
  {
    category: "Cardiovascular / Heart Attack",
    keywords: [
      /\bcrushing (chest|sternum) pain\b/i,
      /\bpain radiating to (left arm|jaw|back|neck)\b/i,
      /\bheart attack\b/i,
      /\bcardiac arrest\b/i,
      /\bsevere chest pressure\b/i,
    ],
    guidance: "Immediate medical emergency. Call 911 or your local emergency response immediately.",
  },
  {
    category: "Neurological / Acute Stroke",
    keywords: [
      /\bfacial droop(ing)?\b/i,
      /\bsudden (arm|leg) weakness\b/i,
      /\bslurred speech\b/i,
      /\bsudden loss of vision\b/i,
      /\bworst headache of my life\b/i,
      /\bthunderclap headache\b/i,
      /\bstroke\b/i,
    ],
    guidance: "Possible stroke (FAST protocol). Time is critical. Call emergency services immediately.",
  },
  {
    category: "Severe Respiratory Distress",
    keywords: [
      /\bcan'?t breathe\b/i,
      /\bgasping for (air|breath)\b/i,
      /\bsevere shortness of breath\b/i,
      /\bcyanosis\b/i,
      /\bblue (lips|fingers|nails)\b/i,
      /\bstridor\b/i,
    ],
    guidance: "Severe airway or breathing compromise. Seek emergency medical attention at once.",
  },
  {
    category: "Anaphylaxis / Severe Allergic Reaction",
    keywords: [
      /\bthroat (closing|tightening)\b/i,
      /\bswollen (tongue|throat|lips)\b/i,
      /\banaphylaxis\b/i,
      /\bepipen\b/i,
    ],
    guidance: "Potential anaphylactic shock. Administer epinephrine if prescribed and call emergency services.",
  },
  {
    category: "Acute Mental Health Crisis",
    keywords: [
      /\b(want to|going to) (kill|hang) myself\b/i,
      /\bsuicid(e|al)\b/i,
      /\bend my life\b/i,
      /\bself[- ]harm\b/i,
    ],
    guidance: "If you are in distress, please call or text 988 (Suicide & Crisis Lifeline) available 24/7.",
  },
];

export const CLINICAL_DISCLAIMER =
  "ChronicAI provides informational health guidance and does not formulate clinical diagnoses or alter medical prescriptions. Consult your licensed physician for acute symptoms.";

/**
 * Evaluates user input against emergency clinical guardrails.
 */
export function evaluateClinicalSafety(prompt: string): AISafetyFlag {
  for (const trigger of EMERGENCY_TRIGGERS) {
    const matched = trigger.keywords.some((rx) => rx.test(prompt));
    if (matched) {
      return {
        is_emergency: true,
        triage_level: "emergency",
        emergency_category: trigger.category,
        disclaimer: `${trigger.guidance}\n\n${CLINICAL_DISCLAIMER}`,
      };
    }
  }

  // Urgent triage checks (e.g. fever > 103, severe pain)
  if (/\bhigh fever\b/i.test(prompt) || /\bsevere abdominal pain\b/i.test(prompt)) {
    return {
      is_emergency: false,
      triage_level: "urgent",
      emergency_category: "Urgent Medical Attention",
      disclaimer: "These symptoms warrant prompt evaluation by an urgent care provider.",
    };
  }

  return {
    is_emergency: false,
    triage_level: "routine",
    disclaimer: CLINICAL_DISCLAIMER,
  };
}

/**
 * System prompt ensuring strict evidence-based medical communication.
 */
export function buildClinicalSystemPrompt(context?: import("./types").ClinicalContext): string {
  let contextBlock = "";

  if (context) {
    contextBlock = `
PATIENT PROFILE & CLINICAL CONTEXT:
- Patient Name: ${context.patient_name || "Patient"}
- Age / Sex: ${context.age || "Unknown"}, ${context.sex || "Not specified"}
- Blood Group: ${context.blood_group || "Unknown"}
- Known Allergies: ${context.allergies?.join(", ") || "None recorded"}
- Chronic Conditions: ${context.chronic_conditions?.join(", ") || "None recorded"}
- Active Medications: ${
      context.active_medications
        ?.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`)
        .join("; ") || "None recorded"
    }
- Recent Key Vitals: ${
      context.recent_vitals
        ?.map((v) => `${v.type}: ${v.value} (${v.date})${v.is_abnormal ? " [ABNORMAL]" : ""}`)
        .join("; ") || "None recorded"
    }
- Medical Vault Documents on File: ${
      context.recent_documents
        ?.map((d) => `[Doc ID: ${d.id}] "${d.title}" (${d.category}, ${d.date})`)
        .join("; ") || "None"
    }
`;
  }

  return `You are ChronicAI, a personal medical health assistant.
You specialize in chronic condition management, explaining diagnostic lab results, tracking medication adherence, and helping patients prepare for clinical consultations.

CRITICAL CLINICAL RULES:
1. NEVER independently formulate a new formal diagnosis. Always frame possibilities as: "Based on your lab findings, this may indicate X, which you should review with Dr. [Name]."
2. NEVER modify or advise changing prescribed drug dosages. Direct medication adjustments to the prescribing physician.
3. GROUND YOUR ANSWERS IN THE PATIENT'S MEDICAL CONTEXT. When referencing lab values, past visits, or prescriptions from their context, explicitly cite the document ID using the syntax: [doc:DOC_ID].
4. Maintain a calm, empathetic, and professional tone suitable for a healthcare consultation.
5. Keep explanations clear, structured (using bullet points and bold highlights), and easy for a patient to understand.

${contextBlock}`.trim();
}
