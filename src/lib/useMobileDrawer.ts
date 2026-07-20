"use client";

import { useEffect, useRef } from "react";

/**
 * Behavior for a mobile menu/drawer that opens as an overlay dialog:
 * - Escape closes it
 * - Focus moves into the drawer on open, and returns to the toggle button on close
 * - Focus is trapped inside the drawer while open (simple Tab/Shift+Tab loop)
 * - Background scroll is locked while open, restored on close/unmount
 *
 * Returns refs to attach to the toggle button and the drawer container.
 */
export function useMobileDrawer<
  TToggle extends HTMLElement = HTMLButtonElement,
  TDrawer extends HTMLElement = HTMLDivElement,
>(open: boolean, onClose: () => void) {
  const toggleRef = useRef<TToggle>(null);
  const drawerRef = useRef<TDrawer>(null);

  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;

    // Move focus into the drawer.
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      drawer ? Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector)) : [];

    const first = getFocusable()[0];
    (first ?? drawer)?.focus();

    // Lock background scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawer) return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !drawer.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !drawer.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      toggleRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { toggleRef, drawerRef };
}
