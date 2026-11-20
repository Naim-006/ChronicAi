import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rzxzdwwnivvcfvmzhbia.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const GUIDELINES = [
  {
    source_title: "ADA 2024 Standards of Care in Diabetes",
    topic: "type_2_diabetes",
    source_url: "https://diabetesjournals.org/care/issue/47/Supplement_1",
    metadata: { organization: "ADA", year: 2024, evidence_grade: "Grade A" },
    chunks: [
      "Glycemic Targets: An HbA1c goal of < 7.0% (53 mmol/mol) is recommended for most nonpregnant adults with type 2 diabetes without significant hypoglycemia. More stringent goals (< 6.5%) may be appropriate for selected individuals with short disease duration, long life expectancy, and no cardiovascular disease, provided it can be achieved safely without hypoglycemia.",
      "First-line Pharmacotherapy: Lifestyle management combined with Metformin and/or SGLT2 inhibitors or GLP-1 receptor agonists with proven cardiovascular/renal benefit. For patients with established atherosclerotic cardiovascular disease (ASCVD), heart failure, or chronic kidney disease (CKD), an SGLT2 inhibitor (e.g. Empagliflozin, Dapagliflozin) or GLP-1 RA (e.g. Semaglutide, Dulaglutide) should be initiated regardless of baseline HbA1c or metformin use.",
      "Hypoglycemia Management Protocol: Level 1 hypoglycemia is defined as blood glucose < 70 mg/dL (3.9 mmol/L). Level 2 is < 54 mg/dL (3.0 mmol/L). Clinical rule of 15: Administer 15 grams of fast-acting carbohydrates (e.g. 4 oz fruit juice, 3-4 glucose tablets), recheck capillary blood glucose in 15 minutes, and repeat if blood glucose remains below 70 mg/dL.",
    ],
  },
  {
    source_title: "ACC/AHA 2023 Guideline for High Blood Pressure",
    topic: "hypertension",
    source_url: "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065",
    metadata: { organization: "ACC/AHA", year: 2023, evidence_grade: "Class 1A" },
    chunks: [
      "Blood Pressure Categorization: Normal BP is systolic < 120 mmHg and diastolic < 80 mmHg. Elevated BP is systolic 120-129 mmHg and diastolic < 80 mmHg. Stage 1 Hypertension is systolic 130-139 mmHg or diastolic 80-89 mmHg. Stage 2 Hypertension is systolic >= 140 mmHg or diastolic >= 90 mmHg. Target BP is < 130/80 mmHg for all confirmed hypertensive adults with clinical CVD or 10-year ASCVD risk >= 10%.",
      "First-Line Antihypertensive Agents: Initial first-line therapy includes Thiazide/thiazide-like diuretics (Chlorthalidone, Hydrochlorothiazide), Calcium Channel Blockers (Amlodipine, Nifedipine), and ACE Inhibitors (Lisinopril, Enalapril) or ARBs (Losartan, Valsartan). In patients with Stage 2 Hypertension and BP >= 20/10 mmHg above goal, initiation with two first-line agents of different pharmacological classes is recommended.",
      "Hypertensive Crises and Urgent Triage: Hypertensive Crisis is defined as systolic BP > 180 mmHg and/or diastolic BP > 120 mmHg. In the absence of target organ damage (acute kidney injury, intracranial hemorrhage, aortic dissection, acute pulmonary edema), acute parenteral reduction is contraindicated; oral medication adjustment with outpatient follow-up within 24-72 hours is indicated.",
    ],
  },
  {
    source_title: "KDIGO 2024 Clinical Practice Guideline for CKD",
    topic: "chronic_kidney_disease",
    source_url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
    metadata: { organization: "KDIGO", year: 2024, evidence_grade: "Grade 1A" },
    chunks: [
      "Evaluation and Staging: Chronic Kidney Disease is defined as abnormalities of kidney structure or function, present for > 3 months, with implications for health. Staged by eGFR (G1: >= 90, G2: 60-89, G3a: 45-59, G3b: 30-44, G4: 15-29, G5: < 15 mL/min/1.73m²) and Albuminuria UACR (A1: < 30 mg/g, A2: 30-299 mg/g, A3: >= 300 mg/g). Both eGFR and UACR must be tracked semiannually in chronic kidney patients.",
      "Renal Protection and Pharmacotherapy: Initiate SGLT2 inhibitors (Empagliflozin, Dapagliflozin) for adults with CKD and eGFR >= 20 mL/min/1.73m² and UACR >= 200 mg/g to delay renal progression and reduce cardiovascular mortality. Initiate ACEi or ARB at highest tolerated dose in patients with hypertension and UACR >= 30 mg/g. Do not combine ACEi and ARB due to hyperkalemia and acute kidney injury risks.",
    ],
  },
  {
    source_title: "AHA/ACC 2023 Cholesterol Management Guidelines",
    topic: "dyslipidemia",
    source_url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
    metadata: { organization: "AHA/ACC", year: 2023, evidence_grade: "Class 1A" },
    chunks: [
      "Statin Intensity and Primary Prevention: High-intensity statin therapy (Atorvastatin 40-80 mg, Rosuvastatin 20-40 mg) lowers LDL-C by >= 50%. Moderate-intensity statin therapy (Atorvastatin 10-20 mg, Rosuvastatin 5-10 mg, Simvastatin 20-40 mg) lowers LDL-C by 30% to 49%. In adults aged 40-75 with diabetes mellitus, moderate-intensity statin therapy is indicated regardless of estimated 10-year ASCVD risk.",
      "Secondary Prevention Thresholds: In patients with established clinical ASCVD, high-intensity statin therapy is indicated with a target LDL-C < 55 mg/dL. If LDL-C remains >= 70 mg/dL on maximum tolerated statin, add Ezetimibe 10 mg daily. In very high-risk ASCVD, addition of a PCSK9 inhibitor (Evolocumab, Alirocumab) is recommended.",
    ],
  },
];

