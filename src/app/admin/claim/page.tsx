import { ClaimForm } from "./ClaimForm";

export default function AdminClaimPage() {
  // Read from the server so the displayed code always matches whatever
  // ADMIN_INVITE_CODE is actually set to in this environment (falls back to
  // the documented demo default). Shown directly on the page since this is a
  // demo/evaluation gate, not a real secret - see README for the reasoning.
  const demoCode = process.env.ADMIN_INVITE_CODE || "leadflow-admin-2026";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <ClaimForm demoCode={demoCode} />
    </main>
  );
}
