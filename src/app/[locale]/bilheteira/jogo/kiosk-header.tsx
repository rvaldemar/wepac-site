"use client";

/**
 * Co-branded header mirroring wepac.pt/arte-a-capela: Arte à Capela logo on
 * the left (official PNG), WEPAC wordmark on the right (official asset from
 * public/logo/wepac, never re-derived).
 */
export function KioskHeader() {
  return (
    <header className="kiosk-header" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="kiosk-header__capela" src="/images/arte-a-capela/logo.png" alt="Arte à Capela" />
      <span className="kiosk-header__divider" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="kiosk-header__wepac" src="/logo/wepac/wordmark-white.png" alt="wepac" />
    </header>
  );
}
