import { NextRequest, NextResponse } from "next/server";
import { publicLeadSchema } from "@/lib/validation";
import { createPublicLead } from "@/lib/leadService";

// Unauthenticated endpoint. Deliberately minimal: only creates a lead,
// never reads. This is the one route the public capture form talks to.
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 }
    );
  }

  const parsed = publicLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input", issues: parsed.error.issues } },
      { status: 400 }
    );
  }

  try {
    const lead = await createPublicLead(parsed.data);
    return NextResponse.json({ data: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (err) {
    console.error("public lead creation failed", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not create lead" } },
      { status: 500 }
    );
  }
}
