import { describe, expect, it } from "vitest";
import { buildSocialMetadata } from "../social-metadata";

describe("social metadata", () => {
  it("builds absolute localized canonical, alternates, OG and Twitter metadata", () => {
    const metadata = buildSocialMetadata({
      locale: "en-US",
      path: "/wessex",
      title: "Wessex | WEPAC",
      description: "Live music",
      image: "/images/wessex/hero.jpg",
    });

    expect(metadata.title).toEqual({ absolute: "Wessex | WEPAC" });
    expect(metadata.alternates).toEqual({
      canonical: "https://wepac.pt/en/wessex",
      languages: {
        "pt-PT": "https://wepac.pt/wessex",
        "en-US": "https://wepac.pt/en/wessex",
        "x-default": "https://wepac.pt/wessex",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Wessex | WEPAC",
      url: "https://wepac.pt/en/wessex",
      images: [{ url: "https://wepac.pt/images/wessex/hero.jpg" }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Wessex | WEPAC",
      images: ["https://wepac.pt/images/wessex/hero.jpg"],
    });
  });

  it("falls back to the existing social image for an absent event cover", () => {
    const metadata = buildSocialMetadata({
      locale: "pt-PT",
      path: "/bilheteira/evento",
      title: "Evento | WEPAC",
      description: "Descrição",
      image: null,
    });
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://wepac.pt/logo/og-image.png" }),
    ]);
  });
});
