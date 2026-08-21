/** Progressive-app helpers: service worker, install prompt, notifications. */

import { supabase } from "@/integrations/supabase/client";

/** Public VAPID key — safe to ship to the browser. */
const VAPID_PUBLIC_KEY =
  "BCx02rTzuKrY13aN6kDC9HqzktO_RnNvQONnisu-1lAuINoqZLjV7J9g92StnqLsYO7Y3R7NrbigFNw5VSISYos";

let swReg: ServiceWorkerRegistration | null = null;

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js")
    .then((r) => {
      swReg = r;
    })
    .catch(() => {});
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function b64(buf: ArrayBuffer | null) {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * Registers this device for OS-level push so alerts arrive with the app closed.
 * Guests are tied to their thread, the owner receives every thread.
 */
export async function enablePush(
  role: "guest" | "owner",
  conversationId: string | null,
  panelCode: string | null = null,
) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window))
    return false;
  if (!(await askNotificationPermission())) return false;
  try {
    const reg = (await navigator.serviceWorker.ready) ?? swReg;
    if (!reg) return false;
    swReg = reg;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    const p256dh = json.keys?.p256dh ?? b64(sub.getKey("p256dh"));
    const auth = json.keys?.auth ?? b64(sub.getKey("auth"));
    if (!p256dh || !auth) return false;
    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        p256dh,
        auth,
        role,
        conversation_id: conversationId,
        last_active: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    return true;
  } catch {
    return false;
  }
}

export async function askNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/** Shows a soft notification. Never reveals who wrote or what was written. */
export function pushNotice(title: string, body: string, tag = "h4ck-msg") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const reg = swReg ?? null;
  if (reg?.active) {
    reg.active.postMessage({ type: "notify", title, body, tag });
    return;
  }
  try {
    new Notification(title, { body, icon: "/icon-192.png", tag });
  } catch {
    /* ignore */
  }
}

export function vibrate(pattern: number | number[] = 18) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
