"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { assignLead, updateLeadStatus, addNote } from "@/lib/leadService";
import { prisma } from "@/lib/prisma";
import type { LeadStatus } from "@prisma/client";

// Server actions used directly by the dashboard UI. They call the exact
// same service-layer functions as the JSON API routes - one source of
// truth for business logic, two entry points (UI + documented API).

export async function assignLeadAction(leadId: string, assignedToId: string | null) {
  const user = await getCurrentUser();
  await assignLead(user, leadId, assignedToId);
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function updateStatusAction(leadId: string, status: LeadStatus) {
  const user = await getCurrentUser();
  await updateLeadStatus(user, leadId, status);
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function addNoteAction(leadId: string, body: string) {
  const user = await getCurrentUser();
  await addNote(user, leadId, body);
  revalidatePath(`/dashboard/leads/${leadId}`);
}

/**
 * Self-serve admin promotion, gated by a shared invite code rather than
 * open self-signup. This exists so anyone evaluating this project (or a
 * real team, in practice) can become an Admin without needing direct
 * database access from a developer - while still requiring something more
 * than "I signed up" to hold the Admin role. Set ADMIN_INVITE_CODE in .env;
 * a demo default is used if it's unset so this works out of the box.
 */
export async function claimAdminAction(code: string): Promise<{ success: boolean; message: string }> {
  const user = await getCurrentUser(); // ensures a MEMBER row exists first
  const expected = process.env.ADMIN_INVITE_CODE || "leadflow-admin-2026";

  if (user.role === "ADMIN") {
    return { success: true, message: "You're already an Admin." };
  }

  if (code.trim() !== expected) {
    return { success: false, message: "That code isn't right. Check the README for the demo invite code." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  revalidatePath("/dashboard");
  return { success: true, message: "You're an Admin now. Head to the dashboard." };
}
