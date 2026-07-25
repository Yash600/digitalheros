import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";

export default async function HomePage() {
  // If you're already signed in, this public marketing/capture page isn't
  // for you - send straight to the dashboard instead of showing the form
  // you'd otherwise see as a logged-out visitor.
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-extrabold tracking-tight">
          lead<span className="text-forest">flow</span>
          <span className="accent-italic text-forest">.</span>
        </span>
        <nav className="flex items-center gap-1 rounded-pill border border-line bg-card/60 p-1">
          <Link href="/sign-in" className="pill-nav-item font-semibold">
            Member Sign In
          </Link>
          <Link href="/admin/sign-in" className="pill-nav-item font-semibold">
            Admin Sign In
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 pb-24 pt-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-forest">
            Built for Digital Heroes · Full Stack Task
          </p>
          <h1 className="display-headline text-5xl sm:text-6xl">
            Never lose
            <br />
            a lead <span className="accent-italic normal-case">again.</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-ink/70">
            Tell us about your project below. It lands directly in our sales team&apos;s
            pipeline — assigned, tracked, and followed up on, every time.
          </p>
          <div className="mt-10">
            <LeadCaptureForm />
          </div>
        </div>

        <div className="card-surface relative rounded-3xl p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest">What happens next</p>
          <ol className="mt-6 space-y-5 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">1</span>
              <span>Your submission is created in our pipeline instantly, status <b>New</b>.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">2</span>
              <span>An admin assigns it to a team member within one business day.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">3</span>
              <span>Every note, status change, and reassignment is logged to a full activity trail.</span>
            </li>
          </ol>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 text-center">
            <div>
              <p className="text-2xl font-extrabold">2</p>
              <p className="text-xs text-ink/60">roles enforced server-side</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">100%</p>
              <p className="text-xs text-ink/60">actions activity-logged</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-xs text-ink/50">
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line hover:text-forest"
        >
          Built for Digital Heroes Training Task
        </a>
      </footer>
    </main>
  );
}
