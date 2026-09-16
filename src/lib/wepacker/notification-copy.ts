import type { NotificationType } from "@prisma/client";

export interface NotificationCopy {
  title: string;
  body: string;
}

// Static, content-free copy. Person names and relationship details stay on
// their resource-authorized page and are never duplicated into the ledger.
export const NOTIFICATION_COPY: Record<NotificationType, NotificationCopy> = {
  pack_invited: {
    title: "Pack invitation",
    body: "You received a separate community invitation.",
  },
  pack_accepted: {
    title: "Pack invitation accepted",
    body: "A Person accepted your community invitation.",
  },
  connection_requested: {
    title: "Connection request",
    body: "You received a separate Connection request.",
  },
  connection_accepted: {
    title: "Connection accepted",
    body: "Your Connection request was accepted.",
  },
  mentorship_invited: {
    title: "Mentorship invitation",
    body: "You received a Mentorship invitation.",
  },
  mentorship_accepted: {
    title: "Mentorship accepted",
    body: "Your Mentorship invitation was accepted.",
  },
  session_scheduled: {
    title: "Session scheduled",
    body: "A new Session was added to your calendar.",
  },
  session_updated: {
    title: "Session updated",
    body: "The schedule or meeting link for a Session changed.",
  },
  session_cancelled: {
    title: "Session cancelled",
    body: "A scheduled Session was cancelled.",
  },
  session_followup_updated: {
    title: "Session follow-up updated",
    body: "Your Session organizer updated attendee-visible follow-up.",
  },
  new_message: {
    title: "New Message",
    body: "You received a new Message.",
  },
};
