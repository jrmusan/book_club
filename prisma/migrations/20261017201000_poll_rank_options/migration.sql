-- CreateEnum
CREATE TYPE "PollRankLimit" AS ENUM ('BOOKS', 'BUDGET');

-- CreateEnum
CREATE TYPE "PollScoreMethod" AS ENUM ('POINTS', 'TOP_STARS');

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN "rankLimit" "PollRankLimit";
ALTER TABLE "Poll" ADD COLUMN "starBudget" INTEGER;
ALTER TABLE "Poll" ADD COLUMN "scoreMethod" "PollScoreMethod";

-- Existing star rankings keep the book cap and point totals.
UPDATE "Poll"
SET "rankLimit" = 'BOOKS', "scoreMethod" = 'POINTS'
WHERE "votingMode" = 'RANKING';
