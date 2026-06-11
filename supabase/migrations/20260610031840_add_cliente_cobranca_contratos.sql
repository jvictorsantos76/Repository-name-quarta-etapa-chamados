alter table public.parceiros_contratos
  add column if not exists cobranca_parceiro_id uuid null references public.parceiros(id);

create index if not exists parceiros_contratos_cobranca_parceiro_id_idx
  on public.parceiros_contratos (cobranca_parceiro_id);
