import { supabase } from "@/integrations/supabase/client";

const BUCKET = "chat-media";
/** ~10 years — links stay alive for the whole life of the chat. */
const SIGN_FOR = 60 * 60 * 24 * 3650;

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_VOICE_SECONDS = 180;

/** Uploads a photo / voice note and returns a long-lived signed link. */
export async function uploadMedia(file: Blob, ext: string, contentType: string) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (error) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGN_FOR);
  return data?.signedUrl ?? null;
}
