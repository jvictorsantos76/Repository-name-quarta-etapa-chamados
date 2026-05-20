alter table public.chamados
  drop constraint if exists chamados_organizacao_id_fkey;

update public.chamados c
   set organizacao_id = clientes.organizacao_id
  from public.clientes clientes
 where c.organizacao_id = clientes.id;

update public.chamados c
   set organizacao_id = null
 where c.organizacao_id is not null
   and not exists (
     select 1
       from public.organizacoes o
      where o.id = c.organizacao_id
   );

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.chamados'::regclass
       and conname = 'chamados_organizacao_id_fkey'
  ) then
    alter table public.chamados
      add constraint chamados_organizacao_id_fkey
      foreign key (organizacao_id) references public.organizacoes(id);
  end if;
end $$;

grant references on table public.organizacoes to authenticated;
grant references on table public.organizacoes to service_role;

drop policy if exists chamados_insert_por_acesso on public.chamados;
create policy chamados_insert_por_acesso
  on public.chamados
  for insert
  to authenticated
  with check (
    (
      public.usuario_operacional_ativo()
      and operador_id = auth.uid()
    )
    or exists (
      select 1
        from public.perfis p
        join public.lojas l on l.id = p.loja_id
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in ('cliente', 'parceiro')
         and p.loja_id is not null
         and p.loja_id = chamados.loja_id
         and operador_id = auth.uid()
         and l.cliente_id = chamados.cliente_id
    )
  );
