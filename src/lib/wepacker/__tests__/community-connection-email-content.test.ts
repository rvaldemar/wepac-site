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

vi.mock("nodemailer", () => ({ default: { createTransport } }));

import {
  sendConnectionAcceptedEmail,
  sendConnectionRequestEmail,
  sendPackAcceptedEmail,
  sendPackInvitationEmail,
} from "@/lib/email";

beforeEach(() => vi.clearAllMocks());

describe("Pack transactional email", () => {
  it("escapes identity content and explains independent consent", async () => {
    await sendPackInvitationEmail({
      to: "alex@example.test",
      recipientName: "Alex <Member>",
      ownerName: "Rui & <Owner>",
    });

    const message = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(message.to).toBe("alex@example.test");
    expect(message.subject).toBe("Pack invitation — WEPACKER");
    expect(message.html).toContain("Alex &lt;Member&gt;");
    expect(message.html).toContain("Rui &amp; &lt;Owner&gt;");
    expect(message.html).toContain("A Pack Membership só");
    expect(message.html).toContain(
      "não cria uma Connection, Mentorship ou Cycle",
    );
    expect(message.html).toContain("/wepacker/communities");
    expect(message.html).not.toContain("Alex <Member>");
  });

  it("notifies the owner only after acceptance", async () => {
    await sendPackAcceptedEmail({
      to: "rui@example.test",
      recipientName: "Rui <Owner>",
      memberName: "Alex & <Member>",
    });
    const message = sendMail.mock.calls[0][0] as { to: string; html: string };
    expect(message.to).toBe("rui@example.test");
    expect(message.html).toContain("Rui &lt;Owner&gt;");
    expect(message.html).toContain("Alex &amp; &lt;Member&gt;");
  });
});

describe("Connection transactional email", () => {
  it("keeps the request content-minimized and links to explicit consent", async () => {
    await sendConnectionRequestEmail({
      to: "alex@example.test",
      recipientName: "Alex <Person>",
      requesterName: "Rui & <Person>",
    });
    const message = sendMail.mock.calls[0][0] as {
      to: string;
      subject: string;
      html: string;
    };
    expect(message.to).toBe("alex@example.test");
    expect(message.subject).toBe("Connection request — WEPACKER");
    expect(message.html).toContain("Alex &lt;Person&gt;");
    expect(message.html).toContain("Rui &amp; &lt;Person&gt;");
    expect(message.html).toContain("não abre Life Map, Trails, Goals, Actions");
    expect(message.html).toContain("/wepacker/connections");
    expect(message.html).not.toContain("Relationship type");
  });

  it("reveals the accepting Person to the requester only after active consent", async () => {
    await sendConnectionAcceptedEmail({
      to: "rui@example.test",
      recipientName: "Rui <Requester>",
      personName: "Alex & <Person>",
    });
    const message = sendMail.mock.calls[0][0] as { to: string; html: string };
    expect(message.to).toBe("rui@example.test");
    expect(message.html).toContain("Rui &lt;Requester&gt;");
    expect(message.html).toContain("Alex &amp; &lt;Person&gt;");
  });
});
