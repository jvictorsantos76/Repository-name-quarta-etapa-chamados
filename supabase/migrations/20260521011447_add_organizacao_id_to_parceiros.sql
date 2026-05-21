alter table public.parceiros
  add column if not exists organizacao_id uuid null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.parceiros'::regclass
       and conname = 'parceiros_organizacao_id_fkey'
  ) then
    alter table public.parceiros
      add constraint parceiros_organizacao_id_fkey
      foreign key (organizacao_id) references public.organizacoes(id);
  end if;
end $$;

create index if not exists parceiros_organizacao_id_idx
  on public.parceiros (organizacao_id)
  where organizacao_id is not null;

update public.parceiros p
   set organizacao_id = c.organizacao_id
  from public.clientes c
 where p.organizacao_id is null
   and p.cliente_legado_id = c.id
   and c.organizacao_id is not null;
