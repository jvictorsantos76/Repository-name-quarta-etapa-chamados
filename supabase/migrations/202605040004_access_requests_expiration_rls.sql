create or replace function public.calcular_expiracao_horas_uteis(
  inicio timestamptz,
  horas_uteis integer
)
returns timestamptz
language plpgsql
stable
as $$
declare
  cursor_ts timestamptz := date_trunc('hour', inicio);
  horas_contadas integer := 0;
begin
  if horas_uteis <= 0 then
    return inicio;
  end if;

  while horas_contadas < horas_uteis loop
    cursor_ts := cursor_ts + interval '1 hour';

    if extract(isodow from cursor_ts) between 1 and 5 then
      horas_contadas := horas_contadas + 1;
    end if;
  end loop;

  return cursor_ts;
end;
$$;

alter table if exists public.solicitacoes_acesso
  add column if not exists motivo_rejeicao text null,
  add column if not exists expira_em timestamptz null,
  add column if not exists status_provisionamento text null,
  add column if not exists provisionamento_tentado_em timestamptz null,
  add column if not exists convite_reenviado_em timestamptz null;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null
    and exists (
      select 1
      from pg_type
      where typname = 'papel_usuario'
    ) then
    alter table public.solicitacoes_acesso
      add column if not exists nivel_acesso public.papel_usuario null;
  end if;
end $$;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null then
    update public.solicitacoes_acesso
    set status = case
      when status = 'pendente_aprovacao' then 'pendente'
      when status = 'aprovado' and provisionado_em is not null then 'provisionado'
      when status = 'cancelado' then 'rejeitado'
      else status
    end
    where status in ('pendente_aprovacao', 'aprovado', 'cancelado');

    update public.solicitacoes_acesso
    set expira_em = public.calcular_expiracao_horas_uteis(created_at, 72)
    where expira_em is null;

    update public.solicitacoes_acesso
    set status_provisionamento = case
      when provisionado_em is not null then 'provisionado'
      when erro_provisionamento is not null then 'erro_envio_convite'
      when status = 'aprovado' then 'pendente'
      else coalesce(status_provisionamento, 'nao_iniciado')
    end
    where status_provisionamento is null;

    alter table public.solicitacoes_acesso
      alter column status set default 'pendente',
      alter column expira_em set default public.calcular_expiracao_horas_uteis(now(), 72);

    alter table public.solicitacoes_acesso
      drop constraint if exists solicitacoes_acesso_status_check;

    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_status_check
      check (status in (
        'pendente',
        'aprovado',
        'provisionado',
        'rejeitado',
        'expirado',
        'erro_envio_convite'
      ));

    alter table public.solicitacoes_acesso
      drop constraint if exists solicitacoes_acesso_status_provisionamento_check;

    alter table public.solicitacoes_acesso
      add constraint solicitacoes_acesso_status_provisionamento_check
      check (
        status_provisionamento is null
        or status_provisionamento in (
          'nao_iniciado',
          'pendente',
          'provisionado',
          'erro_envio_convite'
        )
      );
  end if;
end $$;

drop index if exists public.solicitacoes_acesso_email_pendente_idx;

create unique index if not exists solicitacoes_acesso_email_pendente_idx
  on public.solicitacoes_acesso (lower(email))
  where status = 'pendente';

create index if not exists solicitacoes_acesso_expira_em_idx
  on public.solicitacoes_acesso (expira_em)
  where status = 'pendente';

alter table if exists public.perfis
  add column if not exists telefone text null,
  add column if not exists avatar_url text null,
  add column if not exists biografia text null,
  add column if not exists cargo text null,
  add column if not exists cliente_id uuid null,
  add column if not exists loja_id uuid null;

do $$
begin
  if to_regclass('public.perfis') is not null
    and to_regclass('public.clientes') is not null then
    alter table public.perfis
      add constraint perfis_cliente_id_fkey
      foreign key (cliente_id) references public.clientes(id);
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if to_regclass('public.perfis') is not null
    and to_regclass('public.lojas') is not null then
    alter table public.perfis
      add constraint perfis_loja_id_fkey
      foreign key (loja_id) references public.lojas(id);
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if to_regclass('public.perfis') is not null then
    create or replace function public.usuario_operacional_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.perfis
        where id = auth.uid()
          and ativo = true
          and papel in (
            'super_admin',
            'admin',
            'gestor',
            'operador',
            'analista',
            'tecnico'
          )
      );
    $function$;

    create or replace function public.usuario_admin_usuarios_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.perfis
        where id = auth.uid()
          and ativo = true
          and papel in ('super_admin', 'admin')
      );
    $function$;

    create or replace function public.usuario_admin_ou_gestor_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select public.usuario_admin_usuarios_ativo();
    $function$;

    create or replace function public.usuario_cliente_solicitante_ativo()
    returns boolean
    language sql
    security definer
    set search_path = public
    as $function$
      select exists (
        select 1
        from public.perfis
        where id = auth.uid()
          and ativo = true
          and papel in ('cliente', 'solicitante')
      );
    $function$;
  end if;
