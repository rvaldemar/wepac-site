"use client";

import { useEffect } from "react";
import { COOKIE_CONSENT_EVENT, hasMarketingConsent } from "@/components/CookieConsent";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const UTM_STORAGE = "wepac_utm";

type Fbq = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: Fbq;
  callMethod?: (...args: unknown[]) => void;
};
declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export function readUtmRaw(): string {
  try {
    return sessionStorage.getItem(UTM_STORAGE) || "{}";
  } catch {
    return "{}";
  }
}

function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v) found[key] = v.slice(0, 120);
    }
    // Last non-empty campaign wins for the session, like most attribution.
    if (Object.keys(found).length > 0) sessionStorage.setItem(UTM_STORAGE, JSON.stringify(found));
  } catch {
    // storage unavailable (private mode): attribution is best-effort
  }
}

// Mirrors Meta's official base snippet: calls queue until fbevents.js loads
// and takes over through callMethod.
function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue!.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
  fbq("track", "PageView");
}

// Only ever fires after the visitor accepted cookies; without a configured
// NEXT_PUBLIC_META_PIXEL_ID it is a no-op.
export function trackPixel(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq || !hasMarketingConsent()) return;
  window.fbq("track", event, params);
}

type Purchase = { id: string; value: number; currency: "EUR"; contentName: string; numItems: number };

function trackPurchaseOnce(purchase: Purchase) {
  const key = `wepac_purchase_${purchase.id}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // without storage a reload may report twice; Meta dedupes by eventID
  }
  if (!window.fbq || !hasMarketingConsent()) return;
  window.fbq(
    "track",
    "Purchase",
    { value: purchase.value, currency: purchase.currency, content_name: purchase.contentName, num_items: purchase.numItems },
    { eventID: purchase.id },
  );
}

export function BilheteiraTracking({
  viewContent,
  purchase,
}: {
  viewContent?: Record<string, unknown>;
  purchase?: Purchase;
}) {
  useEffect(() => {
    captureUtm();
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (!pixelId) return;
    const start = () => {
      if (!hasMarketingConsent()) return;
      loadPixel(pixelId);
      if (viewContent) trackPixel("ViewContent", viewContent);
      if (purchase) trackPurchaseOnce(purchase);
    };
    start();
    window.addEventListener(COOKIE_CONSENT_EVENT, start);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, start);
  }, [viewContent, purchase]);
  return null;
}
