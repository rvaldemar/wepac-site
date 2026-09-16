ALTER TABLE "messages"
ADD COLUMN "clientRequestId" TEXT;

CREATE UNIQUE INDEX "messages_userId_clientRequestId_key"
ON "messages"("userId", "clientRequestId");
