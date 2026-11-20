import { AICitation } from "@/types/medical";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ClinicalContext {
  patient_name?: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  chronic_conditions?: string[];
  active_medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  recent_vitals?: Array<{
    type: string;
    value: string;
    date: string;
    is_abnormal?: boolean;
  }>;
  allergies?: string[];
  recent_documents?: Array<{
    id: string;
    title: string;
    date: string;
    category: string;
  }>;
}

export interface AISafetyFlag {
  is_emergency: boolean;
  triage_level: "routine" | "urgent" | "emergency";
  emergency_category?: string;
  matched_keywords?: string[];
  disclaimer: string;
}

export interface AIResponse {
  content: string;
  citations: AICitation[];
  safety: AISafetyFlag;
  provider: string;
  model: string;
}

export interface AIProvider {
  name: string;
  generateResponse(
    messages: ChatMessage[],
    context?: ClinicalContext
  ): Promise<AIResponse>;
  streamResponse?(
    messages: ChatMessage[],
    context?: ClinicalContext,
    onChunk?: (text: string) => void
  ): Promise<AIResponse>;
}
