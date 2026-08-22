import { useEffect, useState } from "react";

/**
 * Real visible height + offset (keyboard aware). Keeps the chat glued to the
 * keyboard instead of letting mobile browsers float the whole panel upwards.
 */
export function useViewportHeight() {
  const [box, setBox] = useState<{ h: number | null; top: number }>({ h: null, top: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    const read = () =>
      setBox({
        h: Math.round(vv?.height ?? window.innerHeight),
        top: Math.round(vv?.offsetTop ?? 0),
      });
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

  return box;
}
