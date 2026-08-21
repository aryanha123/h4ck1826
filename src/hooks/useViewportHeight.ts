import { useEffect, useState } from "react";

/**
 * Real visible height (keyboard aware). Keeps the chat header pinned instead of
 * letting mobile browsers scroll the whole page when the keyboard opens.
 */
export function useViewportHeight() {
  const [h, setH] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    const read = () => setH(Math.round(vv?.height ?? window.innerHeight));
    read();
    vv?.addEventListener("resize", read);
    vv?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      vv?.removeEventListener("resize", read);
      vv?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  return h;
}
