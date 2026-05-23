create table public.group_flags (
  id uuid not null default gen_random_uuid (),
  group_id uuid null,
  reporter_id uuid null,
  reason text null,
  evidence_url text null,
  status text null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  evidence_public_id text null,
  admin_feedback text null,
  is_escalated boolean null default false,
  category text null,
  constraint group_flags_pkey primary key (id),
  constraint group_flags_group_id_fkey foreign KEY (group_id) references groups (id)
) TABLESPACE pg_default;

create index IF not exists idx_group_flags_escalated on public.group_flags using btree (is_escalated) TABLESPACE pg_default
where
  (is_escalated = true);

create index IF not exists idx_group_flags_evidence_public_id on public.group_flags using btree (evidence_public_id) TABLESPACE pg_default
where
  (evidence_public_id is not null);
