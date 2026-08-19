import { useEffect, useState } from "react";

/** Animated boot screen shown when the app opens. */
export function Splash() {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const a = window.setTimeout(() => setFading(true), 1250);
    const b = window.setTimeout(() => setGone(true), 1950);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="grid-aura absolute inset-0 opacity-40" />
      <div className="anim-pulse-ring neon-ring relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border bg-foreground/5">
        <img src="/icon-192.png" alt="" width={96} height={96} className="h-full w-full object-cover" />
      </div>
      <p className="anim-glitch-in mt-6 font-[family-name:var(--font-mono)] text-2xl uppercase tracking-[0.4em] text-sheen">
        H4CK
      </p>
      <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-foreground/10">
        <div className="anim-boot-bar h-full w-1/3 rounded-full bg-[image:var(--gradient-romance)]" />
      </div>
    </div>
  );
}
