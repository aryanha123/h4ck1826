CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL CHECK (sender IN ('haroon','aysha')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.messages TO anon;
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "send messages" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "delete messages" ON public.messages FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX messages_created_at_idx ON public.messages (created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;