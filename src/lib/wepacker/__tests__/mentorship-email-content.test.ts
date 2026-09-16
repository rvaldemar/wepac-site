import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMailMock = vi.fn(async (input: unknown) => {
    void input;
  });
  return {
    sendMail: sendMailMock,
    createTransport: vi.fn(() => ({
      sendMail: (input: unknown) => sendMailMock(input),
    })),
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport,
  },
}));

import {
  sendMentorshipAcceptedEmail,
  sendMentorshipInvitationEmail,
  sendSessionInviteEmail,
} from "@/lib/email";

describe("Mentorship transactional email content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the consent invitation only to the Mentee and escapes both names", async () => {
    await sendMentorshipInvitationEmail({
      to: "alex@example.test",
      recipientName: "Alex <Mentee>",
      mentorName: "Rui & <Mentor>",
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const message = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(message.to).toBe("alex@example.test");
    expect(message.subject).toBe("Mentorship invitation — WEPACKER");
    expect(message.html).toContain("Alex &lt;Mentee&gt;");
    expect(message.html).toContain("Rui &amp; &lt;Mentor&gt;");
    expect(message.html).not.toContain("Alex <Mentee>");
    expect(message.html).not.toContain("Rui & <Mentor>");
    expect(message.html).toContain("/wepacker/mentorships");
    expect(message.html).toContain(
      "A relação só fica ativa depois da tua aceitação."
    );
    expect(message.html).toContain(
      "Não abre o teu Life Map, Trails, Goals, Actions"
    );
  });

  it("sends the acceptance notice only to the Mentor and escapes Mentee content", async () => {
    await sendMentorshipAcceptedEmail({
      to: "mentor@example.test",
      recipientName: "Rui <Mentor>",
      menteeName: "Alex & <Mentee>",
    });

    expect(sendMail).toHaveBeenCalledOnce();
    const message = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(message.to).toBe("mentor@example.test");
    expect(message.subject).toBe("Mentorship accepted — WEPACKER");
    expect(message.html).toContain("Rui &lt;Mentor&gt;");
    expect(message.html).toContain("Alex &amp; &lt;Mentee&gt;");
    expect(message.html).not.toContain("Rui <Mentor>");
    expect(message.html).not.toContain("Alex & <Mentee>");
    expect(message.html).toContain("/wepacker/mentor/sessions");
    expect(message.html).toContain(
      "sem criar um Cycle Enrollment ou Pack Membership."
    );
  });
});

describe("Session transactional email content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("escapes recipient and kind text and keeps an HTTPS CTA attribute-safe", async () => {
    await sendSessionInviteEmail({
      to: "member@example.test",
      recipientName: 'Alex <img src=x onerror="alert(1)">',
      kindLabel: 'Checkpoint <script>alert("x")</script>',
      scheduledAt: new Date("2026-07-22T14:00:00Z"),
      meetingUrl: 'https://meet.example.test/room?label="hello"',
      ics: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
    });

    const message = sendMail.mock.calls[0][0] as { html: string };
    expect(message.html).toContain("Alex &lt;img");
    expect(message.html).toContain("Checkpoint &lt;script&gt;");
    expect(message.html).not.toContain("<script>alert");
    expect(message.html).not.toContain("onerror=\"alert(1)\"");
    expect(message.html).toContain(
      'href="https://meet.example.test/room?label=%22hello%22"',
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,<script>x</script>"])(
    "rejects an unsafe CTA URL: %s",
    async (meetingUrl) => {
      await expect(
        sendSessionInviteEmail({
          to: "member@example.test",
          recipientName: "Alex",
          kindLabel: "Checkpoint",
          scheduledAt: new Date("2026-07-22T14:00:00Z"),
          meetingUrl,
          ics: "BEGIN:VCALENDAR\r\nEND:VCALENDAR",
        }),
      ).rejects.toThrow("Unsafe email URL");
      expect(sendMail).not.toHaveBeenCalled();
    },
  );
});
