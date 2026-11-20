import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  KeyRound,
  LogOut,
  MessageSquare,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GhostRain } from "@/components/GhostRain";
import { Splash } from "@/components/Splash";
import { InstallApp } from "@/components/InstallApp";
import { Composer, type Outgoing } from "@/components/Composer";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { enablePush, askNotificationPermission, registerServiceWorker, vibrate } from "@/lib/pwa";
import { sendPushNotice } from "@/lib/notify.functions";
import { Switch } from "@/components/ui/switch";
import { canReadPanelMessages } from "@/lib/panel-privacy";
import dp from "@/assets/owner-dp.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HAROON H4CK — private direct line" },
      {
        name: "description",
        content:
          "Drop your name and open an encrypted private direct line with HAROON H4CK — chat and audio calls, your thread stays yours.",
      },
      { property: "og:title", content: "HAROON H4CK — private direct line" },
      {
        property: "og:description",
        content: "Private chat and audio calls on an encrypted direct line with HAROON H4CK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const OWNER_CODE = "haroonha754@gmail.com";
const STORE_KEY = "nocturne-name";
const PANEL_KEY = "h4ck-panel";
const GUEST_CODE_KEY = "h4ck-guest-code";
/** Per-thread capacity. Beyond this the oldest messages roll off automatically. */
const MAX_MESSAGES = 4000;
const TRIM_TO = 3000;
const MAX_CHARS = 20000;

type Sender = "guest" | "owner";
type MessageKind = "text" | "photo" | "voice";
type Message = {
  id: string;
  conversation_id: string;
  sender: Sender;
  sender_name?: string | null;
  content: string;
  kind: MessageKind;
  media_url: string | null;
  media_duration: number | null;
  created_at: string;
  seen_at: string | null;
};
type Conversation = {
  id: string;
  name: string;
  name_key: string;
  created_at: string;
  last_message_at: string;
  panel_code: string | null;
  guest_last_open: string | null;
  owner_last_open: string | null;
};
type Panel = {
  id: string;
  code: string;
  label: string;
  created_at: string;
  couple_slot: number | null;
  participant_one: string | null;
  participant_two: string | null;
  private_mode: boolean;
};

const keyOf = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");
const initials = (n: string) =>
  n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const ago = (iso: string | null) => {
  if (!iso) return "never opened";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "online just now";
  if (m < 60) return `last open ${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `last open ${h}h ago`;
  return `last open ${Math.round(h / 24)}d ago`;
};

function Index() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"gate" | "guest" | "owner">("gate");
  const [name, setName] = useState("");
  const [guestCode, setGuestCode] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORE_KEY);
    const savedPanel = window.localStorage.getItem(PANEL_KEY);
    if (saved === OWNER_CODE) {
      if (savedPanel) {
        try {
          const restoredPanel = JSON.parse(savedPanel) as Panel;
          setPanel(restoredPanel);
          window.localStorage.setItem(PANEL_KEY, JSON.stringify(restoredPanel));
        } catch {
          /* ignore */
        }
      }
      setMode("owner");
    } else if (saved) {
      setName(saved);
      setGuestCode(window.localStorage.getItem(GUEST_CODE_KEY));
      setMode("guest");
    }
    setReady(true);
    registerServiceWorker();
  }, []);

  const enterOwner = (p: Panel | null) => {
    window.localStorage.setItem(STORE_KEY, OWNER_CODE);
    if (p) window.localStorage.setItem(PANEL_KEY, JSON.stringify(p));
    else window.localStorage.removeItem(PANEL_KEY);
    setPanel(p);
    setMode("owner");
  };

  const enterGuest = (raw: string, code: string | null) => {
    const clean = raw.trim().replace(/\s+/g, " ");
    window.localStorage.setItem(STORE_KEY, clean);
    if (code) window.localStorage.setItem(GUEST_CODE_KEY, code);
    else window.localStorage.removeItem(GUEST_CODE_KEY);
    setName(clean);
    setGuestCode(code);
    setMode("guest");
  };

  const exit = () => {
    window.localStorage.removeItem(STORE_KEY);
    window.localStorage.removeItem(PANEL_KEY);
    window.localStorage.removeItem(GUEST_CODE_KEY);
    setName("");
    setPanel(null);
    setMode("gate");
  };

  return (
    <>
      <Splash />
      <div className="fixed inset-0 -z-10 grid-aura opacity-70" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="anim-aura absolute -left-24 top-[-10%] h-[46vh] w-[46vh] rounded-full bg-[oklch(0.68_0.24_300/25%)] blur-[90px]" />
        <div
          className="anim-aura absolute -right-20 top-1/3 h-[40vh] w-[40vh] rounded-full bg-[oklch(0.82_0.16_200/22%)] blur-[90px]"
          style={{ animationDelay: "2.5s" }}
        />
        <div
          className="anim-aura absolute bottom-[-15%] left-1/4 h-[42vh] w-[42vh] rounded-full bg-[oklch(0.72_0.24_350/20%)] blur-[100px]"
          style={{ animationDelay: "5s" }}
        />
      </div>
      <GhostRain />
      {!ready ? (
        <div className="min-h-screen" />
      ) : mode === "gate" ? (
        <Gate onGuest={enterGuest} onOwner={enterOwner} />
      ) : mode === "owner" ? (
        <OwnerConsole onExit={exit} panel={panel} />
      ) : (
        <GuestChat name={name} code={guestCode} onExit={exit} />
      )}
    </>
  );
}

function Gate({
  onGuest,
  onOwner,
}: {
  onGuest: (name: string, code: string | null) => void;
  onOwner: (panel: Panel | null) => void;
}) {
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v === OWNER_CODE) {
      onOwner(null);
      return;
    }
    if (v.length < 2) {
      setError("Give me at least 2 characters.");
      return;
    }
    setBusy(true);
    // a sub-panel password opens that panel's console
    const { data: asPanel } = await supabase
      .from("panels")
      .select("id, code, label, created_at, couple_slot, participant_one, participant_two, private_mode")
      .eq("password", v)
      .maybeSingle();
    if (asPanel) {
      setBusy(false);
      onOwner(asPanel);
      return;
    }
    const clean = code.trim();
    let joinCode: string | null = null;
    if (clean) {
      const { data: p } = await supabase
        .from("panels")
        .select("code")
        .eq("code", clean)
        .maybeSingle();
      if (!p) {
        setBusy(false);
        setError("That code does not exist.");
        return;
      }
      joinCode = clean;
    }
    setBusy(false);
    onGuest(v, joinCode);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-6 sm:px-5">
      <div className="w-full max-w-md anim-rise">
        <div className="flex justify-center">
          <span className="anim-pulse-ring neon-ring relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-foreground/5 backdrop-blur-xl sm:h-24 sm:w-24 sm:rounded-3xl">
            <img
              src={dp.url}
              alt="HAROON H4CK profile"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </span>
        </div>
        <h1 className="anim-glitch-in mt-6 text-center font-[family-name:var(--font-mono)] text-3xl font-semibold uppercase tracking-[0.12em] text-sheen sm:mt-8 sm:text-4xl sm:tracking-[0.22em]">
          HAROON H4CK
        </h1>
        <p
          className="anim-rise mt-3 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.3em]"
          style={{ animationDelay: "260ms" }}
        >
          encrypted direct line // chat + audio call
        </p>
        <div
          className="anim-rise mt-4 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: "340ms" }}
        >
          {["1:1 private", "audio calls", "history saved"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-foreground/5 px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl"
            >
              {t}
            </span>
          ))}
        </div>

        <form
          onSubmit={submit}
          className="glass-panel anim-drop mt-7 rounded-2xl p-4 sm:mt-10 sm:rounded-3xl sm:p-6"
          style={{ animationDelay: "120ms" }}
        >
          <label
            htmlFor="gate-name"
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            your name
          </label>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_5rem] gap-2 sm:flex">
            <input
              id="gate-name"
              autoFocus
              value={value}
              maxLength={60}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="type your name…"
              className="min-w-0 rounded-xl border border-border bg-input px-3 py-3 text-base outline-none transition focus:border-foreground/50 focus:ring-2 focus:ring-ring/30 sm:flex-1 sm:rounded-2xl sm:px-4 sm:py-3.5 sm:text-lg"
            />
            <input
              id="gate-code"
              value={code}
              maxLength={8}
              inputMode="numeric"
              onChange={(e) => {
                setCode(e.target.value.trim());
                setError("");
              }}
              placeholder="code"
              aria-label="Panel code (optional)"
              className="w-full rounded-xl border border-border bg-input px-2 py-3 text-center font-[family-name:var(--font-mono)] text-base outline-none transition focus:border-foreground/50 focus:ring-2 focus:ring-ring/30 sm:w-24 sm:rounded-2xl sm:px-3 sm:py-3.5 sm:text-lg"
            />
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 sm:rounded-2xl sm:py-3.5"
          >
            {busy ? "Opening…" : "Open the line"}
          </button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Enter your name to continue. Add a panel code if you were given one.
          </p>
        </form>
        <div className="mt-6 flex justify-center">
          <InstallApp />
        </div>
        <p
          className="anim-rise mt-6 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70"
          style={{ animationDelay: "420ms" }}
        >
          developed by haroon
        </p>
      </div>
    </main>
  );
}

function Shell({
  title,
  subtitle,
  left,
  right,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const vh = useViewportHeight();
  return (
    <main
      className="fixed inset-x-0 mx-auto flex w-full max-w-2xl flex-col overflow-hidden"
      style={{
        height: vh.h ? `${vh.h}px` : "100dvh",
        top: vh.top ? `${vh.top}px` : 0,
      }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-card/60 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-3">
        {left}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-[family-name:var(--font-mono)] text-base tracking-[0.2em] lowercase">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {right}
      </header>
      {children}
      {footer}
    </main>
  );
}

function IconButton({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`shrink-0 rounded-full p-2 text-muted-foreground transition hover:text-foreground active:scale-95 ${
        danger ? "hover:bg-destructive/15 hover:text-destructive" : "hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function BubbleBody({ m, mine }: { m: Message; mine: boolean }) {
  if (m.kind === "photo" && m.media_url) {
    return (
      <a href={m.media_url} target="_blank" rel="noreferrer" className="block">
        <img
          src={m.media_url}
          alt="photo"
          loading="lazy"
          className="max-h-72 w-auto max-w-full rounded-2xl object-cover"
        />
      </a>
    );
  }
  if (m.kind === "voice" && m.media_url) {
    return (
      <div className="min-w-44">
        <audio controls preload="metadata" src={m.media_url} className="h-9 w-full" />
        {m.media_duration != null && (
          <p className={`mt-1 text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
            voice note · {m.media_duration}s
          </p>
        )}
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.content}</p>
  );
}

function Thread({
  messages,
  mineIs,
  notice,
}: {
  messages: Message[];
  mineIs: Sender;
  notice?: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-6">
      {notice && (
        <div className="anim-soft-in glass-panel mx-auto mb-2 max-w-[92%] rounded-2xl px-4 py-2.5 text-center">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
            {notice}
          </p>
        </div>
      )}
      {messages.length === 0 && (
        <p className="mt-20 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-muted-foreground">
          no signal yet — say something
        </p>
      )}
      {messages.map((m) => {
        const mine = m.sender === mineIs;
        return (
          <div key={m.id} className={`flex anim-drop ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 sm:max-w-[80%] sm:rounded-3xl sm:px-4 sm:py-2.5 ${
                mine ? "bubble-mine rounded-br-md" : "bubble-theirs rounded-bl-md"
              } ${m.kind === "photo" ? "px-1.5 py-1.5" : ""}`}
            >
              <BubbleBody m={m} mine={mine} />
              <p
                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                  mine ? "opacity-70" : "text-muted-foreground"
                }`}
              >
                {time(m.created_at)}
                {mine &&
                  !m.id.startsWith("tmp-") &&
                  (m.seen_at ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3 opacity-60" />
                  ))}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function useThread(conversationId: string | null, mineIs: Sender) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        if (!active || !data) return;
        const rows = data as Message[];
        if (rows.length <= MAX_MESSAGES) {
          setMessages(rows);
          return;
        }
        const cut = rows.length - TRIM_TO;
        const stale = rows.slice(0, cut);
        setMessages(rows.slice(cut));
        setNotice(
          `chat full ho gayi thi — sabse purane ${cut} message auto-clear kiye gaye. neeche wali chat safe hai.`,
        );
        await supabase
          .from("messages")
          .delete()
          .in(
            "id",
            stale.map((m) => m.id),
          );
      });

    const channel = supabase
      .channel(`thread-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender !== mineIs) vibrate();
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const withoutOptimistic = prev.filter(
              (m) =>
                !(m.id.startsWith("tmp-") && m.sender === msg.sender && m.content === msg.content),
            );
            return [...withoutOptimistic, msg];
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId, mineIs]);

  // mark the other side's messages as seen while this thread is open
  useEffect(() => {
    if (!conversationId) return;
    const unseen = messages.filter((m) => m.sender !== mineIs && !m.seen_at);
    if (!unseen.length) return;
    const stamp = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) => (m.sender !== mineIs && !m.seen_at ? { ...m, seen_at: stamp } : m)),
    );
    void supabase
      .from("messages")
      .update({ seen_at: stamp })
      .in(
        "id",
        unseen.map((m) => m.id),
      );
  }, [messages, mineIs, conversationId]);

  // keep my own bubbles' ticks live
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`seen-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId]);

  return { messages, setMessages, notice, setNotice };
}

async function sendMessage(conversationId: string, sender: Sender, out: Outgoing, senderName?: string) {
  const { data } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender,
      sender_name: senderName ?? null,
      content: out.kind === "text" ? out.content : "",
      kind: out.kind,
      media_url: out.kind === "text" ? null : out.mediaUrl,
      media_duration: out.kind === "voice" ? out.duration : null,
    })
    .select()
    .maybeSingle();
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  return (data as Message | null) ?? null;
}

