# Project Roadmap & Implementation Schedule — Universal Personal Medical AI

## Overview
This roadmap establishes the progressive execution sequence for the platform, ensuring dependencies are built in logical order without breaking changes or architectural rework.

---

## Phases & Deliverables

### Phase 1: Foundation (In Progress)
- [x] Project Scaffolding (Next.js 16, TypeScript, Tailwind v4, Lucide)
- [ ] Design Tokens, Color Palette, UI Primitives
- [ ] Application Shell (AppSidebar, AppHeader, Responsive Navigation)
- [ ] Authentication Infrastructure & Session Context

### Phase 2: Core Dashboard & Overview
- [ ] Personalized Health Overview (Adaptive view for Healthy vs. Chronic)
- [ ] Active Conditions & Medication Cards
- [ ] Upcoming Appointments & Quick Actions Drawer
- [ ] Recent Medical Timeline Activity Feed

### Phase 3: Health Profile & Onboarding
- [ ] Progressive Onboarding Flow (Demographics, Allergies, Surgeries, Lifestyle)
- [ ] Comprehensive Health Profile Editor
- [ ] Emergency Contact & Medical Warning Card

### Phase 4: Medical Records Vault
- [ ] Multi-Format Document Upload Zone (PDF, PNG, JPG, WebP)
- [ ] File Encryption & Storage Pipeline
- [ ] Categorized Document Directory with Tagging & Search
- [ ] Split-Screen Document Review & Extracted Field Verification Drawer

### Phase 5: Lifelong Medical Timeline
- [ ] Chronological Interactive Event Feed
- [ ] Multi-Faceted Filters (Event Type, Date Range, Condition, Doctor)
- [ ] Document Provenance Linking
- [ ] Manual Event Creator

### Phase 6: Doctors & Appointments
- [ ] Healthcare Provider Directory
- [ ] Appointment Scheduling & Status Workflow
- [ ] Pre-Appointment AI Preparation Questionnaire
- [ ] Post-Visit Consultation Notes & Prescription Linking

### Phase 7: Medications & Adherence Engine
- [ ] Active & Past Prescription Manager
- [ ] Daily Dosage Schedule Generator (e.g. BID -> 08:00, 20:00)
- [ ] One-Click Adherence Logger (`Taken`, `Skipped`, `Snoozed`)
- [ ] Course Completion Confirmation Modal

### Phase 8: Measurements & Health Analytics
- [ ] Multi-Metric Logging (BP, Glucose, HbA1c, Weight, Temp, SpO2)
- [ ] Time-Series Trend Charts with Clinical Reference Range Bands
- [ ] Multi-Report Laboratory Comparison Matrix

### Phase 9: Personal Medical AI Assistant
- [ ] Grounded Conversational RAG Interface
- [ ] Multi-Context Retrieval Engine (Relational SQL + Document Embeddings)
- [ ] Strict Medical Guardrails & Emergency Red-Flag Triage Banner
- [ ] Clickable Source Document Citation Chips

### Phase 10: Chronic Care (Diabetes V1)
- [ ] Fasting & Postprandial Blood Glucose Tracking
- [ ] HbA1c Longitudinal Progression Analyzer
- [ ] Hypoglycemia / Hyperglycemia Alerts & Symptom Log

### Phase 11: Smart Follow-Up System
- [ ] Autonomous Rule-Based Follow-Up Triggers
- [ ] Recovery Check-In Modals
- [ ] Medication Course End Reminders

### Phase 12: Medical Data Sharing & Summaries
- [ ] One-Click Clinical PDF Summary Generator
- [ ] Time-Limited Encrypted Sharing Links with Expiration
- [ ] Patient Consent Audit Log

### Phase 13: Quality, Testing & Deployment
- [ ] Unit & Integration Test Suites
- [ ] RLS Multi-Tenant Security Verification
- [ ] WCAG 2.1 AA Accessibility Audit
- [ ] Production Vercel & Supabase Deployment Configuration
