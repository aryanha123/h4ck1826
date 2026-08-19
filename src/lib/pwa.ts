/** Progressive-app helpers: service worker, install prompt, notifications. */

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
