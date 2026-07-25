import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { createNoteSchema } from "@/lib/validation";
import { addNote } from "@/lib/leadService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const parsed = createNoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }
    const note = await addNote(user, id, parsed.data.body);
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: err.message } }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: err.message } }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } }, { status: 500 });
  }
}
