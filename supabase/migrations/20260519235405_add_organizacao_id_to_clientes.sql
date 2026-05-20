alter table public.clientes
  add column if not exists organizacao_id uuid null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.clientes'::regclass
       and conname = 'clientes_organizacao_id_fkey'
  ) then
    alter table public.clientes
      add constraint clientes_organizacao_id_fkey
      foreign key (organizacao_id) references public.organizacoes(id);
  end if;
end $$;

create index if not exists clientes_organizacao_id_idx
  on public.clientes (organizacao_id)
  where organizacao_id is not null;

with correspondencias as (
  select
    c.id as cliente_id,
    (array_agg(o.id order by o.id::text))[1] as organizacao_id,
    count(*) as total_correspondencias
  from public.clientes c
  join public.organizacoes o
    on lower(btrim(c.nome_fantasia)) = lower(btrim(o.nome))
  where c.organizacao_id is null
  group by c.id
)
update public.clientes c
   set organizacao_id = correspondencias.organizacao_id
  from correspondencias
 where c.id = correspondencias.cliente_id
   and correspondencias.total_correspondencias = 1;

grant select, references on table public.organizacoes to authenticated;
grant select, references on table public.organizacoes to service_role;
grant select, insert, update on table public.clientes to service_role;

revoke delete on table public.clientes from anon, authenticated, service_role;
