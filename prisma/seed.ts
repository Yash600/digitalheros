import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Seeds two demo accounts. Replace clerkId with real Clerk user IDs after
// creating the two accounts in your Clerk dashboard (see README "Local setup").
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
