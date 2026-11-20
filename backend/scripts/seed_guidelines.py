import asyncio
import os
import sys
import httpx
import uuid

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.routers.rag import generate_gemini_embedding

GUIDELINES = [
    {
        "source_title": "ADA 2024 Standards of Care in Diabetes",
        "topic": "type_2_diabetes",
        "source_url": "https://diabetesjournals.org/care/issue/47/Supplement_1",
        "metadata": {"organization": "ADA", "year": 2024, "evidence_grade": "Grade A"},
        "chunks": [
            (
                "Glycemic Targets: An HbA1c goal of < 7.0% (53 mmol/mol) is recommended for most nonpregnant "
                "adults with type 2 diabetes without significant hypoglycemia. More stringent goals (< 6.5%) "
                "may be appropriate for selected individuals with short disease duration, long life expectancy, "
                "and no cardiovascular disease, provided it can be achieved safely without hypoglycemia. Less "
                "stringent goals (< 8.0%) are appropriate for patients with severe hypoglycemia history, limited "
                "life expectancy, or advanced microvascular/macrovascular complications."
            ),
            (
                "First-line Pharmacotherapy: Lifestyle management combined with Metformin and/or SGLT2 inhibitors "
                "or GLP-1 receptor agonists with proven cardiovascular/renal benefit. For patients with established "
                "atherosclerotic cardiovascular disease (ASCVD), heart failure, or chronic kidney disease (CKD), an "
                "SGLT2 inhibitor (e.g. Empagliflozin, Dapagliflozin) or GLP-1 RA (e.g. Semaglutide, Dulaglutide) "
                "should be initiated regardless of baseline HbA1c or metformin use."
            ),
            (
                "Hypoglycemia Management Protocol: Level 1 hypoglycemia is defined as blood glucose < 70 mg/dL "
                "(3.9 mmol/L). Level 2 is < 54 mg/dL (3.0 mmol/L). Clinical rule of 15: Administer 15 grams of fast-acting "
                "carbohydrates (e.g. 4 oz fruit juice, 3-4 glucose tablets), recheck capillary blood glucose in 15 minutes, "
                "and repeat if blood glucose remains below 70 mg/dL. Prescribe emergency glucagon for all patients at "
                "elevated risk of Level 2 or Level 3 hypoglycemia."
            ),
        ],
    },
    {
        "source_title": "ACC/AHA 2023 Guideline for High Blood Pressure",
        "topic": "hypertension",
        "source_url": "https://www.ahajournals.org/doi/10.1161/HYP.0000000000000065",
        "metadata": {"organization": "ACC/AHA", "year": 2023, "evidence_grade": "Class 1A"},
        "chunks": [
            (
                "Blood Pressure Categorization: Normal BP is systolic < 120 mmHg and diastolic < 80 mmHg. "
                "Elevated BP is systolic 120-129 mmHg and diastolic < 80 mmHg. Stage 1 Hypertension is systolic "
                "130-139 mmHg or diastolic 80-89 mmHg. Stage 2 Hypertension is systolic >= 140 mmHg or diastolic >= 90 mmHg. "
                "Target BP is < 130/80 mmHg for all confirmed hypertensive adults with clinical CVD or 10-year ASCVD risk >= 10%."
            ),
            (
                "First-Line Antihypertensive Agents: Initial first-line therapy includes Thiazide/thiazide-like diuretics "
                "(Chlorthalidone, Hydrochlorothiazide), Calcium Channel Blockers (Amlodipine, Nifedipine), and ACE Inhibitors "
                "(Lisinopril, Enalapril) or ARBs (Losartan, Valsartan). In patients with Stage 2 Hypertension and BP >= 20/10 mmHg "
                "above goal, initiation with two first-line agents of different pharmacological classes is recommended."
            ),
            (
                "Hypertensive Crises and Urgent Triage: Hypertensive Crisis is defined as systolic BP > 180 mmHg and/or "
                "diastolic BP > 120 mmHg. In the absence of target organ damage (acute kidney injury, intracranial hemorrhage, "
                "aortic dissection, acute pulmonary edema), acute parenteral reduction is contraindicated; oral medication "
                "adjustment with outpatient follow-up within 24-72 hours is indicated. Immediate emergency hospitalization is "
                "mandatory if acute target organ damage is present."
            ),
        ],
    },
    {
        "source_title": "KDIGO 2024 Clinical Practice Guideline for CKD",
        "topic": "chronic_kidney_disease",
        "source_url": "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
        "metadata": {"organization": "KDIGO", "year": 2024, "evidence_grade": "Grade 1A"},
        "chunks": [
            (
                "Evaluation and Staging: Chronic Kidney Disease is defined as abnormalities of kidney structure or function, "
                "present for > 3 months, with implications for health. Staged by eGFR (G1: >= 90, G2: 60-89, G3a: 45-59, "
                "G3b: 30-44, G4: 15-29, G5: < 15 mL/min/1.73m²) and Albuminuria UACR (A1: < 30 mg/g, A2: 30-299 mg/g, "
                "A3: >= 300 mg/g). Both eGFR and UACR must be tracked semiannually in chronic kidney patients."
            ),
            (
                "Renal Protection and Pharmacotherapy: Initiate SGLT2 inhibitors (Empagliflozin, Dapagliflozin) for adults "
                "with CKD and eGFR >= 20 mL/min/1.73m² and UACR >= 200 mg/g to delay renal progression and reduce cardiovascular "
                "mortality. Initiate ACEi or ARB at highest tolerated dose in patients with hypertension and UACR >= 30 mg/g. "
                "Do not combine ACEi and ARB due to hyperkalemia and acute kidney injury risks."
            ),
        ],
    },
    {
        "source_title": "AHA/ACC 2023 Cholesterol Management Guidelines",
        "topic": "dyslipidemia",
        "source_url": "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
        "metadata": {"organization": "AHA/ACC", "year": 2023, "evidence_grade": "Class 1A"},
        "chunks": [
            (
                "Statin Intensity and Primary Prevention: High-intensity statin therapy (Atorvastatin 40-80 mg, Rosuvastatin "
                "20-40 mg) lowers LDL-C by >= 50%. Moderate-intensity statin therapy (Atorvastatin 10-20 mg, Rosuvastatin 5-10 mg, "
                "Simvastatin 20-40 mg) lowers LDL-C by 30% to 49%. In adults aged 40-75 with diabetes mellitus, moderate-intensity "
                "statin therapy is indicated regardless of estimated 10-year ASCVD risk."
            ),
            (
                "Secondary Prevention Thresholds: In patients with established clinical ASCVD, high-intensity statin therapy is "
                "indicated with a target LDL-C < 55 mg/dL. If LDL-C remains >= 70 mg/dL on maximum tolerated statin, add Ezetimibe "
                "10 mg daily. In very high-risk ASCVD, addition of a PCSK9 inhibitor (Evolocumab, Alirocumab) is recommended."
            ),
        ],
    },
]


