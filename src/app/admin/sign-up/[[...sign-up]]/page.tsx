import { SignUp } from "@clerk/nextjs";

// Creates a normal Clerk account (same identity provider as /sign-up), then
// routes to /admin/claim - becoming an Admin still requires the invite code
// there. This route just exists so evaluators/testers don't need direct
// database access to try the Admin experience.
export default function AdminSignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-forest">Admin sign up</p>
      <SignUp path="/admin/sign-up" routing="path" signInUrl="/admin/sign-in" forceRedirectUrl="/admin/claim" />
    </main>
  );
}
