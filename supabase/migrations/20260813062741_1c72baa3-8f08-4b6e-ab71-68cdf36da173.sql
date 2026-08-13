GRANT DELETE ON public.messages TO anon, authenticated;
GRANT DELETE ON public.conversations TO anon, authenticated;

CREATE POLICY "messages deletable" ON public.messages FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "conversations deletable" ON public.conversations FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;