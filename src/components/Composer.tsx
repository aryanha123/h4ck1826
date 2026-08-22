import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Mic, Send, Square, X } from "lucide-react";

import { MAX_PHOTO_BYTES, MAX_VOICE_SECONDS, uploadMedia } from "@/lib/media";

export type Outgoing =
  | { kind: "text"; content: string }
  | { kind: "photo"; mediaUrl: string }
  | { kind: "voice"; mediaUrl: string; duration: number };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function Composer({
  onSend,
  disabled,
  maxChars,
}: {
  onSend: (out: Outgoing) => void;
  disabled?: boolean;
  maxChars: number;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (recording && secs >= MAX_VOICE_SECONDS) stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, recording]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || disabled) return;
    setText("");
    onSend({ kind: "text", content: v });
    inputRef.current?.focus();
  };

  const pickPhoto = async (file: File) => {
    setError("");
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is too big (max 8 MB).");
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const url = await uploadMedia(file, ext || "jpg", file.type || "image/jpeg");
    setBusy(false);
    if (!url) return setError("Photo could not be sent. Try again.");
    onSend({ kind: "photo", mediaUrl: url });
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      cancelRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const length = Math.max(1, Math.min(secsRef.current, MAX_VOICE_SECONDS));
        setRecording(false);
        setSecs(0);
        if (cancelRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mime });
        setBusy(true);
        const url = await uploadMedia(blob, mime.includes("webm") ? "webm" : "m4a", mime);
        setBusy(false);
        if (!url) return setError("Voice note could not be sent.");
        onSend({ kind: "voice", mediaUrl: url, duration: length });
      };
      recRef.current = rec;
      rec.start();
      setSecs(0);
      setRecording(true);
    } catch {
      setError("Mic permission is needed for voice notes.");
    }
  };

  const secsRef = useRef(0);
  secsRef.current = secs;

  function stopRecording() {
    recRef.current?.state === "recording" && recRef.current.stop();
  }

  const cancelRecording = () => {
    cancelRef.current = true;
    stopRecording();
  };

  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 flex-col gap-1 border-t border-border bg-card/70 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl"
    >
      {error && <p className="px-2 text-[11px] text-destructive">{error}</p>}
      {recording ? (
        <div className="flex items-center gap-3 rounded-full border border-border bg-input/70 px-4 py-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
          <span className="flex-1 font-[family-name:var(--font-mono)] text-sm">
            {mmss(secs)} / {mmss(MAX_VOICE_SECONDS)}
          </span>
          <button
            type="button"
            onClick={cancelRecording}
            aria-label="Cancel recording"
            className="rounded-full p-2 text-muted-foreground transition hover:text-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Send voice note"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-border bg-input/70 px-2 py-1 backdrop-blur-xl transition focus-within:border-foreground/50">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void pickPhoto(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Send photo"
            disabled={busy || disabled}
            className="shrink-0 rounded-full p-2 text-muted-foreground transition hover:text-foreground disabled:opacity-40 active:scale-95"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={busy ? "sending…" : "type something…"}
            maxLength={maxChars}
            aria-label="Message"
            className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none placeholder:text-muted-foreground"
          />
          {text.trim() ? (
            <button
              type="submit"
              disabled={disabled || busy}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-30 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || busy}
              aria-label="Record voice note"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-30 active:scale-95"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </form>
  );
}
