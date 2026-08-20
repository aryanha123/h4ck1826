import { buildPushPayload } from "@block65/webcrypto-web-push";

export type NotifyInput = {
  conversationId: string;
  from: "guest" | "owner";
  kind: "message" | "call";
};

/** Sends a silent-content web push to the other side of a thread. */
export async function deliverPush({ conversationId, from, kind }: NotifyInput) {
  const vapid = {
    subject: process.env["VAPID_SUBJECT"] ?? "mailto:owner@example.com",
    publicKey: process.env["VAPID_PUBLIC_KEY"],
    privateKey: process.env["VAPID_PRIVATE_KEY"],
  };
  if (!vapid.publicKey || !vapid.privateKey) return { sent: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const query = supabaseAdmin.from("push_subscriptions").select("*");
  const { data: subs } =
    from === "guest"
      ? await query.eq("role", "owner")
      : await query.eq("role", "guest").eq("conversation_id", conversationId);

  if (!subs?.length) return { sent: 0 };

  const body =
    kind === "call" ? "Incoming audio call" : "You have a new message";
  const message = {
    data: { title: "H4CK", body, tag: kind === "call" ? "h4ck-call" : `h4ck-${conversationId}`, kind },
    options: { ttl: kind === "call" ? 60 : 3600, urgency: "high" as const },
  };

  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      const subscription = {
        endpoint: s.endpoint,
        expirationTime: null,
        keys: { auth: s.auth, p256dh: s.p256dh },
      };
      try {
        const payload = await buildPushPayload(message, subscription, vapid);
        const res = await fetch(s.endpoint, {
          method: payload.method,
          headers: payload.headers as Record<string, string>,
          body: new Uint8Array(payload.body).slice().buffer as ArrayBuffer,
        });
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        } else if (res.ok) {
          sent += 1;
        }
      } catch {
        /* ignore a single dead endpoint */
      }
    }),
  );
  return { sent };
}