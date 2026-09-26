-- Connect opt-in LifeQuest habits to the recurring Google Calendar series they manage.
ALTER TABLE "habits"
  ADD COLUMN IF NOT EXISTS "syncToGoogleCalendar" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;

-- Agenda was introduced through runtime schema sync in early installations.
-- Guard this branch so a fresh historical migration chain can still run; the
-- runtime migration creates the same columns once agenda_events exists.
DO $$
BEGIN
  IF to_regclass('agenda_events') IS NOT NULL THEN
    ALTER TABLE "agenda_events"
      ADD COLUMN IF NOT EXISTS "googleSeriesId" TEXT;

    CREATE INDEX IF NOT EXISTS "agenda_events_userId_googleSeriesId_idx"
      ON "agenda_events"("userId", "googleSeriesId");
  END IF;
END $$;
