-- CreateTable
CREATE TABLE "sem_nome_tickets" (
    "id" TEXT NOT NULL,
    "serial" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInAt" TIMESTAMP(3),

    CONSTRAINT "sem_nome_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sem_nome_tickets_serial_key" ON "sem_nome_tickets"("serial");
