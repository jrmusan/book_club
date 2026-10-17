-- CreateTable
CREATE TABLE "BookNote" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookNote_clubId_userId_bookId_key" ON "BookNote"("clubId", "userId", "bookId");

-- CreateIndex
CREATE INDEX "BookNote_clubId_bookId_idx" ON "BookNote"("clubId", "bookId");

-- AddForeignKey
ALTER TABLE "BookNote" ADD CONSTRAINT "BookNote_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookNote" ADD CONSTRAINT "BookNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookNote" ADD CONSTRAINT "BookNote_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
