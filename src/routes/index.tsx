import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, LogOut, MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuraAudio } from "@/components/AuraAudio";
import { GhostRain } from "@/components/GhostRain";
import { Splash } from "@/components/Splash";
import { InstallApp } from "@/components/InstallApp";
import { askNotificationPermission, pushNotice, registerServiceWorker, vibrate } from "@/lib/pwa";
import dp from "@/assets/owner-dp.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HAROON H4CK — private direct line" },
      {
        name: "description",
        content:
          "Drop your name and open an encrypted private direct line with HAROON H4CK. Your thread stays yours — nobody else can see it.",
      },
      { property: "og:title", content: "HAROON H4CK — private direct line" },
      {
        property: "og:description",
        content: "Drop your name and open an encrypted private direct line with HAROON H4CK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const OWNER_CODE = "haroonha754@gmail.com";
const STORE_KEY = "nocturne-name";
const SEEN_KEY = "h4ck-last-seen";
/** Per-thread capacity. Beyond this the oldest messages roll off automatically. */
const MAX_MESSAGES = 4000;
const TRIM_TO = 3000;
const MAX_CHARS = 20000;

type Sender = "guest" | "owner";
type Message = {
  id: string;
  conversation_id: string;
  sender: Sender;
  content: string;
  created_at: string;
};
type Conversation = {
  id: string;
  name: string;
  name_key: string;
  created_at: string;
  last_message_at: string;
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

function Index() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"gate" | "guest" | "owner">("gate");
  const [name, setName] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORE_KEY);
    if (saved === OWNER_CODE) setMode("owner");
    else if (saved) {
      setName(saved);
      setMode("guest");
    }
    setReady(true);
    registerServiceWorker();
  }, []);

  const enter = (raw: string) => {
    if (raw === OWNER_CODE) {
      window.localStorage.setItem(STORE_KEY, OWNER_CODE);
      setMode("owner");
      return;
    }
    const clean = raw.trim().replace(/\s+/g, " ");
    window.localStorage.setItem(STORE_KEY, clean);
    setName(clean);
    setMode("guest");
  };

  const exit = () => {
    window.localStorage.removeItem(STORE_KEY);
    setName("");
    setMode("gate");
  };

  return (
    <>
      <Splash />
      <AuraAudio />
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
        <Gate onEnter={enter} />
      ) : mode === "owner" ? (
        <OwnerConsole onExit={exit} />
      ) : (
        <GuestChat name={name} onExit={exit} />
      )}
    </>
  );
}

