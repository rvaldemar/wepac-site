import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  WEPACKER_PRODUCT_TERMS,
  wp,
} from "@/i18n/copy/wepacker";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("WEPACKER language contract", () => {
  it("keeps the canonical product glossary in English", () => {
    expect(WEPACKER_PRODUCT_TERMS).toEqual([
      "My Journey",
      "Basecamp",
      "Life Map",
      "Goals",
      "Trails",
      "Actions",
      "Sessions",
      "Mentorships",
      "Connections",
      "Packs",
      "Academy",
    ]);

    const documentedGlossary = source("docs/product-language-glossary.md");
    for (const term of WEPACKER_PRODUCT_TERMS) {
      expect(documentedGlossary).toContain(`- ${term}`);
    }
  });

  it("selects localized generic interface copy", () => {
    expect(wp("pt-PT", "Editar", "Edit")).toBe("Editar");
    expect(wp("en-US", "Editar", "Edit")).toBe("Edit");
    expect(wp("pt-PT", "Trails ativos", "Active Trails")).toBe(
      "Trails ativos",
    );
  });

  it("guards critical localized headings and canonical product names", () => {
    const dashboard = source(
      "src/app/[locale]/wepacker/(platform)/dashboard/page-client.tsx",
    );
    const goals = source(
      "src/app/[locale]/wepacker/(platform)/goals/page-client.tsx",
    );
    const genericPages = [
      "src/app/[locale]/wepacker/(platform)/profile/page-client.tsx",
      "src/app/[locale]/wepacker/(platform)/notifications/page-client.tsx",
      "src/app/[locale]/wepacker/(platform)/communities/page-client.tsx",
      "src/app/[locale]/wepacker/(platform)/admin/users/page-client.tsx",
    ].map(source).join("\n");

    expect(dashboard).toContain('wp(locale, "Próxima Session", "Next Session")');
    expect(dashboard).toContain('wp(locale, "Trails ativos", "Active Trails")');
    expect(goals).toContain('wp(locale, "Goals anuais", "Annual Goals")');
    expect(goals).not.toMatch(/Metas (Anuais|Trimestrais)/);
    expect(genericPages).toContain('wp(locale, "Perfil", "Profile")');
    expect(genericPages).toContain('wp(locale, "Notificações", "Notifications")');
    expect(genericPages).toContain('wp(locale, "Comunidades", "Communities")');
    expect(genericPages).toContain('wp(locale, "Pessoas", "People")');
  });

  it("covers previously omitted platform and public authentication surfaces", () => {
    const messages = source(
      "src/app/[locale]/wepacker/(platform)/messages/page-client.tsx",
    );
    const sidebar = source("src/components/wepacker/PlatformSidebar.tsx");
    const leads = source(
      "src/app/[locale]/wepacker/(platform)/admin/leads/page-client.tsx",
    );
    const login = source(
      "src/app/[locale]/wepacker/(public)/login/page.tsx",
    );
    const passwordReset = source(
      "src/app/[locale]/wepacker/(public)/password/reset/page.tsx",
    );
    const invite = source(
      "src/app/[locale]/wepacker/(public)/invite/[token]/page-client.tsx",
    );
    const publicAuth = [login, passwordReset, invite].join("\n");

    expect(messages).toContain('wp(locale, "Mensagens", "Messages")');
    expect(messages).toContain(
      '"Seleciona uma conversa existente.",\n                "Select an existing conversation.",',
    );
    expect(messages).not.toMatch(/Conversations? de Messages?/);

    expect(sidebar).toContain('"My Academy": "A minha Academy"');
    expect(sidebar).toContain('Messages: "Mensagens"');
    expect(sidebar).toContain('Leads: "Potenciais clientes"');

    expect(leads).toContain(
      'wp(locale, "Potenciais clientes", "Leads")',
    );
    expect(leads).toContain(
      '["Formulário WEPACKER", "WEPACKER intake"]',
    );
    expect(leads).not.toMatch(/Inbox central|histórico de intake|Nenhuma lead/);

    expect(publicAuth).toContain('wp(locale, "Palavra-passe", "Password")');
    expect(publicAuth).toContain(
      'wp(locale, "Confirmar palavra-passe", "Confirm password")',
    );
    expect(publicAuth).not.toMatch(
      /(?:Email ou password|Recuperar password|Nova password|Confirmar password|As passwords|Voltar ao login|Ir para login)/,
    );
  });
});
