-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEETING_OPTION_SUGGESTED';

-- AlterTable
ALTER TABLE "PollOption" ADD COLUMN     "proposedById" TEXT;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

