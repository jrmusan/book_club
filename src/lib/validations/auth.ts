import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createClubSchema = z.object({
  name: z.string().min(2, "Club name is required").max(100),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const pollClosesAtSchema = z
  .string()
  .min(1, "Set a voting deadline")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid deadline")
  .refine((value) => new Date(value).getTime() > Date.now() + 60_000, {
    message: "Deadline must be at least 1 minute from now",
  })
  .refine((value) => new Date(value).getTime() <= Date.now() + 90 * 24 * 60 * 60 * 1000, {
    message: "Deadline must be within 90 days",
  });

export const createBookPollSchema = z
  .object({
    title: z.string().min(2).max(200),
    bookIds: z.array(z.string()).min(2, "Add at least 2 books"),
    closesAt: pollClosesAtSchema,
    votingMode: z.enum(["SINGLE", "RANKING"]),
    maxStars: z.number().int().min(2).max(5).optional(),
    maxRankedBooks: z.number().int().min(1).optional(),
    rankLimit: z.enum(["BOOKS", "BUDGET"]).optional(),
    starBudget: z.number().int().min(1).optional(),
    scoreMethod: z.enum(["POINTS", "TOP_STARS"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.votingMode !== "RANKING") return;
    if (data.maxStars == null) {
      ctx.addIssue({
        code: "custom",
        message: "Choose how many stars are in the scale",
        path: ["maxStars"],
      });
    }
    const limit = data.rankLimit ?? "BOOKS";
    if (
      limit === "BOOKS" &&
      data.maxRankedBooks != null &&
      data.maxRankedBooks > data.bookIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: `People can rank at most ${data.bookIds.length} books in this poll`,
        path: ["maxRankedBooks"],
      });
    }
    if (limit === "BUDGET") {
      const ceiling = (data.maxStars ?? 0) * data.bookIds.length;
      if (data.starBudget == null) {
        ctx.addIssue({
          code: "custom",
          message: "Choose how many stars each person can spend",
          path: ["starBudget"],
        });
      } else if (ceiling > 0 && data.starBudget > ceiling) {
        ctx.addIssue({
          code: "custom",
          message: `The star budget can be at most ${ceiling}`,
          path: ["starBudget"],
        });
      }
    }
  });

export const createMeetingPollSchema = z.object({
  title: z.string().min(2).max(200),
  options: z.array(z.string().min(2).max(200)).min(2, "Add at least 2 options"),
  closesAt: pollClosesAtSchema,
});

export const votePollSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});

export const rankPollSchema = z.object({
  pollId: z.string(),
  ratings: z
    .array(
      z.object({
        optionId: z.string(),
        stars: z.number().int().min(1).max(10),
      })
    )
    .min(1, "Star at least one book"),
});

export const confirmMeetingSchema = z.object({
  pollId: z.string(),
  scheduledAt: z.string().datetime(),
  timezone: z.string().default("America/New_York"),
  notes: z.string().max(500).optional(),
});

export const bookRatingSchema = z.object({
  bookId: z.string(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(2000).optional(),
});

export const bookNoteSchema = z.object({
  bookId: z.string().min(1),
  body: z.string().max(8000, "Notes must be 8,000 characters or fewer"),
});

export const bookRankingSchema = z.object({
  rankings: z.array(
    z.object({
      bookId: z.string(),
      rank: z.number().int().min(1),
    })
  ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateClubInput = z.infer<typeof createClubSchema>;
