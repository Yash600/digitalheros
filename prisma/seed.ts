import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// NOTE: not required for normal use. Account provisioning is now fully
// self-serve (see getCurrentUser in src/lib/auth.ts and the /admin/claim
// invite-code flow) - this script is only useful if you want to pre-populate
// placeholder rows/leads for local testing without going through sign-up.
// Replace clerkId with a real Clerk user ID if you want a seeded row to
// actually be usable by a real signed-in session.
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@leadflow.demo" },
    update: {},
    create: {
      clerkId: process.env.SEED_ADMIN_CLERK_ID ?? "seed_admin_placeholder",
      email: "admin@leadflow.demo",
      name: "Admin Demo",
      role: "ADMIN"
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@leadflow.demo" },
    update: {},
    create: {
      clerkId: process.env.SEED_MEMBER_CLERK_ID ?? "seed_member_placeholder",
      email: "member@leadflow.demo",
      name: "Member Demo",
      role: "MEMBER"
    }
  });

  const lead = await prisma.lead.create({
    data: {
      name: "Jordan Blake",
      email: "jordan@example.com",
      phone: "+1 555 0100",
      projectDetails: "Shopify Plus migration, launch in Q1.",
      source: "web_form",
      status: "NEW"
    }
  });

  await prisma.leadActivity.create({
    data: { leadId: lead.id, type: "CREATED" }
  });

  console.log({ admin: admin.email, member: member.email, lead: lead.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
