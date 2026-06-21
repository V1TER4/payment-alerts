CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');
CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE "HolidayScope" AS ENUM ('NATIONAL', 'STATE', 'CITY');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "notificationChannels" JSONB NOT NULL DEFAULT '[]',
  "reminderDays" JSONB NOT NULL DEFAULT '[7,3,1,0]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#0ea5e9',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

CREATE TABLE "Bill" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "recurrenceFrequency" "RecurrenceFrequency",
  "lastPaidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Bill_userId_dueDate_idx" ON "Bill"("userId", "dueDate");
CREATE INDEX "Bill_userId_status_idx" ON "Bill"("userId", "status");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "billId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_scheduledFor_status_idx" ON "Notification"("userId", "scheduledFor", "status");
CREATE INDEX "Notification_billId_channel_idx" ON "Notification"("billId", "channel");

CREATE TABLE "NotificationHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationStatus" NOT NULL,
  "provider" TEXT,
  "providerId" TEXT,
  "errorMessage" TEXT,
  "payload" JSONB,
  CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationHistory_userId_sentAt_idx" ON "NotificationHistory"("userId", "sentAt");
CREATE INDEX "NotificationHistory_status_channel_idx" ON "NotificationHistory"("status", "channel");

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "scope" "HolidayScope" NOT NULL DEFAULT 'NATIONAL',
  "stateCode" TEXT,
  "city" TEXT,
  "source" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Holiday_date_scope_idx" ON "Holiday"("date", "scope");
CREATE INDEX "Holiday_userId_date_idx" ON "Holiday"("userId", "date");
CREATE UNIQUE INDEX "Holiday_date_name_scope_key" ON "Holiday"("date", "name", "scope");

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
