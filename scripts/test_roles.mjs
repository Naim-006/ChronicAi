import assert from "node:assert";

/**
 * Pure role derivation function matching AuthContext logic
 */
function deriveRoles({ doctorProfile, clinics }) {
  const isDoctor = Boolean(
    doctorProfile &&
      doctorProfile.verification_status === "verified" &&
      doctorProfile.is_active
  );

  const isPendingDoctor = Boolean(
    doctorProfile && doctorProfile.verification_status === "pending"
  );

  const isAssistant = Boolean(
    Array.isArray(clinics) &&
      clinics.some(
        (c) => c.is_active && (c.role === "assistant" || c.role === "admin")
      )
  );

  const roles = ["patient"];
  if (isDoctor) roles.push("doctor");
  if (isAssistant) roles.push("assistant");

  return { roles, isDoctor, isPendingDoctor, isAssistant };
}

/**
 * Pure route guard decision logic matching (doctor)/layout.tsx
 */
function evaluateDoctorRouteGuard({
  user,
  pathname,
  isDoctor,
  isPendingDoctor,
}) {
  const isPublicDoctorRoute =
    pathname === "/doctor/register" || pathname === "/doctor/pending";

  if (!user) {
    return {
      action: "redirect",
      destination: `/login?redirectTo=${encodeURIComponent(pathname)}`,
    };
  }

  if (isPublicDoctorRoute) {
    if (isDoctor && pathname === "/doctor/register") {
      return { action: "redirect", destination: "/doctor/dashboard" };
    }
    return { action: "allow" };
  }

  if (!isDoctor) {
    if (isPendingDoctor) {
      return { action: "redirect", destination: "/doctor/pending" };
    }
    return { action: "redirect", destination: "/doctor/register" };
  }

  return { action: "allow" };
}

console.log("Running Doctor Portal Role & Guard Tests...\n");

// Test 1: Standard Patient (No doctor profile, no staff)
{
  const res = deriveRoles({ doctorProfile: null, clinics: [] });
  assert.deepStrictEqual(res.roles, ["patient"]);
  assert.strictEqual(res.isDoctor, false);
  assert.strictEqual(res.isPendingDoctor, false);
  assert.strictEqual(res.isAssistant, false);
  console.log("✔ Test 1 Passed: Standard patient role derived correctly");
}

// Test 2: Pending Doctor Profile
{
  const res = deriveRoles({
    doctorProfile: { verification_status: "pending", is_active: true },
    clinics: [],
  });
  assert.deepStrictEqual(res.roles, ["patient"]);
  assert.strictEqual(res.isDoctor, false);
  assert.strictEqual(res.isPendingDoctor, true);
  console.log("✔ Test 2 Passed: Pending doctor does not gain doctor role");
}

// Test 3: Verified Doctor Profile
{
  const res = deriveRoles({
    doctorProfile: { verification_status: "verified", is_active: true },
    clinics: [],
  });
  assert.deepStrictEqual(res.roles, ["patient", "doctor"]);
  assert.strictEqual(res.isDoctor, true);
  assert.strictEqual(res.isPendingDoctor, false);
  console.log("✔ Test 3 Passed: Verified doctor gains doctor role alongside patient");
}

// Test 4: Inactive Verified Doctor (e.g. suspended)
{
  const res = deriveRoles({
    doctorProfile: { verification_status: "verified", is_active: false },
    clinics: [],
  });
  assert.deepStrictEqual(res.roles, ["patient"]);
  assert.strictEqual(res.isDoctor, false);
  console.log("✔ Test 4 Passed: Inactive doctor loses doctor privileges");
}

// Test 5: Assistant Staff
{
  const res = deriveRoles({
    doctorProfile: null,
    clinics: [{ role: "assistant", is_active: true }],
  });
  assert.deepStrictEqual(res.roles, ["patient", "assistant"]);
  assert.strictEqual(res.isDoctor, false);
  assert.strictEqual(res.isAssistant, true);
  console.log("✔ Test 5 Passed: Clinic assistant role derived correctly");
}

// Test 6: Multi-role (Doctor + Assistant)
{
  const res = deriveRoles({
    doctorProfile: { verification_status: "verified", is_active: true },
    clinics: [{ role: "assistant", is_active: true }],
  });
  assert.deepStrictEqual(res.roles, ["patient", "doctor", "assistant"]);
  assert.strictEqual(res.isDoctor, true);
  assert.strictEqual(res.isAssistant, true);
  console.log("✔ Test 6 Passed: Multi-role user retains all valid roles");
}

// Test 7: Guard - Unauthenticated User
{
  const guard = evaluateDoctorRouteGuard({
    user: null,
    pathname: "/doctor/dashboard",
    isDoctor: false,
    isPendingDoctor: false,
  });
  assert.strictEqual(guard.action, "redirect");
  assert.strictEqual(
    guard.destination,
    "/login?redirectTo=%2Fdoctor%2Fdashboard"
  );
  console.log("✔ Test 7 Passed: Unauthenticated user redirected to login with redirect path");
}

// Test 8: Guard - Patient visiting /doctor/dashboard redirected to registration
{
  const guard = evaluateDoctorRouteGuard({
    user: { id: "p1" },
    pathname: "/doctor/dashboard",
    isDoctor: false,
    isPendingDoctor: false,
  });
  assert.strictEqual(guard.action, "redirect");
  assert.strictEqual(guard.destination, "/doctor/register");
  console.log("✔ Test 8 Passed: Non-doctor user guided to register");
}

// Test 9: Guard - Pending Doctor visiting /doctor/dashboard redirected to pending
{
  const guard = evaluateDoctorRouteGuard({
    user: { id: "p1" },
    pathname: "/doctor/dashboard",
    isDoctor: false,
    isPendingDoctor: true,
  });
  assert.strictEqual(guard.action, "redirect");
  assert.strictEqual(guard.destination, "/doctor/pending");
  console.log("✔ Test 9 Passed: Pending doctor guided to pending verification screen");
}

// Test 10: Guard - Verified Doctor visiting /doctor/dashboard allowed
{
  const guard = evaluateDoctorRouteGuard({
    user: { id: "d1" },
    pathname: "/doctor/dashboard",
    isDoctor: true,
    isPendingDoctor: false,
  });
  assert.strictEqual(guard.action, "allow");
  console.log("✔ Test 10 Passed: Verified doctor granted access to clinical dashboard");
}

// Test 11: Guard - Verified Doctor on /doctor/register redirected to dashboard
{
  const guard = evaluateDoctorRouteGuard({
    user: { id: "d1" },
    pathname: "/doctor/register",
    isDoctor: true,
    isPendingDoctor: false,
  });
  assert.strictEqual(guard.action, "redirect");
  assert.strictEqual(guard.destination, "/doctor/dashboard");
  console.log("✔ Test 11 Passed: Already verified doctor redirected away from register to dashboard");
}

console.log("\nAll 11 unit assertions passed with 0 errors!");
