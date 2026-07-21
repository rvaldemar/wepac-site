import { requirePageUser } from "@/lib/wepacker/page-guards";
import {
  getMentorshipInviteCandidates,
  getMyMentorships,
} from "@/lib/wepacker/actions/mentorship";
import MentorshipsPageClient from "./page-client";

export default async function MentorshipsPage() {
  const actor = await requirePageUser();
  const writesEnabled = process.env.MENTORSHIP_WRITES_ENABLED === "true";
  const canInvite =
    writesEnabled && (actor.role === "mentor" || actor.role === "admin");
  const [mentorships, candidates] = await Promise.all([
    getMyMentorships(),
    canInvite ? getMentorshipInviteCandidates() : Promise.resolve([]),
  ]);

  return (
    <MentorshipsPageClient
      currentUserId={actor.id}
      canInvite={canInvite}
      writesEnabled={writesEnabled}
      mentorships={mentorships}
      candidates={candidates}
    />
  );
}
