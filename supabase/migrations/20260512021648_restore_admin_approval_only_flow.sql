do $$
begin
  update public.solicitacoes_acesso sa
     set status =
           case
             when sa.email_confirmado_em is not null then 'pendente_aprovacao'
             else 'pendente_confirmacao_email'
           end,
         perfil_id = null,
         expira_em = null,
         bloqueado_em = null,
         erro_provisionamento = case
           when sa.status in ('expirado', 'pendente_aprovacao')
             then 'Fluxo temporário desativado. Solicitação retornada para aprovação administrativa.'
           else sa.erro_provisionamento
         end
   where sa.status in ('pendente_confirmacao_email', 'pendente_aprovacao', 'expirado')
     and exists (
       select 1
         from public.perfis p
        where p.id = coalesce(sa.perfil_id, sa.user_id, sa.auth_user_id)
          and p.papel = 'solicitante'
     );

  update public.perfis
     set ativo = false
   where papel = 'solicitante'
     and ativo = true
     and not exists (
       select 1
         from public.solicitacoes_acesso sa
        where sa.perfil_id = perfis.id
          and sa.status = 'aprovado'
     );
end $$;

create or replace function public.usuario_solicitacao_pendente_ativa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

create or replace function public.usuario_acesso_chamados_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_operacional_ativo();
$$;

create or replace function public.usuario_cliente_solicitante_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.perfis p
     where p.id = auth.uid()
       and p.ativo = true
       and p.papel = 'cliente'
  );
$$;
