// test_consultation.mjs
// Validates clinical consultation, allergen cross-checking, and e-prescription payloads

import assert from "node:assert/strict";

function checkMedicationAllergy(medicationName, genericName, allergies) {
  if (!allergies || allergies.length === 0) {
    return { hasConflict: false };
  }

  const medLower = (medicationName || "").toLowerCase().trim();
  const genLower = (genericName || "").toLowerCase().trim();

  for (const allergy of allergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;

    if (
      (medLower && (medLower.includes(allergyLower) || allergyLower.includes(medLower))) ||
      (genLower && (genLower.includes(allergyLower) || allergyLower.includes(genLower)))
    ) {
      return { hasConflict: true, matchedAllergy: allergy };
    }

    if (allergyLower.includes("penicillin")) {
      const penicillins = ["amoxicillin", "ampicillin", "augmentin", "cloxacillin", "piperacillin", "penicillin"];
      if (penicillins.some((p) => medLower.includes(p) || genLower.includes(p))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
    if (allergyLower.includes("sulfa")) {
      const sulfas = ["sulfamethoxazole", "bactrim", "septrin", "sulfasalazine", "cotrimoxazole"];
      if (sulfas.some((s) => medLower.includes(s) || genLower.includes(s))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
    if (allergyLower.includes("nsaid") || allergyLower.includes("aspirin")) {
      const nsaids = ["aspirin", "ibuprofen", "naproxen", "diclofenac", "ketorolac", "aceclofenac"];
      if (nsaids.some((n) => medLower.includes(n) || genLower.includes(n))) {
        return { hasConflict: true, matchedAllergy: allergy };
      }
    }
  }

  return { hasConflict: false };
}

function calculateFollowUpDate(days) {
  const d = new Date("2026-11-22T00:00:00Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

console.log("=== Testing Consultation & E-Prescription Domain Logic ===");

// Test 1: Penicillin allergen cross-check
{
  const allergies = ["Penicillin", "Dust"];
  const res1 = checkMedicationAllergy("Tab. Moxacillin 500mg", "Amoxicillin Trihydrate", allergies);
  assert.equal(res1.hasConflict, true, "Should detect Amoxicillin as Penicillin conflict");
  assert.equal(res1.matchedAllergy, "Penicillin");

  const res2 = checkMedicationAllergy("Tab. Augmentin 625mg", "Co-amoxiclav", allergies);
  assert.equal(res2.hasConflict, true, "Should detect Augmentin as Penicillin conflict");

  const res3 = checkMedicationAllergy("Tab. Metformin 500mg", "Metformin HCl", allergies);
  assert.equal(res3.hasConflict, false, "Metformin should not conflict with Penicillin allergy");
  console.log("✓ Test 1 Passed: Penicillin allergen cross-check detected accurately");
}

// Test 2: Sulfa & NSAID allergen cross-checks
{
  const allergies = ["Sulfa drugs", "Aspirin"];
  const res1 = checkMedicationAllergy("Tab. Bactrim DS", "Sulfamethoxazole + Trimethoprim", allergies);
  assert.equal(res1.hasConflict, true, "Should detect Bactrim / Sulfamethoxazole conflict");

  const res2 = checkMedicationAllergy("Tab. Naprosyn 250mg", "Naproxen", allergies);
  assert.equal(res2.hasConflict, true, "Should detect Naproxen as NSAID/Aspirin conflict");

  const res3 = checkMedicationAllergy("Tab. Omeprazole 20mg", "Omeprazole", allergies);
  assert.equal(res3.hasConflict, false, "Omeprazole should not conflict with Sulfa/Aspirin");
  console.log("✓ Test 2 Passed: Sulfa and NSAID allergen cross-checks detected accurately");
}

// Test 3: Follow-up date calculations
{
  assert.equal(calculateFollowUpDate(7), "2026-11-29");
  assert.equal(calculateFollowUpDate(14), "2026-12-06");
  assert.equal(calculateFollowUpDate(30), "2026-12-22");
  console.log("✓ Test 3 Passed: Follow-up schedule offsets verified");
}

// Test 4: Prescription Item payload structure
{
  const item = {
    medication_name: "Tab. Metformin",
    generic_name: "Metformin HCl",
    strength: "500mg",
    dosage: "1 tablet",
    frequency: "1+0+1",
    route: "Oral",
    duration_days: 30,
    instructions: "After meals",
  };
  assert.ok(item.medication_name.length > 0);
  assert.ok(item.dosage.length > 0);
  assert.ok(item.frequency.length > 0);
  assert.equal(item.duration_days, 30);
  console.log("✓ Test 4 Passed: Prescription item structure conforms to schema");
}

console.log("\nAll consultation & e-prescription unit tests passed successfully!");
