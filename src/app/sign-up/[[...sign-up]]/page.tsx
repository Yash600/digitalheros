import { SignUp } from "@clerk/nextjs";

// Self-serve sign-up always produces a MEMBER account (see the Clerk webhook
// handler, src/app/api/webhooks/clerk/route.ts, which hardcodes role:
// "MEMBER" on user.created). There is no public admin sign-up - admins are
// only ever created by promoting an existing account in the database.
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
    </main>
  );
}
