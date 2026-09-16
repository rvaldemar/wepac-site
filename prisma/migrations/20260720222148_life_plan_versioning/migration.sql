-- CreateTable
CREATE TABLE "life_plan_versions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "whoIAm" TEXT NOT NULL DEFAULT '',
    "whereIAm" TEXT NOT NULL DEFAULT '',
    "whereIGo" TEXT NOT NULL DEFAULT '',
    "whyIDo" TEXT NOT NULL DEFAULT '',
    "commitments" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "life_plan_versions_userId_idx" ON "life_plan_versions"("userId");

-- AddForeignKey
ALTER TABLE "life_plan_versions" ADD CONSTRAINT "life_plan_versions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
