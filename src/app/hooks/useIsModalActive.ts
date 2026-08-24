import { useState, useEffect } from "react";

/**
 * Hook to detect if any modal, dialog, popup, or overlay is currently active in the DOM.
 * When a modal is open, floating launcher icons can be hidden/subordinated so the modal
 * is unobstructed and appears cleanly above all floating widgets.
 */
export function useIsModalActive(): boolean {
  const [isModalActive, setIsModalActive] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkModal = () => {
      // Find any modal dialog, alert dialog, sweetalert, radix portal, or fixed full-screen modal container
      const candidates = document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="alertdialog"], [aria-modal="true"], .swal2-container, .modal-backdrop'
      );

      let foundActiveModal = false;
      candidates.forEach((el) => {
        // Exclude floating chat / chatbot panels themselves
        if (!el.closest(".floating-chat-container") && !el.closest(".floating-chatbot-container")) {
          // Verify it is visible
          const style = window.getComputedStyle(el);
          if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
            foundActiveModal = true;
          }
        }
      });

      // Also check full-screen fixed backdrops (e.g. .fixed.inset-0 with dark/blur bg) that are not floating chat
      if (!foundActiveModal) {
        const fixedOverlays = document.querySelectorAll<HTMLElement>(".fixed.inset-0");
        fixedOverlays.forEach((el) => {
          if (!el.closest(".floating-chat-container") && !el.closest(".floating-chatbot-container")) {
            const classList = el.className;
            if (
              classList.includes("bg-") &&
              (classList.includes("backdrop-") ||
                classList.includes("z-50") ||
                classList.includes("z-[50]") ||
                classList.includes("z-[60]") ||
                classList.includes("z-[100]"))
            ) {
              const style = window.getComputedStyle(el);
              if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                foundActiveModal = true;
              }
            }
          }
        });
      }

      setIsModalActive(foundActiveModal);
    };

    checkModal();

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-state", "open", "role", "aria-modal"],
    });

    return () => observer.disconnect();
  }, []);

  return isModalActive;
}
