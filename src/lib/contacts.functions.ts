import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactInput = z.object({
  conversationId: z.string().uuid(),
  phone: z.string().trim().min(5).max(40),
  contactName: z.string().trim().max(120).nullable().optional(),
  consent: z.literal(true),
});

function assertContactsAccessCode(accessCode: string) {
  const expected = process.env["CONTACTS_ADMIN_CODE"];
  if (!expected || accessCode !== expected) throw new Error("Contacts access denied.");
}

export const saveVisitorContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("visitor_contacts").upsert(
      {
        conversation_id: data.conversationId,
        phone: data.phone,
        contact_name: data.contactName ?? null,
        consented_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" },
    );
    if (error) throw new Error("Could not save the shared contact.");
    return { saved: true };
  });

export const listVisitorContacts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ accessCode: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    assertContactsAccessCode(data.accessCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: contacts, error } = await supabaseAdmin
      .from("visitor_contacts")
      .select("conversation_id, phone, contact_name, consented_at")
      .order("consented_at", { ascending: false })
      .limit(500);
    if (error) throw new Error("Could not load shared contacts.");

    const ids = (contacts ?? []).map((contact) => contact.conversation_id);
    const { data: conversations } = ids.length
      ? await supabaseAdmin
          .from("conversations")
          .select("id, name, panel_code")
          .in("id", ids)
      : { data: [] };
    const conversationById = new Map((conversations ?? []).map((conversation) => [conversation.id, conversation]));

    return (contacts ?? []).map((contact) => {
      const conversation = conversationById.get(contact.conversation_id);
      return {
        conversationId: contact.conversation_id,
        phone: contact.phone,
        contactName: contact.contact_name,
        consentedAt: contact.consented_at,
        visitorName: conversation?.name ?? "Visitor",
        panelCode: conversation?.panel_code ?? null,
      };
    });
  });