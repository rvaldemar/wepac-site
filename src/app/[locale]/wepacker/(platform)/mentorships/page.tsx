import { requirePageUser } from "@/lib/wepacker/page-guards";
import { getMyMentorships } from "@/lib/wepacker/actions/mentorship";
import MentorshipsPageClient from "./page-client";

export default async function MentorshipsPage() {
  const actor = await requirePageUser();
  const writesEnabled = process.env.MENTORSHIP_WRITES_ENABLED === "true";
  const mentorships = await getMyMentorships();

  return (
    <MentorshipsPageClient
      currentUserId={actor.id}
      canInvite={writesEnabled}
      writesEnabled={writesEnabled}
      mentorships={mentorships}
    />
  );
}
