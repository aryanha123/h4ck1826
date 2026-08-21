import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

import ringAsset from "@/assets/theme.mp3.asset.json";
import type { CallPhase } from "@/hooks/useAudioCall";
import dp from "@/assets/owner-dp.jpg.asset.json";

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function CallOverlay({
  phase,
  seconds,
  status,
  muted,
  title,
  onAccept,
  onDecline,
  onHangUp,
  onToggleMute,
}: {
  phase: CallPhase;
  seconds: number;
  status: string;
  muted: boolean;
  title: string;
  onAccept: () => void;
  onDecline: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
}) {
  const ring = useRef<HTMLAudioElement | null>(null);
  const open = phase !== "idle";

  // pause the background theme while any call screen is up
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("h4ck-call-active", { detail: open }));
  }, [open]);

  useEffect(() => {
    const shouldRing = phase === "incoming" || phase === "outgoing";
    if (!shouldRing) {
      ring.current?.pause();
      return;
    }
    const el = ring.current ?? new Audio(ringAsset.url);
    el.loop = true;
    el.volume = 0.9;
    ring.current = el;
    void el.play().catch(() => {});
    if (phase === "incoming") {
      try {
        navigator.vibrate?.([400, 200, 400, 200, 400]);
      } catch {
        /* ignore */
      }
    }
    return () => {
      el.pause();
    };
  }, [phase]);

  if (!open) return null;

  const label =
    phase === "incoming"
      ? "Incoming audio call"
      : phase === "outgoing"
        ? status || "Calling…"
        : phase === "active"
          ? mmss(seconds)
          : status || "Call ended";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background/95 px-6 py-16 backdrop-blur-2xl anim-soft-in">
      <div className="flex flex-col items-center gap-5 pt-10">
        <span className="anim-pulse-ring neon-ring flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-border">
          <img src={dp.url} alt="" className="h-full w-full object-cover" />
        </span>
        <h2 className="font-[family-name:var(--font-mono)] text-2xl uppercase tracking-[0.2em]">
          {title}
        </h2>
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {phase === "incoming" && (
          <>
            <button
              onClick={onDecline}
              aria-label="Decline call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
            <button
              onClick={onAccept}
              aria-label="Accept call"
              className="anim-pulse-ring flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
            >
              <Phone className="h-7 w-7" />
            </button>
          </>
        )}
        {(phase === "outgoing" || phase === "active") && (
          <>
            {phase === "active" && (
              <button
                onClick={onToggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-foreground/10 transition active:scale-95"
              >
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
            )}
            <button
              onClick={onHangUp}
              aria-label="End call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
