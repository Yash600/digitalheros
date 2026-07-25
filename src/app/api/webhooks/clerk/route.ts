import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

// Clerk calls this on user.created / user.updated so our User table stays in
// sync with Clerk's account store. Configure this URL in the Clerk dashboard
// under Webhooks, and set CLERK_WEBHOOK_SECRET from that same screen.
export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? ""
  };

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers);
  } catch (err) {
    console.error("Clerk webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data;
    const email = data.email_addresses?.[0]?.email_address;
    if (email) {
      await prisma.user.upsert({
        where: { clerkId: data.id },
        update: { email, name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null },
        create: {
          clerkId: data.id,
          email,
          name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null,
          role: "MEMBER"
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