function Gate({ onEnter }: { onEnter: (name: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v.length < 2) {
      setError("Give me at least 2 characters.");
      return;
    }
    onEnter(v);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md anim-rise">
        <div className="flex justify-center">
          <span className="anim-pulse-ring neon-ring relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border bg-foreground/5 backdrop-blur-xl">
            <img
              src={dp.url}
              alt="HAROON H4CK profile"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </span>
        </div>
        <h1 className="anim-glitch-in mt-8 text-center font-[family-name:var(--font-mono)] text-4xl font-semibold uppercase tracking-[0.22em] text-sheen">
          HAROON H4CK
        </h1>
        <p
          className="anim-rise mt-3 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-muted-foreground"
          style={{ animationDelay: "260ms" }}
        >
          encrypted direct line // trace nahi hoga, delete nahi hoga
        </p>
        <div
          className="anim-rise mt-4 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: "340ms" }}
        >
          {["1:1 private", "history saved", "no one else sees"].map((t) => (
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
          className="glass-panel anim-drop mt-10 rounded-3xl p-6"
          style={{ animationDelay: "120ms" }}
        >
          <label
            htmlFor="gate-name"
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            your name
          </label>
          <input
            id="gate-name"
            autoFocus
            value={value}
            maxLength={40}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            placeholder="type your name…"
            className="mt-3 w-full rounded-2xl border border-border bg-input px-4 py-3.5 text-lg outline-none transition focus:border-foreground/50 focus:ring-2 focus:ring-ring/30"
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-primary px-4 py-3.5 font-medium text-primary-foreground transition hover:opacity-90 active:scale-[0.99]"
          >
            Open the line
          </button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Same name reopens your old chat. Nothing ever gets deleted.
          </p>
        </form>
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
  return (
    <main className="mx-auto flex h-[100dvh] max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur-xl">
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

function Composer({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || disabled) return;
    setText("");
    onSend(v);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 items-center gap-2 border-t border-border bg-card/50 px-3 py-3 backdrop-blur-xl"
    >
      <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-input/70 px-2 py-1 backdrop-blur-xl transition focus-within:border-foreground/50 focus-within:[box-shadow:0_0_0_4px_oklch(1_0_0/8%)]">
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="type something…"
        maxLength={MAX_CHARS}
        aria-label="Message"
        className="flex-1 bg-transparent px-3 py-2.5 outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        aria-label="Send"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-30 active:scale-95"
      >
        <Send className="h-5 w-5" />
      </button>
      </div>
    </form>
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
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
      {notice && (
        <div className="anim-soft-in glass-panel sticky top-0 z-10 mx-auto mb-2 max-w-[92%] rounded-2xl px-4 py-2.5 text-center">
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
              className={`max-w-[80%] rounded-3xl px-4 py-2.5 ${
                mine ? "bubble-mine rounded-br-md" : "bubble-theirs rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {m.content}
              </p>
              <p className={`mt-1 text-[10px] ${mine ? "opacity-60" : "text-muted-foreground"}`}>
                {time(m.created_at)}
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
          `chat full ho gayi thi — sabse purane ${cut} message auto-clear kiye gaye. neeche wali chat safe hai, aap continue kar sakte ho.`,
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
          if (msg.sender !== mineIs) {
            vibrate();
            pushNotice("H4CK", "You have a new message", `h4ck-${conversationId}`);
          }
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

  return { messages, setMessages, notice, setNotice };
}

async function sendMessage(conversationId: string, sender: Sender, content: string) {
  const { data } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender, content })
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

function GuestChat({ name, onExit }: { name: string; onExit: () => void }) {
  const [convoId, setConvoId] = useState<string | null>(null);
  const { messages, setMessages, notice, setNotice } = useThread(convoId, "guest");

  useEffect(() => {
    askNotificationPermission();
  }, []);

  // "You have new messages" hint when re-opening the app, without revealing content.
  useEffect(() => {
    if (!messages.length) return;
    const seen = window.localStorage.getItem(SEEN_KEY);
    const unseen = messages.filter((m) => m.sender === "owner" && (!seen || m.created_at > seen));
    if (unseen.length && !notice) {
      setNotice(`aapke liye ${unseen.length} naya message aaya hai`);
    }
    const last = messages[messages.length - 1];
    if (last) window.localStorage.setItem(SEEN_KEY, last.created_at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

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
        if (active) setConvoId(existing.id);
        return;
      }
      const { data: created } = await supabase
        .from("conversations")
        .insert({ name, name_key: key })
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
  }, [name]);

  const send = useCallback(
    async (text: string) => {
      if (!convoId) return;
      const tmpId = `tmp-${Date.now()}`;
      const optimistic: Message = {
        id: tmpId,
        conversation_id: convoId,
        sender: "guest",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const row = await sendMessage(convoId, "guest", text);
      replaceOptimistic(setMessages, tmpId, row);
    },
    [convoId, setMessages],
  );

  return (
    <Shell
      title="HAROON H4CK"
      subtitle={`You are ${name}`}
      left={
        <span className="neon-ring flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-foreground/5">
          <img src={dp.url} alt="HAROON H4CK" className="h-full w-full object-cover" />
        </span>
      }
      right={
        <button
          onClick={onExit}
          aria-label="Leave"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      }
      footer={<Composer onSend={send} disabled={!convoId} />}
    >
      <Thread messages={messages} mineIs="guest" notice={notice} />
    </Shell>
  );
}

function OwnerConsole({ onExit }: { onExit: () => void }) {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages, setMessages } = useThread(activeId);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (active && data) setConvos(data as Conversation[]);
    };
    load();

    const channel = supabase
      .channel("owner-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const activeConvo = useMemo(
    () => convos.find((c) => c.id === activeId) ?? null,
    [convos, activeId],
  );

  const deleteThread = useCallback(
    async (id: string, label: string) => {
      if (!window.confirm(`Delete the whole chat with ${label}? This cannot be undone.`)) return;
      await supabase.from("messages").delete().eq("conversation_id", id);
      await supabase.from("conversations").delete().eq("id", id);
      setConvos((prev) => prev.filter((c) => c.id !== id));
      setActiveId((cur) => (cur === id ? null : cur));
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      if (!activeId) return;
      const tmpId = `tmp-${Date.now()}`;
      const optimistic: Message = {
        id: tmpId,
        conversation_id: activeId,
        sender: "owner",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      const row = await sendMessage(activeId, "owner", text);
      replaceOptimistic(setMessages, tmpId, row);
    },
    [activeId, setMessages],
  );

  if (activeConvo) {
    return (
      <Shell
        title={activeConvo.name}
        subtitle="Replying privately"
        left={
          <button
            onClick={() => setActiveId(null)}
            aria-label="Back to inbox"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
        right={
          <button
            onClick={() => deleteThread(activeConvo.id, activeConvo.name)}
            aria-label="Delete this chat"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        }
        footer={<Composer onSend={send} />}
      >
        <Thread messages={messages} mineIs="owner" />
      </Shell>
    );
  }

  return (
    <Shell
      title="Inbox"
      subtitle={`${convos.length} thread${convos.length === 1 ? "" : "s"}`}
      left={
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-foreground/5">
          <MessageSquare className="h-5 w-5" />
        </span>
      }
      right={
        <button
          onClick={onExit}
          aria-label="Sign out"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
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
              onClick={() => setActiveId(c.id)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/5 font-[family-name:var(--font-mono)] text-xs">
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">
                  last activity {time(c.last_message_at)}
                </span>
              </span>
            </button>
            <button
              onClick={() => deleteThread(c.id, c.name)}
              aria-label={`Delete chat with ${c.name}`}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <p className="pt-4 text-center font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em] text-muted-foreground/70">
          developed by haroon
        </p>
      </div>
    </Shell>
  );
}
