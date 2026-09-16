-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('NEW_LEAD', 'FIRST_CONVERSATION', 'FOLLOW_UP', 'MEETING_SCHEDULED', 'PROPOSAL_SENT', 'VERBAL_COMMITMENT', 'COMMITTED', 'GIVING', 'NOT_INTERESTED');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "stage" "Stage" NOT NULL DEFAULT 'NEW_LEAD',
    "notes" TEXT,
    "estimatedAmount" DOUBLE PRECISION,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prospect_stage_idx" ON "Prospect"("stage");

-- CreateIndex
CREATE INDEX "Prospect_lastContactedAt_idx" ON "Prospect"("lastContactedAt");

-- CreateIndex
CREATE INDEX "Interaction_prospectId_idx" ON "Interaction"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
