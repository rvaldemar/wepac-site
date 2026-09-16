CREATE OR REPLACE FUNCTION "protect_beta_signup_submission_history"()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR (
        OLD."state" = 'canonical'
        AND EXISTS (SELECT 1 FROM "beta_signups" WHERE "id" = OLD."betaSignupId")
    ) THEN
        RAISE EXCEPTION 'canonical beta signup submission history is append-only';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
