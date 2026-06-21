
-- DropIndex
DROP INDEX IF EXISTS "Bill_recurrenceSeriesId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Bill_userId_recurrenceSeriesId_dueDate_idx";

-- DropConstraint
ALTER TABLE "Bill" DROP CONSTRAINT IF EXISTS "Bill_userId_recurrenceSeriesId_dueDate_key";

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN IF NOT EXISTS "adjustedDueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "provider" TEXT,
ADD COLUMN IF NOT EXISTS "providerId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
