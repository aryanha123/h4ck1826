import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { deliverPush } from "./notify.server";

export const sendPushNotice = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        from: z.enum(["guest", "owner"]),
        kind: z.enum(["message", "call"]),
        panelCode: z.string().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => deliverPush(data));

/** The public VAPID key is safe to expose — it only identifies our server. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return (
    process.env["VAPID_PUBLIC_KEY_V2"] ?? process.env["VAPID_PUBLIC_KEY"] ?? null
  );
});