async function generateGeminiEmbedding(text) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: text.slice(0, 2048) }] },
      outputDimensionality: 768,
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini embed failed: ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding?.values;
}

async function run() {
  console.log(`Connecting to Supabase: ${SUPABASE_URL}`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let insertedCount = 0;

  for (const guideline of GUIDELINES) {
    console.log(`\nProcessing: ${guideline.source_title}`);
    for (let idx = 0; idx < guideline.chunks.length; idx++) {
      const chunkText = guideline.chunks[idx];
      let embeddingVector = null;

      if (GEMINI_API_KEY) {
        try {
          console.log(` -> Generating 768d vector for chunk ${idx}...`);
          embeddingVector = await generateGeminiEmbedding(`${guideline.topic}: ${chunkText}`);
        } catch (e) {
          console.warn(`    [!] Embedding generation error: ${e.message}`);
        }
      }

      if (!embeddingVector) {
        embeddingVector = new Array(768).fill(0);
        embeddingVector[idx % 768] = 1.0;
      }

      // Try via RPC ingest_medical_knowledge_chunk first
      const { data: rpcId, error: rpcError } = await supabase.rpc("ingest_medical_knowledge_chunk", {
        p_source_title: guideline.source_title,
        p_topic: guideline.topic,
        p_chunk_index: idx,
        p_chunk_content: chunkText,
        p_embedding: JSON.stringify(embeddingVector),
        p_metadata: guideline.metadata,
        p_source_url: guideline.source_url,
      });

      if (!rpcError && rpcId) {
        console.log(`    [✓] Chunk ${idx} ingested via RPC (ID: ${rpcId})`);
        insertedCount++;
        continue;
      }

      // Fallback: direct table upsert (works with service_role key)
      const { error: tableError } = await supabase.from("medical_knowledge_embeddings").upsert(
        {
          source_title: guideline.source_title,
          source_url: guideline.source_url,
          topic: guideline.topic,
          chunk_index: idx,
          chunk_content: chunkText,
          token_count: chunkText.split(/\s+/).length,
          embedding: embeddingVector,
          metadata: guideline.metadata,
        },
        { onConflict: "source_title,chunk_index" }
      );

      if (tableError) {
        console.error(`    [!] Ingestion error:`, rpcError?.message || tableError.message);
      } else {
        console.log(`    [✓] Chunk ${idx} stored in pgvector!`);
        insertedCount++;
      }
    }
  }

  console.log(`\n[STATUS] Seed completed: ${insertedCount} chunks inserted.`);
}

run().catch(console.error);
