"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

// Catches errors thrown anywhere under /dashboard - in particular
// getCurrentUser()'s UnauthorizedError when a signed-in Clerk account has no
// matching row in our own User table yet (new sign-up, webhook hasn't landed,
// or an admin hasn't provisioned them). This is an expected state for a real
// product, not a crash - so it gets a real message instead of a stack trace.
export default function DashboardError({ error }: { error: Error & { digest?: string } }) {
  const notProvisioned = error.message?.toLowerCase().includes("not provisioned");
  const notSignedIn = error.message?.toLowerCase().includes("not signed in");

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card-surface max-w-md rounded-2xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-forest">
          {notProvisioned ? "Account not linked yet" : notSignedIn ? "Not signed in" : "Something went wrong"}
        </p>
        <h1 className="display-headline mt-3 text-2xl">
          {notProvisioned ? "Almost there." : "We hit a snag."}
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          {notProvisioned
            ? "Your account is signed in, but an admin hasn't added you to LeadFlow yet. Ask an admin to provision your account, then refresh this page."
            : notSignedIn
            ? "Please sign in to view the dashboard."
            : "That didn't work as expected. Try refreshing, or contact an admin if it keeps happening."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn-secondary text-sm">
            Back to home
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}
