import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
      <Link href="/admin/sign-in" className="text-xs text-ink/40 underline decoration-line hover:text-forest">
        Admin sign in
      </Link>
    </main>
  );
}
