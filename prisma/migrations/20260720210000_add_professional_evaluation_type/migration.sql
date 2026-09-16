-- Additive: unblocks a third evaluator type (external professional
-- evaluations) in EvaluationType. No UI/submission flow or composite
-- scoring weight defined yet — schema-only, deliberately.
ALTER TYPE "EvaluationType" ADD VALUE IF NOT EXISTS 'professional';
