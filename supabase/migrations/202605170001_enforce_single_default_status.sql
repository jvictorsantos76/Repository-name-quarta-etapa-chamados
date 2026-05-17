-- Garante regra de negócio: apenas 1 status pode ser padrão no catálogo.
drop index if exists public.chamado_status_padrao_ativo_key;

create unique index if not exists chamado_status_padrao_unico_key
  on public.chamado_status (eh_padrao)
  where eh_padrao = true;
