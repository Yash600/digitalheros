import { prisma } from "./prisma";
import { ForbiddenError } from "./auth";
import { ALLOWED_TRANSITIONS } from "./validation";
import type { LeadStatus, Role, User } from "@prisma/client";

/**
 * Single service layer for all lead operations. Both /api/leads/* routes and
 * the dashboard server components/actions call these functions - business
 * logic lives here exactly once, not duplicated across route handlers and
 * UI code (this is the pattern Task B asks you to retrofit onto a legacy
 * app; here we do it correctly from day one).
 */

export function visibilityFilterFor(user: User) {
  // Admins see everything. Members only ever see leads assigned to them.
  // This is enforced in the query itself, not by filtering client-side.
  if (user.role === "ADMIN") return {};
  return { assignedToId: user.id };
}

export async function listLeads(
  user: User,
  opts: { status?: LeadStatus; assignedToId?: string; page: number; limit: number }
) {
  const where = {
    ...visibilityFilterFor(user),
    ...(opts.status ? { status: opts.status } : {}),
    // A member cannot use assignedToId to peek at someone else's leads;
    // their own visibility filter above already pins it to themselves.
    ...(user.role === "ADMIN" && opts.assignedToId ? { assignedToId: opts.assignedToId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
      include: { assignedTo: { select: { id: true, name: true, email: true } } }
    }),
    prisma.lead.count({ where })
  ]);

  return { items, total, page: opts.page, limit: opts.limit };
}

export async function getLead(user: User, leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      notes: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true, email: true } } } }
    }
  });
  if (!lead) return null;

  if (user.role !== "ADMIN" && lead.assignedToId !== user.id) {
    throw new ForbiddenError("You are not assigned to this lead");
  }
  return lead;
}

export async function createPublicLead(input: {
  name: string;
  email: string;
  phone?: string;
  projectDetails?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        projectDetails: input.projectDetails || null,
        source: "web_form",
        status: "NEW"
      }
    });
    await tx.leadActivity.create({
      data: { leadId: lead.id, type: "CREATED" }
    });
    return lead;
  });
}

export async function assignLead(user: User, leadId: string, assignedToId: string | null) {
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Only admins can reassign leads");
  }
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({
      where: { id: leadId },
      data: { assignedToId }
    });
    await tx.leadActivity.create({
      data: {
        leadId,
        actorId: user.id,
        type: "ASSIGNED",
        metadata: { assignedToId }
      }
    });
    return lead;
  });
}

export async function updateLeadStatus(user: User, leadId: string, nextStatus: LeadStatus) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  if (user.role !== "ADMIN" && lead.assignedToId !== user.id) {
    throw new ForbiddenError("You are not assigned to this lead");
  }

  const allowed = ALLOWED_TRANSITIONS[lead.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new ForbiddenError(`Cannot move a lead from ${lead.status} to ${nextStatus}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { status: nextStatus }
    });
    await tx.leadActivity.create({
      data: {
        leadId,
        actorId: user.id,
        type: "STATUS_CHANGED",
        metadata: { from: lead.status, to: nextStatus }
      }
    });
    return updated;
  });
}

export async function addNote(user: User, leadId: string, body: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  if (user.role !== "ADMIN" && lead.assignedToId !== user.id) {
    throw new ForbiddenError("You are not assigned to this lead");
  }

  return prisma.$transaction(async (tx) => {
    const note = await tx.leadNote.create({
      data: { leadId, authorId: user.id, body }
    });
    await tx.leadActivity.create({
      data: { leadId, actorId: user.id, type: "NOTE_ADDED", metadata: { noteId: note.id } }
    });
    return note;
  });
}

export function canTransition(current: LeadStatus, next: LeadStatus) {
  return (ALLOWED_TRANSITIONS[current] ?? []).includes(next);
}

export function canAssign(role: Role) {
  return role === "ADMIN";
}