function replaceOptimistic(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  tmpId: string,
  row: Message | null,
) {
  setMessages((prev) => {
    const without = prev.filter((m) => m.id !== tmpId);
    if (!row || without.some((m) => m.id === row.id)) return without;
    return [...without, row];
  });
}

function GuestChat({
  name,
  code,
  onExit,
}: {
  name: string;
  code: string | null;
  onExit: () => void;
}) {
  const [convoId, setConvoId] = useState<string | null>(null);
  const [ownerSeen, setOwnerSeen] = useState<string | null>(null);
  const { messages, setMessages, notice } = useThread(convoId, "guest");

  useEffect(() => {
    void askNotificationPermission();
  }, []);

  useEffect(() => {
    if (!convoId) return;
    void enablePush("guest", convoId, code);
    void supabase
      .from("conversations")
      .update({ guest_last_open: new Date().toISOString() })
      .eq("id", convoId);
  }, [convoId, code]);

  useEffect(() => {
    let active = true;
    const key = keyOf(name);
    (async () => {
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("name_key", key)
        .maybeSingle();
      if (existing) {
        if (!active) return;
        setConvoId(existing.id);
        setOwnerSeen((existing as Conversation).owner_last_open);
        if (code && (existing as Conversation).panel_code !== code) {
          await supabase.from("conversations").update({ panel_code: code }).eq("id", existing.id);
        }
        return;
      }
      const { data: created } = await supabase
        .from("conversations")
        .insert({ name, name_key: key, panel_code: code })
        .select()
        .maybeSingle();
      if (created && active) setConvoId(created.id);
      else if (active) {
        const { data: retry } = await supabase
          .from("conversations")
          .select("*")
          .eq("name_key", key)
          .maybeSingle();
        if (retry) setConvoId(retry.id);
      }
    })();
    return () => {
      active = false;
    };
  }, [name, code]);

  const send = useCallback(
    async (out: Outgoing) => {
      if (!convoId) return;
      const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: Message = {
        id: tmpId,
        conversation_id: convoId,
        sender: "guest",
        content: out.kind === "text" ? out.content : "",
        kind: out.kind,
        media_url: out.kind === "text" ? null : out.mediaUrl,
        media_duration: out.kind === "voice" ? out.duration : null,
        created_at: new Date().toISOString(),
        seen_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      const row = await sendMessage(convoId, "guest", out);
      replaceOptimistic(setMessages, tmpId, row);
      void sendPushNotice({
        data: { conversationId: convoId, from: "guest", kind: "message", panelCode: code },
      }).catch(() => {});
    },
    [convoId, code, setMessages],
  );

  return (
    <Shell
      title="HAROON H4CK"
      subtitle={ownerSeen ? ago(ownerSeen) : `You are ${name}`}
      left={
        <span className="neon-ring flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-foreground/5">
          <img src={dp.url} alt="HAROON H4CK" className="h-full w-full object-cover" />
        </span>
      }
      right={
        <IconButton onClick={onExit} label="Leave">
          <LogOut className="h-5 w-5" />
        </IconButton>
      }
      footer={<Composer onSend={send} disabled={!convoId} maxChars={MAX_CHARS} />}
    >
      <Thread messages={messages} mineIs="guest" notice={notice} />
    </Shell>
  );
}

function PanelManager({ onClose }: { onClose: () => void }) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [privateMode, setPrivateMode] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("panels")
      .select("id, code, label, created_at, couple_slot, participant_one, participant_two, private_mode")
      .order("created_at", { ascending: false });
    setPanels((data ?? []) as Panel[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = password.trim();
    const c = code.trim();
    if (p.length < 4) return setError("Password must be at least 4 characters.");
    if (!/^\d{2}$/.test(c)) return setError("Code must be exactly 2 digits.");
    const { error: err } = await supabase
      .from("panels")
      .insert({
        password: p,
        code: c,
        label: label.trim() || `panel ${c}`,
        private_mode: privateMode,
      });
    if (err) return setError("That code is already taken.");
    setPassword("");
    setCode("");
    setLabel("");
    setPrivateMode(false);
    setError("");
    void load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this panel? Its chats stay in your inbox.")) return;
    await supabase.from("panels").delete().eq("id", id);
    void load();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/80 p-4 backdrop-blur-xl sm:items-center">
      <div className="glass-panel anim-drop max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl p-4 sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.25em]">
            admin panels
          </h2>
          <IconButton onClick={onClose} label="Close">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        </div>
        <form onSubmit={create} className="mt-4 space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="panel name (e.g. rahul)"
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 outline-none focus:border-foreground/50"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="panel password"
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 outline-none focus:border-foreground/50"
          />
          <input
            value={code}
            maxLength={2}
            inputMode="numeric"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="2-digit code"
            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-center font-[family-name:var(--font-mono)] outline-none focus:border-foreground/50"
          />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium">Private panel</span>
              <span className="block text-xs text-muted-foreground">
                Show chat names and activity only, never messages
              </span>
            </span>
            <Switch
              checked={privateMode}
              onCheckedChange={setPrivateMode}
              aria-label="Private panel"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            Create panel
          </button>
        </form>
        <div className="mt-5 space-y-2">
          {panels.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">no extra panels yet</p>
          )}
          {panels.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/40 px-3 py-2.5"
            >
              <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{p.label}</p>
                <p className="truncate font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground">
                  code {p.code} · {p.private_mode ? "private summary" : "chat access"}
                </p>
              </div>
              <IconButton onClick={() => remove(p.id)} label="Delete panel" danger>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          Share each panel password privately. Passwords cannot be viewed again after creation.
        </p>
      </div>
    </div>
  );
}

function OwnerConsole({ onExit, panel }: { onExit: () => void; panel: Panel | null }) {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPanels, setShowPanels] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { messages, setMessages, notice } = useThread(
    canReadPanelMessages(panel?.private_mode) ? activeId : null,
    "owner",
  );

  useEffect(() => {
    void askNotificationPermission();
    void enablePush("owner", null, panel?.code ?? null);
  }, [panel]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      let q = supabase.from("conversations").select("*");
      if (panel) q = q.eq("panel_code", panel.code);
      const { data } = await q.order("last_message_at", { ascending: false });
      if (active && data) setConvos(data as Conversation[]);
    };
    void load();

    const channel = supabase
      .channel(`owner-inbox-${panel?.code ?? "master"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load);
    if (canReadPanelMessages(panel?.private_mode)) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender === "guest") vibrate();
          void load();
        },
      );
    }
    channel.subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [panel]);

  const activeConvo = useMemo(
    () =>
      (canReadPanelMessages(panel?.private_mode) ? convos.find((c) => c.id === activeId) : null) ??
      null,
    [convos, activeId],
  );

  useEffect(() => {
    if (!activeId || panel?.private_mode) return;
    void supabase
      .from("conversations")
      .update({ owner_last_open: new Date().toISOString() })
      .eq("id", activeId);
  }, [activeId, panel?.private_mode]);

  const deleteThread = useCallback(async (id: string, label: string) => {
    if (!window.confirm(`Delete the whole chat with ${label}? This cannot be undone.`)) return;
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    setConvos((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const send = useCallback(
    async (out: Outgoing) => {
      if (!activeId) return;
      const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const optimistic: Message = {
        id: tmpId,
        conversation_id: activeId,
        sender: "owner",
        content: out.kind === "text" ? out.content : "",
        kind: out.kind,
        media_url: out.kind === "text" ? null : out.mediaUrl,
        media_duration: out.kind === "voice" ? out.duration : null,
        created_at: new Date().toISOString(),
        seen_at: null,
      };
      setMessages((prev) => [...prev, optimistic]);
      const row = await sendMessage(activeId, "owner", out);
      replaceOptimistic(setMessages, tmpId, row);
      void sendPushNotice({
        data: { conversationId: activeId, from: "owner", kind: "message" },
      }).catch(() => {});
    },
    [activeId, setMessages],
  );

  if (activeConvo) {
    return (
      <Shell
        title={activeConvo.name}
        subtitle={ago(activeConvo.guest_last_open)}
        left={
          <IconButton onClick={() => setActiveId(null)} label="Back to inbox">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
        right={
          <IconButton
            onClick={() => deleteThread(activeConvo.id, activeConvo.name)}
            label="Delete this chat"
            danger
          >
            <Trash2 className="h-5 w-5" />
          </IconButton>
        }
        footer={<Composer onSend={send} maxChars={MAX_CHARS} />}
      >
        <Thread messages={messages} mineIs="owner" notice={notice} />
      </Shell>
    );
  }

  return (
    <>
      {showPanels && <PanelManager onClose={() => setShowPanels(false)} />}
      {showPasswordChange && panel && (
        <PanelPasswordChange panel={panel} onClose={() => setShowPasswordChange(false)} />
      )}
      <Shell
        title={panel ? panel.label : "Inbox"}
        subtitle={`${convos.length} thread${convos.length === 1 ? "" : "s"}${
          panel ? ` · code ${panel.code}` : ""
        }`}
        left={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-foreground/5">
            <MessageSquare className="h-5 w-5" />
          </span>
        }
        right={
          <div className="flex items-center">
            {panel && (
              <IconButton onClick={() => setShowPasswordChange(true)} label="Change password">
                <KeyRound className="h-5 w-5" />
              </IconButton>
            )}
            {!panel && (
              <IconButton onClick={() => setShowPanels(true)} label="Admin panels">
                <Plus className="h-5 w-5" />
              </IconButton>
            )}
            <IconButton onClick={onExit} label="Sign out">
              <LogOut className="h-5 w-5" />
            </IconButton>
          </div>
        }
      >
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {convos.length === 0 && (
            <p className="mt-20 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-muted-foreground">
              inbox empty
            </p>
          )}
          {convos.map((c, i) => (
            <div
              key={c.id}
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              className="anim-rise flex w-full items-center gap-2 rounded-2xl border border-border bg-card/40 px-3 py-3 backdrop-blur-xl transition hover:border-foreground/40 hover:bg-card/70"
            >
              <button
                onClick={() => {
                  if (!panel?.private_mode) setActiveId(c.id);
                }}
                disabled={panel?.private_mode}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/5 font-[family-name:var(--font-mono)] text-xs">
                  {initials(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {c.name}
                    {c.panel_code && !panel && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-muted-foreground">
                        {c.panel_code}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {time(c.last_message_at)} · {ago(c.guest_last_open)}
                  </span>
                </span>
              </button>
              {!panel?.private_mode && (
                <IconButton onClick={() => deleteThread(c.id, c.name)} label="Delete chat" danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          ))}
          <div className="flex justify-center pt-4">
            <InstallApp />
          </div>
          <p className="pt-3 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">
            developed by haroon
          </p>
        </div>
      </Shell>
    </>
  );
}

function PanelPasswordChange({ panel, onClose }: { panel: Panel; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.trim().length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }
    setSaving(true);
    setError("");
    const { data, error: updateError } = await supabase
      .from("panels")
      .update({ password: newPassword.trim() })
      .eq("id", panel.id)
      .eq("password", currentPassword)
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (updateError || !data) {
      setError("Current password is incorrect or the password could not be changed.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-xl sm:items-center">
      <div className="glass-panel max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl p-4 sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.18em] sm:tracking-[0.25em]">
            change panel password
          </h2>
          <IconButton onClick={onClose} label="Close">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        </div>
        {saved ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">Password changed. Keep it private.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground sm:rounded-2xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={updatePassword} className="mt-4 space-y-3">
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              aria-label="Current password"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-foreground/50 sm:rounded-2xl"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              aria-label="New password"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-foreground/50 sm:rounded-2xl"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50 sm:rounded-2xl"
            >
              {saving ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
