CREATE TABLE public.panels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  password text not null,
  label text not null default 'panel',
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panels TO anon, authenticated;
GRANT ALL ON public.panels TO service_role;
ALTER TABLE public.panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "panels open" ON public.panels FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS panel_code text;
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS panel_code text;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS panel_code text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.panels;