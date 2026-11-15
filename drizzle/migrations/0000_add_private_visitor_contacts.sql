CREATE TABLE public.visitor_contacts (
  conversation_id uuid PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  phone text NOT NULL,
  contact_name text,
  consented_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON TABLE public.visitor_contacts TO service_role;
ALTER TABLE public.visitor_contacts ENABLE ROW LEVEL SECURITY;