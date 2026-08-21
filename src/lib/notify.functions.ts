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
