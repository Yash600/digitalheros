"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimAdminAction } from "@/lib/actions";

export function ClaimForm({ demoCode }: { demoCode: string }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await claimAdminAction(code);
      setResult(res);
      if (res.success) {
        setTimeout(() => router.push("/dashboard"), 900);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface w-full max-w-sm rounded-2xl p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-forest">Team access</p>
      <h1 className="display-headline mt-3 text-2xl">Claim admin access</h1>
      <p className="mt-3 text-sm text-ink/70">
        Enter the admin invite code (see the project README) to promote your account.
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        required
        className="field-input mt-6 text-center"
      />
      <p className="mt-2 text-xs text-ink/40">
        Demo code: <span className="font-mono text-ink/60">{demoCode}</span>
      </p>
      {result && (
        <p className={`mt-3 text-sm ${result.success ? "text-forest" : "text-red-700"}`}>{result.message}</p>
      )}
      <button type="submit" disabled={isPending} className="btn-primary mt-6 w-full">
        {isPending ? "Checking…" : "Claim access"}
      </button>
    </form>
  );
}