end $$;

grant execute on function public.calcular_expiracao_horas_uteis(timestamptz, integer) to anon, authenticated;

do $$
begin
  if to_regprocedure('public.usuario_admin_usuarios_ativo()') is not null then
    grant execute on function public.usuario_admin_usuarios_ativo() to authenticated;
  end if;

  if to_regprocedure('public.usuario_cliente_solicitante_ativo()') is not null then
    grant execute on function public.usuario_cliente_solicitante_ativo() to authenticated;
  end if;

  if to_regclass('public.perfis') is not null then
    revoke update on table public.perfis from authenticated;
    grant select on table public.perfis to authenticated;
    grant update (telefone, avatar_url, biografia) on table public.perfis to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.solicitacoes_acesso') is not null then
    drop policy if exists solicitacoes_acesso_insert_publico on public.solicitacoes_acesso;
    create policy solicitacoes_acesso_insert_publico
      on public.solicitacoes_acesso
      for insert
      to anon
      with check (
        status = 'pendente'
        and aceite_termos = true
        and aceite_privacidade = true
        and nome_completo <> ''
        and email <> ''
        and empresa <> ''
        and expira_em is not null
      );

    if to_regprocedure('public.usuario_admin_usuarios_ativo()') is not null then
      drop policy if exists solicitacoes_acesso_select_admin_gestor on public.solicitacoes_acesso;
      drop policy if exists solicitacoes_acesso_select_admin on public.solicitacoes_acesso;
      create policy solicitacoes_acesso_select_admin
        on public.solicitacoes_acesso
        for select
        to authenticated
        using (public.usuario_admin_usuarios_ativo());

      drop policy if exists solicitacoes_acesso_update_admin_gestor on public.solicitacoes_acesso;
      drop policy if exists solicitacoes_acesso_update_admin on public.solicitacoes_acesso;
      create policy solicitacoes_acesso_update_admin
        on public.solicitacoes_acesso
        for update
        to authenticated
        using (public.usuario_admin_usuarios_ativo())
        with check (
          public.usuario_admin_usuarios_ativo()
          and status in (
            'pendente',
            'aprovado',
            'provisionado',
            'rejeitado',
            'expirado',
            'erro_envio_convite'
          )
        );
    end if;
  end if;

  if to_regclass('public.aceites_legais') is not null
    and to_regprocedure('public.usuario_admin_usuarios_ativo()') is not null then
    drop policy if exists aceites_legais_select_admin_gestor on public.aceites_legais;
    drop policy if exists aceites_legais_select_admin on public.aceites_legais;
    create policy aceites_legais_select_admin
      on public.aceites_legais
      for select
      to authenticated
      using (public.usuario_admin_usuarios_ativo());
  end if;

  if to_regclass('public.perfis') is not null then
    drop policy if exists perfis_update_proprio_basico on public.perfis;
    create policy perfis_update_proprio_basico
      on public.perfis
      for update
      to authenticated
      using (id = auth.uid() and ativo = true)
      with check (
        id = auth.uid()
        and ativo = true
      );
  end if;
end $$;

do $$
begin
  if to_regclass('public.clientes') is not null
    and to_regclass('public.perfis') is not null
    and to_regprocedure('public.usuario_cliente_solicitante_ativo()') is not null then
    drop policy if exists clientes_select_cliente_solicitante_proprio on public.clientes;
    create policy clientes_select_cliente_solicitante_proprio
      on public.clientes
      for select
      to authenticated
      using (
        public.usuario_cliente_solicitante_ativo()
        and id in (
          select cliente_id
          from public.perfis
          where id = auth.uid()
            and ativo = true
            and cliente_id is not null
        )
      );
  end if;

  if to_regclass('public.lojas') is not null
    and to_regclass('public.perfis') is not null
    and to_regprocedure('public.usuario_cliente_solicitante_ativo()') is not null then
    drop policy if exists lojas_select_cliente_solicitante_proprio on public.lojas;
    create policy lojas_select_cliente_solicitante_proprio
      on public.lojas
      for select
      to authenticated
      using (
        public.usuario_cliente_solicitante_ativo()
        and id in (
          select loja_id
          from public.perfis
          where id = auth.uid()
            and ativo = true
            and loja_id is not null
        )
      );
  end if;

  if to_regclass('public.chamados') is not null
    and to_regprocedure('public.usuario_cliente_solicitante_ativo()') is not null then
    drop policy if exists chamados_select_cliente_solicitante_proprio on public.chamados;
    create policy chamados_select_cliente_solicitante_proprio
      on public.chamados
      for select
      to authenticated
      using (
        public.usuario_cliente_solicitante_ativo()
        and operador_id = auth.uid()
      );
  end if;
end $$;
