import assert from "node:assert";

/**
 * Pure Queue Triage & Search Logic Tests
 */

function sortQueueByTriage(items) {
  const priorityWeight = {
    emergency: 3,
    urgent: 2,
    normal: 1,
  };

  return [...items].sort((a, b) => {
    const diff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (diff !== 0) return diff;
    return a.serial_number - b.serial_number;
  });
}

function filterQueueByStatus(items, statusFilter) {
  if (statusFilter === "all") {
    return items.filter((i) => i.status !== "cancelled");
  }
  return items.filter((i) => i.status === statusFilter);
}

function filterPatients(patients, query) {
  if (!query || !query.trim()) return patients;
  const q = query.trim().toLowerCase();
  return patients.filter(
    (p) =>
      p.patient_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q)
  );
}

console.log("Running Live Queue & Patient Search Unit Tests...\n");

// Test 1: Triage Priority Ordering
{
  const testQueue = [
    { serial_number: 1, priority: "normal", status: "waiting" },
    { serial_number: 2, priority: "urgent", status: "waiting" },
    { serial_number: 3, priority: "emergency", status: "waiting" },
    { serial_number: 4, priority: "normal", status: "waiting" },
    { serial_number: 5, priority: "urgent", status: "waiting" },
  ];

  const sorted = sortQueueByTriage(testQueue);
  assert.strictEqual(sorted[0].serial_number, 3); // Emergency first
  assert.strictEqual(sorted[1].serial_number, 2); // Urgent #2 before Urgent #5
  assert.strictEqual(sorted[2].serial_number, 5); // Urgent #5
  assert.strictEqual(sorted[3].serial_number, 1); // Normal #1
  assert.strictEqual(sorted[4].serial_number, 4); // Normal #4
  console.log("✔ Test 1 Passed: Triage ordering accurately prioritizes emergency and urgent patients");
}

// Test 2: Status Tab Filtering
{
  const mixedQueue = [
    { id: "1", status: "waiting" },
    { id: "2", status: "in_progress" },
    { id: "3", status: "completed" },
    { id: "4", status: "cancelled" },
    { id: "5", status: "waiting" },
  ];

  const allActive = filterQueueByStatus(mixedQueue, "all");
  assert.strictEqual(allActive.length, 4); // excludes cancelled

  const waiting = filterQueueByStatus(mixedQueue, "waiting");
  assert.strictEqual(waiting.length, 2);

  const inProgress = filterQueueByStatus(mixedQueue, "in_progress");
  assert.strictEqual(inProgress.length, 1);
  assert.strictEqual(inProgress[0].id, "2");

  const completed = filterQueueByStatus(mixedQueue, "completed");
  assert.strictEqual(completed.length, 1);
  console.log("✔ Test 2 Passed: Status filtering separates waiting, in-progress and completed queues");
}

// Test 3: Patient Directory Instant Search
{
  const directory = [
    { patient_name: "Anisur Rahman", patient_code: "CA-ANIS-9102" },
    { patient_name: "Bilkis Banu", patient_code: "CA-BILK-3341" },
    { patient_name: "Chanchal Das", patient_code: "CA-CHAN-8715" },
    { patient_name: "Dilruba Yasmin", patient_code: "CA-DILR-4429" },
  ];

  const byName = filterPatients(directory, "bilkis");
  assert.strictEqual(byName.length, 1);
  assert.strictEqual(byName[0].patient_name, "Bilkis Banu");

  const byCode = filterPatients(directory, "CA-CHAN");
  assert.strictEqual(byCode.length, 1);
  assert.strictEqual(byCode[0].patient_name, "Chanchal Das");

  const byCodeLowercase = filterPatients(directory, "ca-dilr");
  assert.strictEqual(byCodeLowercase.length, 1);
  assert.strictEqual(byCodeLowercase[0].patient_name, "Dilruba Yasmin");

  const noMatch = filterPatients(directory, "Unknown");
  assert.strictEqual(noMatch.length, 0);

  console.log("✔ Test 3 Passed: Case-insensitive instant search matches names and patient codes");
}

console.log("\nAll 3 queue unit test suites passed with 0 errors!");