async def seed_knowledge_base():
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        print("[!] GEMINI_API_KEY is not set. Please export GEMINI_API_KEY to generate real 768-dim embeddings.")
        return

    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    print(f"[*] Seeding clinical guidelines into {supabase_url} ...")
    total_chunks = 0

    async with httpx.AsyncClient(timeout=45.0) as client:
        for guideline in GUIDELINES:
            source_title = guideline["source_title"]
            topic = guideline["topic"]
            metadata = guideline["metadata"]
            source_url = guideline.get("source_url")

            for chunk_idx, chunk_text in enumerate(guideline["chunks"]):
                print(f" -> Generating 768d embedding for: {source_title} [Chunk {chunk_idx}]")
                vector = await generate_gemini_embedding(f"{topic}: {chunk_text}")

                row = {
                    "id": str(uuid.uuid4()),
                    "source_title": source_title,
                    "source_url": source_url,
                    "topic": topic,
                    "chunk_index": chunk_idx,
                    "chunk_content": chunk_text,
                    "token_count": len(chunk_text.split()),
                    "embedding": vector,
                    "metadata": metadata,
                }

                res = await client.post(
                    f"{supabase_url}/rest/v1/medical_knowledge_embeddings",
                    headers=headers,
                    json=row,
                )
                if res.status_code in (200, 201):
                    total_chunks += 1
                else:
                    print(f"    [!] Error inserting chunk: {res.text}")

    print(f"[✓] Successfully ingested {total_chunks} clinical guideline chunks into pgvector database!")


if __name__ == "__main__":
    asyncio.run(seed_knowledge_base())
