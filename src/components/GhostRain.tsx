import { useMemo } from "react";
import { Ghost } from "lucide-react";

/** Spooky faces that drop from the top of the screen when the site opens. */
export function GhostRain({ count = 14 }: { count?: number }) {
  const ghosts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 96,
        delay: Math.random() * 6,
        duration: 7 + Math.random() * 7,
        size: 18 + Math.random() * 34,
        opacity: 0.12 + Math.random() * 0.25,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {ghosts.map((g) => (
        <Ghost
          key={g.id}
          className="anim-ghost absolute top-0 text-foreground"
          style={{
            left: `${g.left}%`,
            width: g.size,
            height: g.size,
            opacity: g.opacity,
            animationDelay: `${g.delay}s`,
            animationDuration: `${g.duration}s`,
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  );
}