-- Additive: applications auto-transition to "joined" when the invited
-- person actually creates their account (acceptInvite), closing the
-- pipeline candidatura -> convite -> conta criada.
ALTER TYPE "BetaSignupStatus" ADD VALUE IF NOT EXISTS 'joined';
