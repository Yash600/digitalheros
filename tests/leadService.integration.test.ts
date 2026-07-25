import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createPublicLead,
  assignLead,
  updateLeadStatus,
  addNote,
  getLead,
  listLeads
} from "@/lib/leadService";
import { ForbiddenError } from "@/lib/auth";

// These tests hit a real (throwaway) Postgres database - see README/CI for
// how DATABASE_URL is provisioned. They cover the two core flows called out
// in the task brief: the full lead lifecycle, and permission boundaries
// between ADMIN and MEMBER.
const skip = !process.env.DATABASE_URL;

describe.skipIf(skip)("lead lifecycle (integration)", () => {
  let admin: any;
  let member: any;
  let otherMember: any;

  beforeAll(async () => {
    admin = await prisma.user.create({
      data: { clerkId: `test-admin-${Date.now()}`, email: `admin-${Date.now()}@test.dev`, role: "ADMIN" }
    });
    member = await prisma.user.create({
      data: { clerkId: `test-member-${Date.now()}`, email: `member-${Date.now()}@test.dev`, role: "MEMBER" }
    });
    otherMember = await prisma.user.create({
      data: { clerkId: `test-other-${Date.now()}`, email: `other-${Date.now()}@test.dev`, role: "MEMBER" }
    });
  });

  afterAll(async () => {
    await prisma.leadActivity.deleteMany({});
    await prisma.leadNote.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, member.id, otherMember.id] } } });
    await prisma.$disconnect();
  });

  it("runs the full flow: create -> assign -> note -> status changes -> activity trail", async () => {
    const lead = await createPublicLead({ name: "Integration Test", email: "it@example.com" });
    expect(lead.status).toBe("NEW");

    await assignLead(admin, lead.id, member.id);
    await addNote(member, lead.id, "First contact made by phone.");
    await updateLeadStatus(member, lead.id, "CONTACTED");
    await updateLeadStatus(member, lead.id, "QUALIFIED");

    const full = await getLead(admin, lead.id);
    expect(full?.status).toBe("QUALIFIED");
    expect(full?.notes.length).toBe(1);
    expect(full?.activities.length).toBe(5); // created, assigned, note, 2x status change
  });

  it("prevents a member from acting on a lead assigned to someone else", async () => {
    const lead = await createPublicLead({ name: "Boundary Test", email: "boundary@example.com" });
    await assignLead(admin, lead.id, otherMember.id);

    await expect(getLead(member, lead.id)).rejects.toThrow(ForbiddenError);
    await expect(updateLeadStatus(member, lead.id, "CONTACTED")).rejects.toThrow(ForbiddenError);
  });

  it("prevents a member from reassigning a lead", async () => {
    const lead = await createPublicLead({ name: "Assign Guard", email: "guard@example.com" });
    await expect(assignLead(member, lead.id, member.id)).rejects.toThrow(ForbiddenError);
  });

  it("scopes listLeads so a member only ever sees their own assigned leads", async () => {
    const lead = await createPublicLead({ name: "Scope Test", email: "scope@example.com" });
    await assignLead(admin, lead.id, member.id);

    const memberView = await listLeads(member, { page: 1, limit: 50 });
    expect(memberView.items.every((l) => l.assignedToId === member.id)).toBe(true);

    const adminView = await listLeads(admin, { page: 1, limit: 50 });
    expect(adminView.total).toBeGreaterThanOrEqual(memberView.total);
  });
});
