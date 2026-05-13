grant insert on table public.lojas to authenticated;

drop policy if exists lojas_insert_catalogo_chamados on public.lojas;
create policy lojas_insert_catalogo_chamados
  on public.lojas
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and ativo = true
    and cliente_id is not null
    and length(btrim(nome_loja)) > 0
    and exists (
      select 1
      from public.clientes c
      where c.id = lojas.cliente_id
        and c.ativo = true
    )
  );
