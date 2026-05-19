ALTER TABLE "users"
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "sevenDayGuideCompletedDays" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "sevenDayGuideCompletedAt" TIMESTAMP(3),
ADD COLUMN "sevenDayGuideDismissedAt" TIMESTAMP(3);

ALTER TABLE "weekly_summaries"
ADD COLUMN "lifeScore" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "recovery_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "lostStreak" INTEGER NOT NULL,
    "requiredDays" INTEGER NOT NULL DEFAULT 3,
    "currentDays" INTEGER NOT NULL DEFAULT 0,
    "bonusXp" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recovery_challenges_userId_isCompleted_expiresAt_idx" ON "recovery_challenges"("userId", "isCompleted", "expiresAt");

ALTER TABLE "recovery_challenges"
ADD CONSTRAINT "recovery_challenges_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recovery_challenges"
ADD CONSTRAINT "recovery_challenges_habitId_fkey"
FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
