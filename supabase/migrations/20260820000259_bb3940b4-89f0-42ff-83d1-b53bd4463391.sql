-- message read receipts + presence
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS seen_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS guest_last_open timestamptz DEFAULT now();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS owner_last_open timestamptz;

-- push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  role text NOT NULL CHECK (role IN ('guest','owner')),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push open" ON public.push_subscriptions;
CREATE POLICY "push open" ON public.push_subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- calls
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller text NOT NULL CHECK (caller IN ('guest','owner')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','declined','ended','missed','unreachable')),
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO anon, authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calls open" ON public.calls;
CREATE POLICY "calls open" ON public.calls FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('guest','owner')),
  kind text NOT NULL CHECK (kind IN ('offer','answer','ice')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_signals TO anon, authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "call signals open" ON public.call_signals;
CREATE POLICY "call signals open" ON public.call_signals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS calls_convo_idx ON public.calls(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_signals_call_idx ON public.call_signals(call_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
ALTER TABLE public.calls REPLICA IDENTITY FULL;
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;