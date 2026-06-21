ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SYSTEM';

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "permissions" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "Category"
ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Bill"
ADD COLUMN IF NOT EXISTS "recurrenceSeriesId" TEXT,
ADD COLUMN IF NOT EXISTS "recurrenceDayOfMonth" INTEGER,
ADD COLUMN IF NOT EXISTS "recurrenceDayOfWeek" INTEGER,
ADD COLUMN IF NOT EXISTS "recurrenceDay" INTEGER,
ADD COLUMN IF NOT EXISTS "recurrenceMonth" INTEGER;

CREATE INDEX IF NOT EXISTS "Bill_userId_recurrenceSeriesId_dueDate_idx"
  ON "Bill"("userId", "recurrenceSeriesId", "dueDate");

CREATE INDEX IF NOT EXISTS "Bill_recurrenceSeriesId_idx"
  ON "Bill"("recurrenceSeriesId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Bill_userId_recurrenceSeriesId_dueDate_key'
  ) THEN
    ALTER TABLE "Bill"
    ADD CONSTRAINT "Bill_userId_recurrenceSeriesId_dueDate_key"
    UNIQUE ("userId", "recurrenceSeriesId", "dueDate");
  END IF;
END $$;
