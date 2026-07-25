import { z } from "zod";

export const publicLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  projectDetails: z.string().trim().max(2000).optional().or(z.literal(""))
});

export const leadStatusValues = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;

// Only these transitions are legal. Prevents e.g. WON -> NEW via a stray PATCH.
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["QUALIFIED", "LOST"],
  QUALIFIED: ["WON", "LOST"],
  WON: [],
  LOST: ["NEW"] // allow re-opening a lost lead
};

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedToId: z.string().min(1).nullable().optional()
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(5000)
});

export const listLeadsQuerySchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedToId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
