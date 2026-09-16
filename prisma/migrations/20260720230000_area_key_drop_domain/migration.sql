-- Reduce the 7-pillar model to the 6 universal development areas:
-- physical, emotional, character, spiritual, intellectual, social.
-- The 7th pillar ("domain", pack-specific — labelled per-pack via
-- `Pack.domainLabel`) is removed entirely, not renamed: art/culture (or
-- any other discipline a Pack is built around) is now a practice a Pack
-- chooses, not a universal dimension of the person.
--
-- Data cleanup (must happen before the enum value can be dropped —
-- Postgres refuses to drop an enum value still referenced by a column):
--   * `evaluation_scores` rows scored on the "domain" area are deleted —
--     they measured a pillar that no longer exists, nothing to migrate
--     them onto.
--   * `strategic_plans.focusAreas` arrays have any 'domain' entry
--     stripped (the rest of the array is preserved).
--
-- Enum change follows the same additive create-swap-drop pattern already
-- used in this schema for `AreaKey` and `UserRole`
-- (20260720120000_wepacker_platform_rebuild): create a new enum with the
-- 6 remaining values, migrate every column off the old enum onto it,
-- drop the old enum, rename the new one into place.

-- ===== DATA CLEANUP =====

DELETE FROM "evaluation_scores" WHERE "area" = 'domain';

UPDATE "strategic_plans"
SET "focusAreas" = array_remove("focusAreas", 'domain')
WHERE 'domain' = ANY("focusAreas");

-- ===== ENUM SWAP: AreaKey (7 values -> 6 values) =====

CREATE TYPE "AreaKey_new" AS ENUM ('physical', 'emotional', 'character', 'spiritual', 'intellectual', 'social');
ALTER TABLE "evaluation_scores" ALTER COLUMN "area" TYPE "AreaKey_new" USING ("area"::text::"AreaKey_new");
ALTER TABLE "strategic_plans" ALTER COLUMN "focusAreas" TYPE "AreaKey_new"[] USING ("focusAreas"::text::"AreaKey_new"[]);
ALTER TYPE "AreaKey" RENAME TO "AreaKey_old";
ALTER TYPE "AreaKey_new" RENAME TO "AreaKey";
DROP TYPE "public"."AreaKey_old";

-- ===== PACK: drop the pack-specific 7th-pillar label =====

ALTER TABLE "packs" DROP COLUMN "domainLabel";
