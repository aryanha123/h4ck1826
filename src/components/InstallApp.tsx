import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Lets visitors install the site as the H4CK app. */
export function InstallApp() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as Prompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setPrompt(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt) return null;

  return (
    <button
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
      className="glass-panel anim-rise flex items-center gap-2 rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
    >
      <Download className="h-3.5 w-3.5" /> install h4ck app
    </button>
  );
}
