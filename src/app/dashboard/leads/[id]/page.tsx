import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLead, canTransition, canAssign } from "@/lib/leadService";
import { prisma } from "@/lib/prisma";
import { assignLeadAction, updateStatusAction, addNoteAction } from "@/lib/actions";
import { ALLOWED_TRANSITIONS } from "@/lib/validation";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const lead = await getLead(user, id).catch(() => null);
  if (!lead) notFound();

  const members = canAssign(user.role)
    ? await prisma.user.findMany({ orderBy: { name: "asc" } })
    : [];

  const nextStatuses = ALLOWED_TRANSITIONS[lead.status] ?? [];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="display-headline text-3xl">{lead.name}</h1>
          <p className="mt-1 text-sm text-ink/60">{lead.email} · {lead.phone ?? "no phone"}</p>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Project details</h2>
          <p className="mt-2 text-sm">{lead.projectDetails ?? "No details provided."}</p>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/60">Notes</h2>
          <div className="space-y-4">
            {lead.notes.map((note) => (
              <div key={note.id} className="border-b border-line pb-3 last:border-0">
                <p className="text-sm">{note.body}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {note.author.name ?? note.author.email} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {lead.notes.length === 0 && <p className="text-sm text-ink/50">No notes yet.</p>}
          </div>
          <form
            action={async (formData: FormData) => {
              "use server";
              const body = String(formData.get("body") ?? "").trim();
              if (body) await addNoteAction(lead.id, body);
            }}
            className="mt-4 flex gap-2"
          >
            <input name="body" placeholder="Add a note…" required className="field-input" />
            <button type="submit" className="btn-primary text-sm">Add</button>
          </form>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink/60">Activity trail</h2>
          <ul className="space-y-3">
            {lead.activities.map((a) => (
              <li key={a.id} className="text-sm text-ink/70">
                <span className="font-semibold text-ink">{a.type.replace("_", " ")}</span>
                {a.actor ? ` · ${a.actor.name ?? a.actor.email}` : ""} ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card-surface rounded-2xl p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">Status</h2>
          <p className="mb-3 text-lg font-bold">{lead.status}</p>
          {nextStatuses.length > 0 ? (
            <form className="flex flex-wrap gap-2">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  formAction={async () => {
                    "use server";
                    await updateStatusAction(lead.id, s as any);
                  }}
                  className="btn-secondary text-xs"
                >
                  Move to {s}
                </button>
              ))}
            </form>
          ) : (
            <p className="text-xs text-ink/50">No further transitions from this status.</p>
          )}
        </div>

        {canAssign(user.role) && (
          <div className="card-surface rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/60">Assigned to</h2>
            <form
              action={async (formData: FormData) => {
                "use server";
                const value = String(formData.get("assignedToId") ?? "");
                await assignLeadAction(lead.id, value || null);
              }}
              className="flex gap-2"
            >
              <select name="assignedToId" defaultValue={lead.assignedToId ?? ""} className="field-input">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email} ({m.role})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary text-sm">Save</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
