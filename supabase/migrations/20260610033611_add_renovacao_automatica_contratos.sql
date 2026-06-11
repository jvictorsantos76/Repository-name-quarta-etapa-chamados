alter table public.parceiros_contratos
  add column if not exists renovacao_automatica boolean not null default false;
