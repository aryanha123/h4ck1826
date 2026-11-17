ALTER TABLE public.panels
  ADD COLUMN couple_slot smallint,
  ADD COLUMN participant_one text,
  ADD COLUMN participant_two text;

ALTER TABLE public.panels
  ADD CONSTRAINT panels_couple_slot_range
  CHECK (couple_slot IS NULL OR couple_slot BETWEEN 1 AND 5);

CREATE UNIQUE INDEX panels_couple_slot_key
  ON public.panels (couple_slot)
  WHERE couple_slot IS NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN sender_name text;

CREATE TABLE public.passkey_credentials (
  id text PRIMARY KEY,
  room_slot smallint NOT NULL CHECK (room_slot BETWEEN 1 AND 5),
  participant_slot smallint NOT NULL CHECK (participant_slot IN (1, 2)),
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_type text NOT NULL DEFAULT 'singleDevice',
  backed_up boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON TABLE public.passkey_credentials TO service_role;
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.passkey_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slot smallint NOT NULL CHECK (room_slot BETWEEN 1 AND 5),
  participant_slot smallint NOT NULL CHECK (participant_slot IN (1, 2)),
  challenge text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON TABLE public.passkey_challenges TO service_role;
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;
CREATE INDEX passkey_challenges_identity_created_idx
  ON public.passkey_challenges (room_slot, participant_slot, created_at DESC);