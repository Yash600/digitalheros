"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function LeadCaptureForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      projectDetails: (form.elements.namedItem("projectDetails") as HTMLTextAreaElement).value
    };

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json?.error?.message ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card-surface rounded-2xl p-8">
        <p className="text-lg font-semibold text-forest">Thanks — we&apos;ve got it.</p>
        <p className="mt-2 text-sm text-ink/70">
          Your project details just landed in our pipeline. A member of the team will follow up shortly.
        </p>
        <button className="btn-secondary mt-6 text-sm" onClick={() => setStatus("idle")}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface rounded-2xl p-6 sm:p-8 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="name" placeholder="Name" required className="field-input" />
        <input name="email" type="email" placeholder="Email" required className="field-input" />
      </div>
      <input name="phone" placeholder="Phone (optional)" className="field-input" />
      <textarea
        name="projectDetails"
        placeholder="About your project"
        rows={4}
        className="field-input resize-none"
      />
      {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto">
        {status === "submitting" ? "Submitting…" : "Submit project"}
      </button>
    </form>
  );
}
