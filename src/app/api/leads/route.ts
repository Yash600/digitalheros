import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { listLeadsQuerySchema } from "@/lib/validation";
import { listLeads } from "@/lib/leadService";

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

// GET /api/leads?status=&assignedToId=&page=&limit=
// Members only ever receive leads assigned to them - enforced in the
// service layer's query, not filtered after the fact.
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const parsed = listLeadsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      assignedToId: searchParams.get("assignedToId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message } },
        { status: 400 }
      );
    }
    const result = await listLeads(user, parsed.data);
    return NextResponse.json({ data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
  } catch (err) {
    return errorResponse(err);
  }
}
