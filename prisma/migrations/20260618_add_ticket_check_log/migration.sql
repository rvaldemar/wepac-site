-- CreateTable
CREATE TABLE "ticket_check_logs" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_check_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_check_logs_ticketId_idx" ON "ticket_check_logs"("ticketId");

-- AddForeignKey
ALTER TABLE "ticket_check_logs" ADD CONSTRAINT "ticket_check_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
