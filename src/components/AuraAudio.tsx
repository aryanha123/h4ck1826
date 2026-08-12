import { useEffect, useRef } from "react";
import theme from "@/assets/theme.mp3.asset.json";

/** Plays the site theme on loop at full volume for the whole session. No stop control. */
export function AuraAudio() {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = 1;
    const tryPlay = () => {
      const p = el.play();
      if (p) p.catch(() => {});
    };
    tryPlay();
    const onAny = () => tryPlay();
    window.addEventListener("pointerdown", onAny);
    window.addEventListener("keydown", onAny);
    document.addEventListener("visibilitychange", onAny);
    return () => {
      window.removeEventListener("pointerdown", onAny);
      window.removeEventListener("keydown", onAny);
      document.removeEventListener("visibilitychange", onAny);
    };
  }, []);

  return <audio ref={ref} src={theme.url} loop autoPlay preload="auto" aria-hidden="true" />;
}
