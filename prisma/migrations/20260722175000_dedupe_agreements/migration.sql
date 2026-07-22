-- Release A pre-integrity fix: resolve pre-existing duplicate Agreement
-- evidence before the uniqueness guard in the next migration. Decision
-- (Rui, 2026-07-22): keep the OLDEST acceptance per (userId, version) as
-- the strongest evidence of when consent was first given; drop the rest.
-- Deterministic tie-break by id when acceptedAt ties exactly.

WITH ranked AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId", "version"
            ORDER BY "acceptedAt" ASC, "id" ASC
        ) AS rn
    FROM "agreements"
)
DELETE FROM "agreements"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);
