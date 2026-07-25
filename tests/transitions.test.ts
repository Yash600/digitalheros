import { describe, it, expect } from "vitest";
import { ALLOWED_TRANSITIONS, publicLeadSchema, listLeadsQuerySchema } from "@/lib/validation";
import { canTransition, canAssign, visibilityFilterFor } from "@/lib/leadService";

describe("lead status transitions", () => {
  it("allows NEW -> CONTACTED", () => {
    expect(canTransition("NEW", "CONTACTED")).toBe(true);
  });

  it("rejects NEW -> WON (must go through CONTACTED and QUALIFIED first)", () => {
    expect(canTransition("NEW", "WON")).toBe(false);
  });

  it("rejects any transition out of WON (terminal state)", () => {
    expect(ALLOWED_TRANSITIONS.WON).toEqual([]);
  });

  it("allows re-opening a LOST lead back to NEW", () => {
    expect(canTransition("LOST", "NEW")).toBe(true);
  });
});

describe("role capability checks", () => {
  it("only ADMIN can assign leads", () => {
    expect(canAssign("ADMIN")).toBe(true);
    expect(canAssign("MEMBER")).toBe(false);
  });
});

describe("visibility filter", () => {
  it("gives admins an unrestricted filter", () => {
    const admin = { id: "u1", role: "ADMIN" } as any;
    expect(visibilityFilterFor(admin)).toEqual({});
  });

  it("scopes members to only their assigned leads", () => {
    const member = { id: "u2", role: "MEMBER" } as any;
    expect(visibilityFilterFor(member)).toEqual({ assignedToId: "u2" });
  });
});

describe("input validation", () => {
  it("rejects a public lead submission with an invalid email", () => {
    const result = publicLeadSchema.safeParse({ name: "Jordan", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid public lead submission", () => {
    const result = publicLeadSchema.safeParse({ name: "Jordan", email: "jordan@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects a name that is only whitespace", () => {
    const result = publicLeadSchema.safeParse({ name: "   ", email: "jordan@example.com" });
    expect(result.success).toBe(false);
  });

  it("defaults list query page/limit and caps limit at 100", () => {
    const result = listLeadsQuerySchema.safeParse({ limit: "500" });
    expect(result.success).toBe(false); // limit above max should fail validation
  });

  it("applies sane defaults when no query params are given", () => {
    const result = listLeadsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
