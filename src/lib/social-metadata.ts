import type { Metadata } from "next";

export const SITE_URL = new URL("https://wepac.pt");

function localizedPath(locale: string, path: string): string {
  const normalizedPath = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return locale === "en-US" ? `/en${normalizedPath || "/"}` : normalizedPath || "/";
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function buildSocialMetadata({
  locale,
  path,
  title,
  description,
  image = "/logo/og-image.png",
  imageAlt = title,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
}): Metadata {
  const canonical = absoluteUrl(localizedPath(locale, path));
  const ptUrl = absoluteUrl(localizedPath("pt-PT", path));
  const enUrl = absoluteUrl(localizedPath("en-US", path));
  const socialImage = absoluteUrl(image || "/logo/og-image.png");

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: { "pt-PT": ptUrl, "en-US": enUrl, "x-default": ptUrl },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "WEPAC",
      type: "website",
      locale: locale === "en-US" ? "en_US" : "pt_PT",
      alternateLocale: [locale === "en-US" ? "pt_PT" : "en_US"],
      images: [{ url: socialImage, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}
