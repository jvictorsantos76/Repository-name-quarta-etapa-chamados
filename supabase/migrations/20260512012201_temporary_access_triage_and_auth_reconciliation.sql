do $$
declare
  triagem_cliente_id uuid;
begin
  if to_regclass('public.clientes') is not null then
    select id
    into triagem_cliente_id
    from public.clientes
    where nome_fantasia = 'Triagem de Acesso Temporario'
      and ativo = true
    order by created_at asc
    limit 1;

    if triagem_cliente_id is null then
      insert into public.clientes (
        nome_fantasia,
        razao_social,
        ativo
      )
      values (
        'Triagem de Acesso Temporario',
        'Triagem de Acesso Temporario',
        true
      )
      returning id into triagem_cliente_id;
    end if;

    if to_regclass('public.lojas') is not null then
      if not exists (
        select 1
        from public.lojas
        where cliente_id = triagem_cliente_id
          and nome_loja = 'Fila de Triagem'
          and ativo = true
      ) then
        insert into public.lojas (
          cliente_id,
          nome_loja,
          cidade,
          estado,
          ativo
        )
        values (
          triagem_cliente_id,
          'Fila de Triagem',
          'Fortaleza',
          'CE',
          true
        );
      end if;
    end if;
  end if;
end $$;

create index if not exists aceites_legais_perfil_id_idx
  on public.aceites_legais (perfil_id)
  where perfil_id is not null;

create index if not exists aceites_legais_solicitacao_acesso_id_idx
  on public.aceites_legais (solicitacao_acesso_id)
  where solicitacao_acesso_id is not null;

create index if not exists chamados_operador_id_idx
  on public.chamados (operador_id);

create index if not exists perfis_cliente_id_idx
  on public.perfis (cliente_id)
  where cliente_id is not null;

create index if not exists perfis_loja_id_idx
  on public.perfis (loja_id)
  where loja_id is not null;

create index if not exists solicitacoes_acesso_auth_user_id_idx
  on public.solicitacoes_acesso (auth_user_id)
  where auth_user_id is not null;

create index if not exists solicitacoes_acesso_aprovado_por_idx
  on public.solicitacoes_acesso (aprovado_por)
  where aprovado_por is not null;

create index if not exists solicitacoes_acesso_rejeitado_por_idx
  on public.solicitacoes_acesso (rejeitado_por)
  where rejeitado_por is not null;

create index if not exists solicitacoes_acesso_cliente_id_idx
  on public.solicitacoes_acesso (cliente_id)
  where cliente_id is not null;

create index if not exists solicitacoes_acesso_loja_id_idx
  on public.solicitacoes_acesso (loja_id)
  where loja_id is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.atualizar_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.atualizar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.atualizado_em = now();
  return new;
end;
$function$;

revoke execute on function public.usuario_admin_usuarios_ativo() from public, anon;
revoke execute on function public.usuario_admin_ou_gestor_ativo() from public, anon;
revoke execute on function public.usuario_operacional_ativo() from public, anon;
revoke execute on function public.usuario_solicitacao_pendente_ativa() from public, anon;
revoke execute on function public.usuario_acesso_chamados_ativo() from public, anon;
revoke execute on function public.usuario_catalogo_chamados_ativo() from public, anon;

grant execute on function public.usuario_admin_usuarios_ativo() to authenticated;
grant execute on function public.usuario_admin_ou_gestor_ativo() to authenticated;
grant execute on function public.usuario_operacional_ativo() to authenticated;
grant execute on function public.usuario_solicitacao_pendente_ativa() to authenticated;
grant execute on function public.usuario_acesso_chamados_ativo() to authenticated;
grant execute on function public.usuario_catalogo_chamados_ativo() to authenticated;
