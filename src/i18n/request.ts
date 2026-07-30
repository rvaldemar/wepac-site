import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const loaders = {
  "pt-PT": () => import("@/messages/pt-PT.json").then((module) => module.default),
  "en-US": () => import("@/messages/en-US.json").then((module) => module.default),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: await loaders[locale](),
    timeZone: "Europe/Lisbon",
  };
});
