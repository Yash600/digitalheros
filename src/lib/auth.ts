import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import type { Role, User } from "@prisma/client";

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Not signed in") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Not allowed to perform this action") {
    super(message);
  }
}

/**
 * Resolves the Clerk session to our own User row. This is the single place
 * every server action and API route goes through - there is no path in this
 * app that trusts a role sent from the client.
 */
export async function getCurrentUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    // Normally the Clerk webhook (user.created) creates this row on sign-up.
    // That requires a public HTTPS URL Clerk can call, which isn't available
    // in local dev and can also just be delayed/misconfigured in general. So
    // this is a resilience fallback, not a workaround: any valid Clerk
    // session gets a MEMBER row created on first request if the webhook
    // hasn't landed yet, rather than hard-failing every new sign-up.
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.local`;
    const name = clerkUser
      ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null
      : null;

    user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId, email, name, role: "MEMBER" }
    });
  }
  return user;
}

/**
 * Enforces a role requirement server-side. UI-level hiding of admin controls
 * is cosmetic only - this function is the actual security boundary.
 */
export async function requireRole(...allowed: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Requires role: ${allowed.join(" or ")}`);
  }
  return user;
}

export function isAdmin(user: User) {
  return user.role === "ADMIN";
}
