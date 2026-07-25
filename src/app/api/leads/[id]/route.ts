import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { updateLeadSchema } from "@/lib/validation";
import { getLead, assignLead, updateLeadStatus } from "@/lib/leadService";

function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: err.message } }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: err.message } }, { status: 403 });
  }
  console.error(err);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } }, { status: 500 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const lead = await getLead(user, id);
    if (!lead) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Lead not found" } }, { status: 404 });
    }
    return NextResponse.json({ data: lead });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/leads/:id  { status?, assignedToId? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const parsed = updateLeadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }

    let lead;
    if (parsed.data.assignedToId !== undefined) {
      lead = await assignLead(user, id, parsed.data.assignedToId);
    }
    if (parsed.data.status) {
      lead = await updateLeadStatus(user, id, parsed.data.status);
    }
    if (!lead) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Provide status and/or assignedToId" } },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: lead });
  } catch (err) {
    return errorResponse(err);
  }
}
