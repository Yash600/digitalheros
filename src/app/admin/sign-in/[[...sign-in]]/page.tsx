import { SignIn } from "@clerk/nextjs";

// Deliberately not linked from the public marketing nav - reachable only by
// direct URL. This is a UX/entry-point separation, not a separate security
// boundary: admin accounts are never created via self-serve sign-up (there
// is no sign-up link here), only promoted manually in the database. The
// actual permission enforcement happens server-side on every request based
// on the `role` column (see src/lib/auth.ts), regardless of which sign-in
// page was used to authenticate.
export default function AdminSignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-forest">Admin access</p>
      <SignIn path="/admin/sign-in" routing="path" signUpUrl="/admin/sign-up" forceRedirectUrl="/dashboard" />
    </main>
  );
}
