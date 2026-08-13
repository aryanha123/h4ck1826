import { useEffect, useRef, useState } from "react";
import themeOld from "@/assets/theme.mp3.asset.json";
import themeNew from "@/assets/theme2.mp3.asset.json";

const PLAYLIST = [themeNew.url, themeOld.url];

/** Plays both themes back to back, forever, at full volume. No stop control. */
export function AuraAudio() {
  const ref = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState(0);

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
  }, [track]);

  return (
    <audio
      ref={ref}
      src={PLAYLIST[track]}
      autoPlay
      preload="auto"
      aria-hidden="true"
      onEnded={() => setTrack((t) => (t + 1) % PLAYLIST.length)}
    />
  );
}
