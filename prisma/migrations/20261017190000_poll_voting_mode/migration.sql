-- CreateEnum
CREATE TYPE "PollVotingMode" AS ENUM ('SINGLE', 'RANKING');

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN "votingMode" "PollVotingMode" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "Poll" ADD COLUMN "maxStars" INTEGER;
ALTER TABLE "Poll" ADD COLUMN "maxRankedBooks" INTEGER;

-- AlterTable
ALTER TABLE "PollVote" ADD COLUMN "stars" INTEGER;

-- DropIndex
DROP INDEX "PollVote_pollId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "PollVote_pollId_userId_optionId_key" ON "PollVote"("pollId", "userId", "optionId");

-- CreateIndex
CREATE INDEX "PollVote_pollId_userId_idx" ON "PollVote"("pollId", "userId");
