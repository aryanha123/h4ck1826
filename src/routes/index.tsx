import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, LogOut, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haroon & Aysha — Private Chat" },
      {
        name: "description",
        content: "A password-protected private chat room made for two hearts.",
      },
      { property: "og:title", content: "Haroon & Aysha — Private Chat" },
      {
        property: "og:description",
        content: "A password-protected private chat room made for two hearts.",
      },
    ],
  }),
  component: Index,
});

type Sender = "haroon" | "aysha";
type Message = { id: string; sender: Sender; content: string; created_at: string };

const NAMES: Record<Sender, string> = { haroon: "Haroon", aysha: "Aysha" };
const STORAGE_KEY = "chat-who";

function Index() {
  const [me, setMe] = useState<Sender | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "haroon" || saved === "aysha") setMe(saved);
    setReady(true);
  }, []);

  const signIn = (who: Sender) => {
    window.localStorage.setItem(STORAGE_KEY, who);
    setMe(who);
  };

  const signOut = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setMe(null);
  };

  if (!ready) return <div className="min-h-screen" />;
  return me ? <Chat me={me} onExit={signOut} /> : <Gate onUnlock={signIn} />;
}

function Gate({ onUnlock }: { onUnlock: (who: Sender) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (v === "haroon") onUnlock("haroon");
    else if (v === "aysha") onUnlock("aysha");
    else {
      setError(true);
      setValue("");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card/70 p-8 backdrop-blur-xl [box-shadow:var(--shadow-soft)]">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full [background-image:var(--gradient-romance)]">
            <Heart className="h-7 w-7 text-primary-foreground" fill="currentColor" />
          </span>
        </div>
        <h1 className="mt-6 text-center font-[family-name:var(--font-display)] text-3xl italic text-foreground">
          Only Us
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your password to open the chat
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <input
            autoFocus
            type="password"
            value={value}
            maxLength={40}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            aria-label="Password"
            className="w-full rounded-2xl border border-border bg-input/40 px-4 py-3 text-center text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          {error && (
            <p className="text-center text-sm text-destructive">Wrong password, try again</p>
          )}
          <button
            type="submit"
            className="w-full rounded-2xl px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 [background-image:var(--gradient-romance)]"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}

function Chat({ me, onExit }: { me: Sender; onExit: () => void }) {
  const other: Sender = me === "haroon" ? "aysha" : "haroon";
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scroll = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) {
          setMessages(data as Message[]);
          setTimeout(() => scroll("auto"), 50);
        }
      });

    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [scroll]);

  useEffect(() => {
    scroll();
  }, [messages.length, scroll]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({ sender: me, content });
    if (error) setText(content);
    setSending(false);
    inputRef.current?.focus();
  };

  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  };

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/50 px-4 py-3 backdrop-blur-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-full [background-image:var(--gradient-romance)]">
          <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-[family-name:var(--font-display)] text-lg italic">
            {NAMES[other]}
          </h1>
          <p className="text-xs text-muted-foreground">You are {NAMES[me]}</p>
        </div>
        <button
          onClick={onExit}
          aria-label="Lock chat"
          className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No messages yet — say something sweet.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === me;
          return (
            <div
              key={m.id}
              className={`group flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
            >
              {mine && (
                <button
                  onClick={() => remove(m.id)}
                  aria-label="Delete message"
                  className="opacity-0 transition group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div
                className={`max-w-[78%] rounded-3xl px-4 py-2.5 ${
                  mine ? "bubble-mine rounded-br-md" : "bubble-theirs rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {m.content}
                </p>
                <p className={`mt-1 text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-border/60 bg-card/50 px-3 py-3 backdrop-blur-xl"
      >
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          aria-label="Message"
          className="flex-1 rounded-full border border-border bg-input/40 px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Send"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground transition hover:opacity-90 disabled:opacity-40 [background-image:var(--gradient-romance)]"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </main>
  );
}
