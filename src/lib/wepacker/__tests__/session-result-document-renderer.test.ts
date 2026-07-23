import { describe, expect, it } from "vitest";
import { renderSessionResultDocument } from "@/lib/wepacker/session-media/result-document";

describe("Session Result Document renderer", () => {
  it("escapes every model field and contains no executable model HTML", () => {
    const html = renderSessionResultDocument({
      attendeeRef: "opaque-attendee",
      outcomeSuggestion: "<script>alert(1)</script>",
      sharedNoteSuggestion: '<img src=x onerror="alert(1)">',
      confidence: "medium",
      actions: [
        {
          title: '<a href="javascript:alert(1)">unsafe</a>',
          description: "line one\nline two",
          dueDate: "2026-08-01",
        },
      ],
    });
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("line one<br />line two");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<a href");
    expect(html).not.toContain("opaque-attendee");
  });
});
