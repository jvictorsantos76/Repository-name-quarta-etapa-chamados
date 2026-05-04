alter table public.solicitacoes_acesso
  add column if not exists link_acesso_manual text null,
  add column if not exists link_acesso_manual_gerado_em timestamptz null;

create index if not exists solicitacoes_acesso_link_manual_gerado_em_idx
  on public.solicitacoes_acesso (link_acesso_manual_gerado_em)
  where link_acesso_manual_gerado_em is not null;
