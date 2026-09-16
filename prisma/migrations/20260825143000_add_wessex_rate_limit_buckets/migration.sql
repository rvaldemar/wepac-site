-- Durable, deployment-safe cost guard for the public Wessex chat. Only an
-- HMAC digest is stored; the visitor address is never persisted.
CREATE TABLE "wessex_rate_limit_buckets" (
    "keyHash" CHAR(64) NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "windowCount" INTEGER NOT NULL,
    "dayStartedAt" TIMESTAMP(3) NOT NULL,
    "dayCount" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wessex_rate_limit_buckets_pkey" PRIMARY KEY ("keyHash"),
    CONSTRAINT "wessex_rate_limit_buckets_windowCount_check" CHECK ("windowCount" >= 0),
    CONSTRAINT "wessex_rate_limit_buckets_dayCount_check" CHECK ("dayCount" >= 0)
);

CREATE INDEX "wessex_rate_limit_buckets_expiresAt_idx"
    ON "wessex_rate_limit_buckets"("expiresAt");
