ALTER TABLE public.passkey_credentials
  ADD COLUMN identity_key text;

CREATE TABLE public.passkey_sessions (
  session_token_hash text PRIMARY KEY,
  room_slot smallint NOT NULL CHECK (room_slot BETWEEN 1 AND 5),
  participant_slot smallint NOT NULL CHECK (participant_slot IN (1, 2)),
  identity_key text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON TABLE public.passkey_sessions TO service_role;
ALTER TABLE public.passkey_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX passkey_sessions_expiry_idx ON public.passkey_sessions (expires_at);

CREATE TABLE public.couple_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slot smallint NOT NULL CHECK (room_slot BETWEEN 1 AND 5),
  sender_slot smallint NOT NULL CHECK (sender_slot IN (1, 2)),
  sender_name text NOT NULL,
  content text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'photo', 'voice')),
  media_url text,
  media_duration integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz
);
GRANT ALL ON TABLE public.couple_messages TO service_role;
ALTER TABLE public.couple_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX couple_messages_room_time_idx ON public.couple_messages (room_slot, created_at DESC);