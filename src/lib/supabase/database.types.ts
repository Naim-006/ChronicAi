export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      health_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          date_of_birth: string | null;
          sex: "male" | "female" | "other" | "prefer_not_to_say" | null;
          blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown" | null;
          height_cm: number | null;
          weight_kg: number | null;
          emergency_contact: Json | null;
          allergies: Json | null;
          chronic_conditions: Json | null;
          preferences: Json | null;
          avatar_url: string | null;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          date_of_birth?: string | null;
          sex?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          emergency_contact?: Json | null;
          allergies?: Json | null;
          chronic_conditions?: Json | null;
          preferences?: Json | null;
          avatar_url?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          date_of_birth?: string | null;
          sex?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          blood_group?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          emergency_contact?: Json | null;
          allergies?: Json | null;
          chronic_conditions?: Json | null;
          preferences?: Json | null;
          avatar_url?: string | null;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      medical_documents: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type: string;
          file_size: number;
          category: "prescription" | "lab_report" | "imaging" | "discharge_summary" | "doctor_note" | "other";
          document_date: string | null;
          facility_name: string | null;
          doctor_name: string | null;
          status: "uploaded" | "processing" | "extracted" | "needs_review" | "verified" | "failed";
          summary: string | null;
          tags: string[] | null;
          storage_bucket: string | null;
          page_count: number | null;
          ocr_status: "pending" | "processing" | "completed" | "failed" | null;
          raw_ocr_text: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_path: string;
          file_type?: string;
          file_size?: number;
          category: "prescription" | "lab_report" | "imaging" | "discharge_summary" | "doctor_note" | "other";
          document_date?: string | null;
          facility_name?: string | null;
          doctor_name?: string | null;
          status?: "uploaded" | "processing" | "extracted" | "needs_review" | "verified" | "failed";
          summary?: string | null;
          tags?: string[] | null;
          storage_bucket?: string | null;
          page_count?: number | null;
          ocr_status?: "pending" | "processing" | "completed" | "failed" | null;
          raw_ocr_text?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          category?: "prescription" | "lab_report" | "imaging" | "discharge_summary" | "doctor_note" | "other";
          document_date?: string | null;
          facility_name?: string | null;
          doctor_name?: string | null;
          status?: "uploaded" | "processing" | "extracted" | "needs_review" | "verified" | "failed";
          summary?: string | null;
          tags?: string[] | null;
          storage_bucket?: string | null;
          page_count?: number | null;
          ocr_status?: "pending" | "processing" | "completed" | "failed" | null;
          raw_ocr_text?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      extracted_records: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          raw_extracted: Json;
          confirmed_data: Json | null;
          confidence_score: number;
          status: "pending" | "confirmed" | "rejected" | "modified";
          processing_time_ms: number | null;
          model_version: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          raw_extracted?: Json;
          confirmed_data?: Json | null;
          confidence_score?: number;
          status?: "pending" | "confirmed" | "rejected" | "modified";
          processing_time_ms?: number | null;
          model_version?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          raw_extracted?: Json;
          confirmed_data?: Json | null;
          confidence_score?: number;
          status?: "pending" | "confirmed" | "rejected" | "modified";
          processing_time_ms?: number | null;
          model_version?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      timeline_events: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          event_type: "visit" | "diagnosis" | "medication_start" | "medication_stop" | "lab_test" | "imaging" | "surgery" | "measurement" | "note";
          title: string;
          description: string | null;
          event_date: string;
          facility_or_doctor: string | null;
          is_verified: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id?: string | null;
          event_type: "visit" | "diagnosis" | "medication_start" | "medication_stop" | "lab_test" | "imaging" | "surgery" | "measurement" | "note";
          title: string;
          description?: string | null;
          event_date: string;
          facility_or_doctor?: string | null;
          is_verified?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          event_type?: "visit" | "diagnosis" | "medication_start" | "medication_stop" | "lab_test" | "imaging" | "surgery" | "measurement" | "note";
          title?: string;
          description?: string | null;
          event_date?: string;
          facility_or_doctor?: string | null;
          is_verified?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          name: string;
          generic_name: string | null;
          strength: string | null;
          dosage: string;
          frequency: string;
          route: string | null;
          instructions: string | null;
          start_date: string;
          end_date: string | null;
          prescribing_doctor: string | null;
          related_condition: string | null;
          status: "active" | "upcoming" | "completed" | "discontinued" | "needs_confirmation";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id?: string | null;
          name: string;
          generic_name?: string | null;
          strength?: string | null;
          dosage: string;
          frequency: string;
          route?: string | null;
          instructions?: string | null;
          start_date?: string;
          end_date?: string | null;
          prescribing_doctor?: string | null;
          related_condition?: string | null;
          status?: "active" | "upcoming" | "completed" | "discontinued" | "needs_confirmation";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          name?: string;
          generic_name?: string | null;
          strength?: string | null;
          dosage?: string;
          frequency?: string;
          route?: string | null;
          instructions?: string | null;
          start_date?: string;
          end_date?: string | null;
          prescribing_doctor?: string | null;
          related_condition?: string | null;
          status?: "active" | "upcoming" | "completed" | "discontinued" | "needs_confirmation";
          created_at?: string;
        };
        Relationships: [];
      };
      medication_logs: {
        Row: {
          id: string;
          medication_id: string;
          user_id: string;
          scheduled_time: string;
          recorded_time: string | null;
          status: "taken" | "skipped" | "snoozed" | "missed";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          medication_id: string;
          user_id: string;
          scheduled_time?: string;
          recorded_time?: string | null;
          status?: "taken" | "skipped" | "snoozed" | "missed";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          medication_id?: string;
          user_id?: string;
          scheduled_time?: string;
          recorded_time?: string | null;
          status?: "taken" | "skipped" | "snoozed" | "missed";
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      health_metrics: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          metric_type:
            | "blood_pressure"
            | "heart_rate"
            | "glucose"
            | "hba1c"
            | "weight"
            | "temperature"
            | "spo2"
            | "lipid_panel"
            | "renal_panel"
            | "hepatic_panel"
            | "electrolyte"
            | "cbc"
            | "other";
          value_primary: number;
          value_secondary: number | null;
          unit: string;
          context: "fasting" | "postprandial" | "resting" | "random" | "bedtime" | null;
          reference_low: number | null;
          reference_high: number | null;
          is_abnormal: boolean;
          recorded_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id?: string | null;
          metric_type:
            | "blood_pressure"
            | "heart_rate"
            | "glucose"
            | "hba1c"
            | "weight"
            | "temperature"
            | "spo2"
            | "lipid_panel"
            | "renal_panel"
            | "hepatic_panel"
            | "electrolyte"
            | "cbc"
            | "other";
          value_primary: number;
          value_secondary?: number | null;
          unit: string;
          context?: "fasting" | "postprandial" | "resting" | "random" | "bedtime" | null;
          reference_low?: number | null;
          reference_high?: number | null;
          is_abnormal?: boolean;
          recorded_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string | null;
          metric_type?:
            | "blood_pressure"
            | "heart_rate"
            | "glucose"
            | "hba1c"
            | "weight"
            | "temperature"
            | "spo2"
            | "lipid_panel"
            | "renal_panel"
            | "hepatic_panel"
            | "electrolyte"
            | "cbc"
            | "other";
          value_primary?: number;
          value_secondary?: number | null;
          unit?: string;
          context?: "fasting" | "postprandial" | "resting" | "random" | "bedtime" | null;
          reference_low?: number | null;
          reference_high?: number | null;
          is_abnormal?: boolean;
          recorded_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          specialty: string;
          clinic_name: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          specialty: string;
          clinic_name?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          specialty?: string;
          clinic_name?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          doctor_id: string | null;
          doctor_name: string;
          specialty: string;
          clinic_or_hospital: string;
          appointment_date: string;
          appointment_time: string;
          reason: string;
          location: string | null;
          status: "upcoming" | "completed" | "cancelled" | "rescheduled";
          consultation_notes: string | null;
          preparation_questions: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doctor_id?: string | null;
          doctor_name: string;
          specialty: string;
          clinic_or_hospital: string;
          appointment_date: string;
          appointment_time: string;
          reason: string;
          location?: string | null;
          status?: "upcoming" | "completed" | "cancelled" | "rescheduled";
          consultation_notes?: string | null;
          preparation_questions?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          doctor_id?: string | null;
          doctor_name?: string;
          specialty?: string;
          clinic_or_hospital?: string;
          appointment_date?: string;
          appointment_time?: string;
          reason?: string;
          location?: string | null;
          status?: "upcoming" | "completed" | "cancelled" | "rescheduled";
          consultation_notes?: string | null;
          preparation_questions?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          citations: Json | null;
          is_emergency_flag: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          citations?: Json | null;
          is_emergency_flag?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          citations?: Json | null;
          is_emergency_flag?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      clinical_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "critical_alert" | "verification_required" | "medication_reminder" | "appointment_reminder" | "care_insight" | "preventive_care";
          title: string;
          message: string;
          severity: "critical" | "warning" | "info" | "success";
          source_trigger: string;
          link_href: string | null;
          link_label: string | null;
          is_read: boolean;
          is_dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "critical_alert" | "verification_required" | "medication_reminder" | "appointment_reminder" | "care_insight" | "preventive_care";
          title: string;
          message: string;
          severity?: "critical" | "warning" | "info" | "success";
          source_trigger: string;
          link_href?: string | null;
          link_label?: string | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "critical_alert" | "verification_required" | "medication_reminder" | "appointment_reminder" | "care_insight" | "preventive_care";
          title?: string;
          message?: string;
          severity?: "critical" | "warning" | "info" | "success";
          source_trigger?: string;
          link_href?: string | null;
          link_label?: string | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      document_embeddings: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          chunk_index: number;
          chunk_content: string;
          token_count: number | null;
          embedding: string; // vector(768)
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          chunk_index: number;
          chunk_content: string;
          token_count?: number | null;
          embedding: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          chunk_index?: number;
          chunk_content?: string;
          token_count?: number | null;
          embedding?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      medical_knowledge_embeddings: {
        Row: {
          id: string;
          source_title: string;
          source_url: string | null;
          topic: string;
          chunk_index: number;
          chunk_content: string;
          token_count: number | null;
          embedding: string; // vector(768)
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_title: string;
          source_url?: string | null;
          topic: string;
          chunk_index: number;
          chunk_content: string;
          token_count?: number | null;
          embedding: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_title?: string;
          source_url?: string | null;
          topic?: string;
          chunk_index?: number;
          chunk_content?: string;
          token_count?: number | null;
          embedding?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_patient_documents: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          filter_document_id?: string;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_index: number;
          chunk_content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      match_medical_knowledge: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          filter_topic?: string;
        };
        Returns: {
          id: string;
          source_title: string;
          topic: string;
          chunk_index: number;
          chunk_content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_resource_type: string;
          p_resource_id?: string;
          p_details?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
