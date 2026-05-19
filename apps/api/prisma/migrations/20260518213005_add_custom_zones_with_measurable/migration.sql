-- CreateTable
CREATE TABLE "custom_zones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accentColor" TEXT NOT NULL DEFAULT '#ec4899',
    "icon" TEXT NOT NULL DEFAULT '📍',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMeasurable" BOOLEAN NOT NULL DEFAULT false,
    "measureMetric" TEXT,
    "weeklyXpGoal" INTEGER,
    "content" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_zones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "custom_zones" ADD CONSTRAINT "custom_zones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "quests" ADD COLUMN "customZoneId" TEXT;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_customZoneId_fkey" FOREIGN KEY ("customZoneId") REFERENCES "custom_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "habits" ADD COLUMN "customZoneId" TEXT;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_customZoneId_fkey" FOREIGN KEY ("customZoneId") REFERENCES "custom_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "custom_zones_userId_isActive_idx" ON "custom_zones"("userId", "isActive");
