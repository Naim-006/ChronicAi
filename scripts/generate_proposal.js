const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const logoBase64 = fs.readFileSync(path.resolve('public/logo.png')).toString('base64');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChronicAI Project Proposal - Team HydraX</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 8.5pt;
      line-height: 1.38;
    }

    .page {
      width: 100%;
      height: 277mm;
      max-height: 277mm;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .page-content {
      flex: 1;
    }

    /* Header styling */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #059669;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 48px;
      height: 32px;
      object-fit: contain;
      background: #ffffff;
      border-radius: 6px;
      padding: 2px;
      border: 1px solid #e2e8f0;
    }

    .brand-title {
      font-size: 15pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.1;
    }

    .brand-title span {
      color: #059669;
    }

    .brand-subtitle {
      font-size: 7.5pt;
      font-weight: 700;
      color: #059669;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .meta-box {
      text-align: right;
    }

    .team-badge {
      display: inline-block;
      background: #059669;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .institution-name {
      font-size: 7.5pt;
      color: #475569;
      font-weight: 600;
      margin-top: 2px;
    }

    /* Team Members Banner */
    .team-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 7px 10px;
      margin-bottom: 10px;
    }

    .team-card {
      font-size: 7.5pt;
    }

    .member-name {
      font-weight: 800;
      color: #065f46;
      font-size: 8pt;
    }

    .member-role {
      font-weight: 700;
      color: #0f172a;
      font-size: 7pt;
      margin-top: 1px;
    }

    .member-mail {
      color: #047857;
      font-family: monospace;
      font-size: 6.8pt;
    }

    /* Section Styling */
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      color: #065f46;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      margin-bottom: 5px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 12px;
      background: #059669;
      border-radius: 2px;
    }

    p {
      margin-bottom: 5px;
      text-align: justify;
      color: #334155;
    }

    strong {
      color: #0f172a;
    }

    /* Grid layout */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    /* Cards */
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
      margin-bottom: 6px;
    }

    .card-highlight {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 7px 9px;
      margin-bottom: 6px;
    }

    .card-title {
      font-weight: 800;
      color: #0f172a;
      font-size: 8pt;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .badge {
      display: inline-block;
      font-size: 6.5pt;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.2pt;
      margin-top: 4px;
      margin-bottom: 6px;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Architecture diagram */
    .diagram-container {
      background: #0f172a;
      color: #f8fafc;
      border-radius: 8px;
      padding: 8px 10px;
      margin: 6px 0;
      font-family: monospace;
      font-size: 7pt;
    }

    .diagram-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      margin-top: 4px;
    }

    .diagram-node {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 5px;
      padding: 5px 6px;
      text-align: center;
      flex: 1;
    }

    .diagram-node.active {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      font-weight: bold;
    }

    .diagram-arrow {
      color: #64748b;
      font-weight: bold;
    }

    /* KPI Callout */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin: 6px 0;
    }

    .kpi-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #059669;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }

    .kpi-value {
      font-size: 13pt;
      font-weight: 800;
      color: #059669;
      line-height: 1.1;
    }

    .kpi-label {
      font-size: 6.5pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* Footer */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.8pt;
      color: #64748b;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Header -->
      <div class="header-bar">
        <div class="brand-group">
          <img src="data:image/png;base64,${logoBase64}" class="brand-logo" alt="ChronicAI Logo" />
          <div>
            <div class="brand-title">Chronic<span>AI</span></div>
            <div class="brand-subtitle">Autonomous Lifelong Health Intelligence & Clinical Copilot</div>
          </div>
        </div>
        <div class="meta-box">
          <span class="team-badge">Team HydraX</span>
          <div class="institution-name">Daffodil International University (DIU)</div>
          <div style="font-size: 6.8pt; color: #64748b;">Project Idea & Technical Proposal</div>
        </div>
      </div>

      <!-- Team Members -->
      <div class="team-grid">
        <div class="team-card">
          <div class="member-name">Naim Hossain</div>
          <div class="member-role">Team Leader · Full Stack, AI/ML, Backend</div>
          <div class="member-mail">252-15-178@diu.edu.bd</div>
        </div>
        <div class="team-card">
          <div class="member-name">Md Ajmine Adil Sadik</div>
          <div class="member-role">API Architecture, UI/UX, Routing</div>
          <div class="member-mail">252-15-172@diu.edu.bd</div>
        </div>
        <div class="team-card">
          <div class="member-name">Sadman Sakib</div>
          <div class="member-role">Clinical Domain Expert & Medical Research</div>
          <div class="member-mail">252-15-102@diu.edu.bd</div>
        </div>
      </div>

      <!-- 1. Executive Summary -->
      <div class="section-title">1. Executive Summary</div>
      <p>
        <strong>ChronicAI</strong> is a privacy-preserving, lifelong medical intelligence ecosystem designed to solve the catastrophic fragmentation of personal health data. Over 85% of outpatient healthcare in developing countries like Bangladesh—as well as ambulatory care globally—is trapped in physical, unindexed paper prescriptions and disconnected laboratory receipts. ChronicAI delivers a <em>"Drop & Forget"</em> autonomous health partner: patients upload physical prescription photos or diagnostic lab PDFs, and our multimodal clinical vision pipeline automatically extracts biomarkers, resolves multilingual Bengali-English instructions, schedules daily medication adherence regimes, and constructs an encrypted longitudinal timeline. Supported by a <strong>Retrieval-Augmented Generation (RAG)</strong> Clinical Copilot powered by Google Gemini and Supabase PostgreSQL (pgvector), ChronicAI eliminates hallucinations by grounding answers directly in verified source documents while providing emergency clinicians with one-time Secret Access PINs for instant 15-second triage history review.
      </p>

      <!-- 2. Problem Statement -->
      <div class="section-title">2. Problem Statement & Clinical Urgency</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">🚨 Severe Medical Record Fragmentation</div>
          <p style="font-size: 7.8pt;">
            In Bangladesh and low-to-middle income countries (LMICs), patients accumulate years of handwritten prescriptions, thermal ECG strips, and printed lab slips in physical plastic folders. Due to humidity, physical loss, and poor filing, critical biomarker baselines (HbA1c, serum creatinine, eGFR, lipid panels) vanish, leaving patients unable to track their chronic trajectory.
          </p>
        </div>
        <div class="card">
          <div class="card-title">⏱️ Blind 5-Minute Consultations</div>
          <p style="font-size: 7.8pt;">
            Outpatient physicians face extreme patient volume, with consultations averaging 3 to 7 minutes. Doctors lack the time to review thick paper files, forcing them to prescribe blindly without visibility into multi-year organ function trends, past adverse drug reactions, or ongoing duplicate prescriptions from multiple specialists.
          </p>
        </div>
        <div class="card">
          <div class="card-title">💊 Polypharmacy & Fatal Drug Interactions</div>
          <p style="font-size: 7.8pt;">
            Patients managing co-morbidities (Type 2 Diabetes, Hypertension, and CKD) often consume 6 to 10 daily medications. Confusing meal timings (e.g., "খাওয়ার ৩০ মিনিট আগে", "১+০+১"), language illiteracy, and counteracting drug combinations (e.g., NSAIDs taken alongside ACE inhibitors) cause severe preventable kidney damage and acute hospitalizations.
          </p>
        </div>
        <div class="card">
          <div class="card-title">📉 The Health Literacy Gap</div>
          <p style="font-size: 7.8pt;">
            Diagnostic lab reports present biomarkers in dense medical terminology without actionable context. Patients leave diagnostic centers anxious, unable to decipher whether an elevated biomarker requires urgent attention or lifestyle adjustment, driving unnecessary panic or dangerous negligence.
          </p>
        </div>
      </div>

      <!-- 3. Target Audience & Stakeholders -->
      <div class="section-title">3. Target Beneficiaries & User Personas</div>
      <div class="grid-3">
        <div class="card-highlight">
          <div class="card-title">👤 Chronic Patients</div>
          <p style="font-size: 7.5pt;">
            Individuals suffering from diabetes, cardiovascular diseases, hypertension, and asthma who need daily medication adherence tracking, automated refill alerts, and longitudinal lab progress tracking.
          </p>
        </div>
        <div class="card-highlight">
          <div class="card-title">👨‍👩‍👧 Family Caregivers</div>
          <p style="font-size: 7.5pt;">
            Adult children caring for elderly parents remotely. Provides centralized digital access to parents' prescriptions, doctor appointments, emergency cards, and real-time adherence logs.
          </p>
        </div>
        <div class="card-highlight">
          <div class="card-title">🩺 Outpatient & ER Doctors</div>
          <p style="font-size: 7.5pt;">
            Physicians requiring instant 15-second historical health summaries during clinic visits or emergency trauma admissions via secure OTP/PIN access without proprietary software.
          </p>
        </div>
      </div>
    </div>

    <!-- Page 1 Footer -->
    <div class="page-footer">
      <span>ChronicAI — Autonomous Lifelong Health Intelligence</span>
      <span>Team HydraX · Daffodil International University</span>
      <span>Page 1 of 3</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Header -->
      <div class="header-bar">
        <div class="brand-group">
          <img src="data:image/png;base64,${logoBase64}" class="brand-logo" alt="ChronicAI Logo" />
          <div>
            <div class="brand-title">Chronic<span>AI</span></div>
            <div class="brand-subtitle">Technical Architecture, AI Innovation & Feasibility</div>
          </div>
        </div>
        <div class="meta-box">
          <span class="team-badge">Team HydraX</span>
          <div style="font-size: 7pt; color: #64748b;">Solution & System Engineering</div>
        </div>
      </div>

      <!-- 4. AI-Powered Solution -->
      <div class="section-title">4. AI-Powered Solution & System Architecture</div>
      <p>
        ChronicAI operates on an autonomous 4-stage ingestion, intelligence, and retrieval architecture designed to make medical record-keeping effortless and medically actionable:
      </p>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">📸 1. Multimodal Vision OCR & Smart Intake</div>
          <p style="font-size: 7.6pt;">
            Users photograph paper prescriptions or upload lab PDFs. Utilizing Google Gemini 2.5 Flash Multimodal Vision, the system executes clinical entity recognition, extracting document dates, doctor credentials, laboratory biomarkers (with units and ranges), and prescription schedules into strict structured JSON.
          </p>
        </div>
        <div class="card">
          <div class="card-title">🌐 2. Bidirectional Bengali-English Translation</div>
          <p style="font-size: 7.6pt;">
            Recognizing that South Asian prescriptions blend English brand names with Bengali handwritten dosage instructions, our proprietary normalizer (<code>formatMedInstruction</code>) seamlessly converts Bengali numerals, frequencies, and meal timings (e.g. "১ বার (দুপুর) ৬ সপ্তাহ" ⇄ "1 time daily (Noon) 6 weeks").
          </p>
        </div>
        <div class="card">
          <div class="card-title">🧠 3. Grounded RAG Clinical Copilot</div>
          <p style="font-size: 7.6pt;">
            Extracted clinical records are segmented into semantic chunks and embedded into a 768-dimensional vector space using <code>gemini-embedding-001</code> inside Supabase PostgreSQL (pgvector). The Copilot answers patient queries strictly from verified records with clickable document citations, preventing hallucination.
          </p>
        </div>
        <div class="card">
          <div class="card-title">🔑 4. Emergency Secret PIN & Doctor Portal</div>
          <p style="font-size: 7.6pt;">
            Provides frictionless interoperability. In emergency rooms or new clinic visits, doctors simply input the patient's unique Patient ID and a one-time Secret Access Code (OTP) to view a verified, chronological longitudinal dossier without needing an account or app download.
          </p>
        </div>
      </div>

      <!-- Architecture Flowchart -->
      <div class="diagram-container">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 4px;">
          <span style="color: #34d399; font-weight: bold;">⚡ CHRONICAI END-TO-END DATA & INFERENCE PIPELINE</span>
          <span style="color: #94a3b8; font-size: 6.5pt;">Next.js 16 + Supabase pgvector + Gemini Vision</span>
        </div>
        <div class="diagram-flow">
          <div class="diagram-node active">
            📄 Paper Prescription<br/>& Lab PDF Upload
          </div>
          <div class="diagram-arrow">➔</div>
          <div class="diagram-node">
            👁️ Gemini 2.5 Vision<br/>Clinical Entity OCR
          </div>
          <div class="diagram-arrow">➔</div>
          <div class="diagram-node active">
            🗄️ PostgreSQL (pgvector)<br/>AES-256 RLS Vault
          </div>
          <div class="diagram-arrow">➔</div>
          <div class="diagram-node">
            🤖 Grounded RAG Copilot<br/>+ Citation Engine
          </div>
          <div class="diagram-arrow">➔</div>
          <div class="diagram-node active">
            🩺 Doctor Portal<br/>One-Time Secret OTP
          </div>
        </div>
      </div>

      <!-- 5. Innovation & Feasibility -->
      <div class="section-title">5. Innovation, Technical Feasibility & Competitive Differentiation</div>
      <p style="font-size: 7.8pt;">
        ChronicAI bridges the critical gap between overly complex, desktop-locked hospital Electronic Health Records (EHRs) and dangerous, ungrounded conversational AI chatbots:
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Dimension</th>
            <th style="width: 30%; background: #dcfce7; color: #166534;">ChronicAI (Team HydraX)</th>
            <th style="width: 25%;">Generic AI (ChatGPT / Claude)</th>
            <th style="width: 25%;">Traditional EHR (Epic, Cerner)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Medical Data Grounding</strong></td>
            <td style="background: #f0fdf4; font-weight: bold; color: #15803d;">100% Grounded RAG with source document citations</td>
            <td style="color: #b91c1c;">High hallucination risk; unverified advice</td>
            <td>Static historical records; no intelligence</td>
          </tr>
          <tr>
            <td><strong>Document Ingestion</strong></td>
            <td style="background: #f0fdf4; font-weight: bold; color: #15803d;">Multimodal OCR for handwritten prescriptions & PDFs</td>
            <td>Text copy-paste only; no schema extraction</td>
            <td>Requires manual staff data entry</td>
          </tr>
          <tr>
            <td><strong>Bilingual Localization</strong></td>
            <td style="background: #f0fdf4; font-weight: bold; color: #15803d;">Native Bengali & English with clinical timing translation</td>
            <td>Literal, awkward translations</td>
            <td>English-only enterprise interface</td>
          </tr>
          <tr>
            <td><strong>Doctor Sharing Model</strong></td>
            <td style="background: #f0fdf4; font-weight: bold; color: #15803d;">One-time Emergency Access PIN + Expiring web links</td>
            <td>Screenshots / manual forward</td>
            <td>Locked behind closed proprietary hospital silos</td>
          </tr>
          <tr>
            <td><strong>Technical Feasibility</strong></td>
            <td style="background: #f0fdf4; font-weight: bold; color: #15803d;">Production-ready MVP built (Next.js 16 + Supabase)</td>
            <td>API-only; requires custom application</td>
            <td>Millions in licensing & infrastructure costs</td>
          </tr>
        </tbody>
      </table>

      <!-- Technical Feasibility Snapshot -->
      <div class="card-highlight" style="margin-top: 6px;">
        <div class="card-title">✅ Demonstrated Technical Feasibility (Working MVP)</div>
        <p style="font-size: 7.6pt;">
          ChronicAI is not a theoretical concept—a full-scale, fully functional production MVP has been engineered and validated by Team HydraX. All core modules—including multimodal prescription OCR parsing, interactive longitudinal Recharts analytics, 7-day medication streak logging, full bilingual language switching, and Supabase Row-Level Security isolation—are deployed and verified.
        </p>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <div class="page-footer">
      <span>ChronicAI — Autonomous Lifelong Health Intelligence</span>
      <span>Team HydraX · Daffodil International University</span>
      <span>Page 2 of 3</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Header -->
      <div class="header-bar">
        <div class="brand-group">
          <img src="data:image/png;base64,${logoBase64}" class="brand-logo" alt="ChronicAI Logo" />
          <div>
            <div class="brand-title">Chronic<span>AI</span></div>
            <div class="brand-subtitle">Impact, Business Model, Governance & Roadmap</div>
          </div>
        </div>
        <div class="meta-box">
          <span class="team-badge">Team HydraX</span>
          <div style="font-size: 7pt; color: #64748b;">Sustainability & Execution</div>
        </div>
      </div>

      <!-- 6. Measurable Impact & KPIs -->
      <div class="section-title">6. Measurable Clinical & Economic Impact</div>
      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-value">80%</div>
          <div class="kpi-label">Consultation Prep Time Saved</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-value">40%+</div>
          <div class="kpi-label">Medication Adherence Boost</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-value">0%</div>
          <div class="kpi-label">Polypharmacy Blindspots</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-value">15s</div>
          <div class="kpi-label">Emergency Doctor Triage Access</div>
        </div>
      </div>

      <!-- 7. Business Model & Sustainability -->
      <div class="section-title">7. Business Model & Financial Sustainability Plan</div>
      <div class="grid-3">
        <div class="card">
          <div class="card-title">💳 B2C Freemium Model</div>
          <p style="font-size: 7.4pt;">
            <strong>Free Tier:</strong> Up to 50 medical documents, vital trend tracking, emergency profile card, and bilingual timeline.<br/>
            <strong>ChronicAI Pro (৳299 / $3.99 mo):</strong> Unlimited RAG Copilot queries, instant drug interaction safety checker, family health management (up to 5 dependents), and encrypted JSON/PDF export.
          </p>
        </div>
        <div class="card">
          <div class="card-title">🏥 B2B Clinic SaaS</div>
          <p style="font-size: 7.4pt;">
            <strong>Doctor Portal (৳2,499 / $29 mo per seat):</strong> Enables outpatient private chambers and clinics to pull structured patient histories via Secret Access Code (OTP), generate digital prescriptions with interaction checks, and sync follow-up appointments directly to patient devices.
          </p>
        </div>
        <div class="card">
          <div class="card-title">🔬 Diagnostic Lab Partnerships</div>
          <p style="font-size: 7.4pt;">
            <strong>B2B API Integration:</strong> Direct partnership with diagnostic lab chains (e.g., Popular, Ibn Sina, Labaid). Diagnostic centers automatically push digital PDF lab results directly into patients' ChronicAI vaults with structured telemetry, earning a small fee per verified transmission.
          </p>
        </div>
      </div>

      <!-- 8. Security & Ethical AI Governance -->
      <div class="section-title">8. Security, Privacy & Ethical AI Governance</div>
      <div class="grid-2">
        <div class="card-highlight">
          <div class="card-title">🛡️ Cryptographic Zero-Knowledge Vault</div>
          <p style="font-size: 7.5pt;">
            • <strong>Row-Level Security (RLS):</strong> PostgreSQL database policies enforce cryptographic tenant isolation so that only authenticated patient tokens can access records.<br/>
            • <strong>Encryption:</strong> AES-256 at rest and TLS 1.3 in transit. All client-uploaded documents are securely compartmentalized in private Supabase storage.
          </p>
        </div>
        <div class="card-highlight">
          <div class="card-title">⚖️ Responsible Medical Guardrails</div>
          <p style="font-size: 7.5pt;">
            • <strong>Emergency Override:</strong> Acute symptoms (severe chest pressure, stroke signs, blood sugar &lt;50 mg/dL) immediately bypass LLM chat and present local emergency services (999/911).<br/>
            • <strong>Non-Diagnostic Authority:</strong> Explicit medical disclaimers frame all outputs as educational synthesis rather than prescriptive medical treatment.
          </p>
        </div>
      </div>

      <!-- 9. 12-Month Implementation Roadmap -->
      <div class="section-title">9. 12-Month Implementation Roadmap</div>
      <div class="grid-2">
        <div class="card">
          <div class="card-title">📍 Q1–Q2 2027: Mobile Ecosystem & Clinical Beta</div>
          <p style="font-size: 7.4pt;">
            • Deploy native iOS & Android companion apps with biometric FaceID/fingerprint authentication.<br/>
            • Conduct clinical pilot testing with 1,000 diabetic and hypertensive patients in Dhaka, Bangladesh.<br/>
            • Integrate Apple HealthKit and Google Health Connect for passive background sensor syncing.
          </p>
        </div>
        <div class="card">
          <div class="card-title">🚀 Q3–Q4 2027: Doctor Portal & Fine-Tuned SLMs</div>
          <p style="font-size: 7.4pt;">
            • Launch the dedicated Emergency Doctor Portal with instant SMS/One-Time Password (OTP) verification.<br/>
            • Train and deploy a specialized Small Language Model (SLM) fine-tuned on regional pharmaceutical trade names.<br/>
            • Expand commercial pilot partnerships with 3 major national diagnostic hospital chains.
          </p>
        </div>
      </div>

      <!-- Verification and Links -->
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 7.2pt;">
        <div>
          <strong>🌐 Live Public Proposal URL:</strong> <a href="https://chronic-ai.vercel.app/ChronicAI_Project_Proposal_HydraX.pdf" style="color: #059669; font-weight: bold; text-decoration: none;">https://chronic-ai.vercel.app/ChronicAI_Project_Proposal_HydraX.pdf</a><br/>
          <strong>💻 Source Code Repository:</strong> <a href="https://github.com/Naim-006/ChronicAi" style="color: #059669; font-weight: bold; text-decoration: none;">https://github.com/Naim-006/ChronicAi</a>
        </div>
        <div style="text-align: right;">
          <span style="font-weight: 800; color: #065f46;">Team HydraX Submission</span><br/>
          <span style="color: #64748b;">DIU Dept. of Software Engineering / CSE</span>
        </div>
      </div>
    </div>

    <!-- Page 3 Footer -->
    <div class="page-footer">
      <span>ChronicAI — Autonomous Lifelong Health Intelligence</span>
      <span>Team HydraX · Daffodil International University</span>
      <span>Page 3 of 3</span>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.resolve('proposal.html'), htmlContent);
console.log('Saved proposal.html. Now generating PDF via Chrome headless...');

try {
  const outputPath = path.resolve('public/ChronicAI_Project_Proposal_HydraX.pdf');
  const fileUrl = 'file:///' + path.resolve('proposal.html').replace(/\\\\/g, '/');

  execFileSync('C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--print-to-pdf=' + outputPath,
    '--no-pdf-header-footer',
    fileUrl
  ]);

  const stats = fs.statSync(outputPath);
  console.log('SUCCESS! PDF successfully created at:', outputPath);
  console.log('PDF File Size:', stats.size, 'bytes');
  fs.unlinkSync(path.resolve('proposal.html'));
} catch (err) {
  console.error('Error generating PDF:', err);
}
