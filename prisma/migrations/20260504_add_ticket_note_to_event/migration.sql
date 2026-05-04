-- Add ticketNote field to events for per-event ticket back text
ALTER TABLE "events" ADD COLUMN "ticketNote" TEXT;
