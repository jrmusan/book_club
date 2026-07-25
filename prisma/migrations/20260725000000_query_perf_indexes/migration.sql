-- CreateIndex
CREATE INDEX "Poll_clubId_status_idx" ON "Poll"("clubId", "status");

-- CreateIndex
CREATE INDEX "Meeting_clubId_scheduledAt_idx" ON "Meeting"("clubId", "scheduledAt");
