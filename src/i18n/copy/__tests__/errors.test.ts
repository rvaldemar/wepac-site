import { describe, expect, it } from "vitest";
import { getErrorCopy } from "@/i18n/copy/errors";

describe("error page copy", () => {
  it("provides localized generic and ticket-specific copy", () => {
    expect(getErrorCopy("pt-PT").notFound.title).toBe(
      "Esta página não está aqui"
    );
    expect(getErrorCopy("en-US").error.retry).toBe("Try again");
    expect(getErrorCopy("pt-PT").ticketNotFound.title).toBe(
      "Bilhete não encontrado"
    );
    expect(getErrorCopy("en-US").ticketNotFound.title).toBe(
      "Ticket not found"
    );
  });

  it("does not provide a token interpolation seam in ticket copy", () => {
    const ticketCopy = getErrorCopy("pt-PT").ticketNotFound;

    expect(Object.values(ticketCopy).every((value) => typeof value === "string")).toBe(true);
  });
});
