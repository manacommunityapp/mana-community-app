import { useEffect } from "react";

/**
 * Custom hook to trigger a callback (e.g. closing a modal) when the Escape key is pressed.
 * @param onClose Callback function to handle modal closure
 * @param active Optional flag indicating whether the listener should be active (defaults to true)
 */
export function useEscapeKey(onClose?: (() => void) | null, active: boolean = true) {
  useEffect(() => {
    if (!active || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, active]);
}
