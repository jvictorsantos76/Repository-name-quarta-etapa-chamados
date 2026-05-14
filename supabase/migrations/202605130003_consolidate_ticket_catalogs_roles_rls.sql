update public.perfis
   set papel = case papel::text
     when 'gestor' then 'admin'::public.papel_usuario
     when 'operador' then 'tecnico_quarta'::public.papel_usuario
     when 'tecnico' then 'tecnico_quarta'::public.papel_usuario
     when 'solicitante' then 'cliente'::public.papel_usuario
     else papel
   end
 where papel::text in ('gestor', 'operador', 'tecnico', 'solicitante');

create table if not exists public.chamado_status (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nome text not null,
  descricao text null,
  cor text null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  eh_padrao boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id)
);

create unique index if not exists chamado_status_codigo_lower_key
  on public.chamado_status (lower(codigo));

create unique index if not exists chamado_status_nome_lower_key
  on public.chamado_status (lower(nome));

create unique index if not exists chamado_status_padrao_ativo_key
  on public.chamado_status (eh_padrao)
  where eh_padrao = true and ativo = true;

alter table if exists public.chamado_tipos
  add column if not exists ordem integer not null default 0,
  add column if not exists atualizado_por uuid null references auth.users(id);

alter table if exists public.chamado_origens
  add column if not exists ordem integer not null default 0,
  add column if not exists atualizado_por uuid null references auth.users(id);

alter table if exists public.grupos_atendimento
  add column if not exists ordem integer not null default 0,
  add column if not exists atualizado_por uuid null references auth.users(id);

alter table if exists public.bases_conhecimento
  add column if not exists conteudo text null,
  add column if not exists ordem integer not null default 0,
  add column if not exists atualizado_por uuid null references auth.users(id);

drop trigger if exists trg_chamado_status_updated_at on public.chamado_status;
create trigger trg_chamado_status_updated_at
  before update on public.chamado_status
  for each row execute function public.atualizar_atualizado_em();

insert into public.chamado_status (codigo, nome, descricao, cor, ordem, ativo, eh_padrao)
values
  ('pendente_agendamento', 'Pendente de agendamento', 'Chamado aguardando definição de agenda.', '#2563eb', 10, true, true),
  ('orcamento', 'Orçamento', 'Chamado em análise de orçamento.', '#9333ea', 20, true, false),
  ('agendado', 'Agendado', 'Chamado com atendimento agendado.', '#ca8a04', 30, true, false),
  ('em_atendimento', 'Em atendimento', 'Chamado em execução técnica.', '#ea580c', 40, true, false),
  ('pendente_peca', 'Pendente peça', 'Chamado aguardando peça ou insumo.', '#dc2626', 50, true, false),
  ('resolvido', 'Resolvido', 'Chamado resolvido tecnicamente.', '#16a34a', 60, true, false),
  ('faturado', 'Faturado', 'Chamado finalizado para faturamento.', '#064e3b', 70, true, false)
on conflict (lower(codigo)) do update
   set nome = excluded.nome,
       descricao = excluded.descricao,
       cor = excluded.cor,
       ordem = excluded.ordem,
       ativo = excluded.ativo,
       eh_padrao = excluded.eh_padrao;

insert into public.chamado_tipos (nome)
values ('Incidente')
on conflict (lower(nome)) do nothing;

insert into public.chamado_origens (nome)
values ('CRM')
on conflict (lower(nome)) do nothing;

insert into public.grupos_atendimento (nome)
values ('Administrativo')
on conflict (lower(nome)) do nothing;

insert into public.bases_conhecimento (titulo)
values ('cpu defeito'), ('SERVER 2018')
on conflict (lower(titulo)) do nothing;

create or replace function public.usuario_admin_ou_gestor_ativo()
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
       and p.papel::text in ('super_admin', 'admin')
  );
$$;

create or replace function public.usuario_operacional_ativo()
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
       and p.papel::text in (
         'super_admin',
         'admin',
         'comercial',
         'analista',
         'tecnico_quarta',
         'tecnico_terceirizado'
       )
  );
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
       and p.papel::text in ('cliente', 'parceiro')
       and p.loja_id is not null
  );
$$;

create or replace function public.usuario_catalogo_chamados_ativo()
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
       and p.papel::text in ('super_admin', 'admin', 'analista')
  );
$$;

create or replace function public.usuario_acesso_chamados_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_operacional_ativo()
      or public.usuario_cliente_solicitante_ativo();
$$;

revoke execute on function public.usuario_admin_ou_gestor_ativo() from public, anon;
revoke execute on function public.usuario_operacional_ativo() from public, anon;
revoke execute on function public.usuario_cliente_solicitante_ativo() from public, anon;
revoke execute on function public.usuario_catalogo_chamados_ativo() from public, anon;
revoke execute on function public.usuario_acesso_chamados_ativo() from public, anon;

grant execute on function public.usuario_admin_ou_gestor_ativo() to authenticated;
grant execute on function public.usuario_operacional_ativo() to authenticated;
grant execute on function public.usuario_cliente_solicitante_ativo() to authenticated;
grant execute on function public.usuario_catalogo_chamados_ativo() to authenticated;
grant execute on function public.usuario_acesso_chamados_ativo() to authenticated;

alter table public.chamado_status enable row level security;
alter table public.chamado_tipos enable row level security;
alter table public.chamado_origens enable row level security;
alter table public.grupos_atendimento enable row level security;
alter table public.bases_conhecimento enable row level security;
alter table public.chamados_bases_conhecimento enable row level security;

grant select, insert, update on table public.chamado_status to authenticated;
grant references on table public.chamado_status to authenticated;
grant select, insert, update on table public.chamado_tipos to authenticated;
grant select, insert, update on table public.chamado_origens to authenticated;
grant select, insert, update on table public.grupos_atendimento to authenticated;
grant select, insert, update on table public.bases_conhecimento to authenticated;
grant select, insert on table public.chamados_bases_conhecimento to authenticated;

revoke delete on table public.chamado_status from anon, authenticated;
revoke delete on table public.chamado_tipos from anon, authenticated;
revoke delete on table public.chamado_origens from anon, authenticated;
revoke delete on table public.grupos_atendimento from anon, authenticated;
revoke delete on table public.bases_conhecimento from anon, authenticated;
revoke delete on table public.chamados_bases_conhecimento from anon, authenticated;

drop policy if exists chamado_status_select_ativos on public.chamado_status;
create policy chamado_status_select_ativos
  on public.chamado_status
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists chamado_status_insert_catalogo on public.chamado_status;
create policy chamado_status_insert_catalogo
  on public.chamado_status
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists chamado_status_update_catalogo on public.chamado_status;
create policy chamado_status_update_catalogo
  on public.chamado_status
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists chamado_tipos_select_ativos on public.chamado_tipos;
create policy chamado_tipos_select_ativos
  on public.chamado_tipos
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists chamado_origens_select_ativos on public.chamado_origens;
create policy chamado_origens_select_ativos
  on public.chamado_origens
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists grupos_atendimento_select_ativos on public.grupos_atendimento;
create policy grupos_atendimento_select_ativos
  on public.grupos_atendimento
  for select
  to authenticated
  using (ativo = true and public.usuario_acesso_chamados_ativo());

drop policy if exists bases_conhecimento_select_ativos on public.bases_conhecimento;
create policy bases_conhecimento_select_ativos
  on public.bases_conhecimento
  for select
  to authenticated
  using (
    ativo = true
    and exists (
      select 1
        from public.perfis p
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in (
           'super_admin',
           'admin',
           'analista',
           'tecnico_quarta',
           'tecnico_terceirizado'
         )
    )
  );

drop policy if exists chamado_tipos_insert_catalogo on public.chamado_tipos;
create policy chamado_tipos_insert_catalogo
  on public.chamado_tipos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists chamado_origens_insert_catalogo on public.chamado_origens;
create policy chamado_origens_insert_catalogo
  on public.chamado_origens
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists grupos_atendimento_insert_catalogo on public.grupos_atendimento;
create policy grupos_atendimento_insert_catalogo
  on public.grupos_atendimento
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists bases_conhecimento_insert_catalogo on public.bases_conhecimento;
create policy bases_conhecimento_insert_catalogo
  on public.bases_conhecimento
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists chamado_tipos_update_catalogo on public.chamado_tipos;
create policy chamado_tipos_update_catalogo
  on public.chamado_tipos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists chamado_origens_update_catalogo on public.chamado_origens;
create policy chamado_origens_update_catalogo
  on public.chamado_origens
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists grupos_atendimento_update_catalogo on public.grupos_atendimento;
create policy grupos_atendimento_update_catalogo
  on public.grupos_atendimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists bases_conhecimento_update_catalogo on public.bases_conhecimento;
create policy bases_conhecimento_update_catalogo
  on public.bases_conhecimento
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists clientes_select_cliente_solicitante_proprio on public.clientes;
drop policy if exists clientes_select_por_acesso on public.clientes;
create policy clientes_select_por_acesso
  on public.clientes
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
        from public.perfis p
        join public.lojas l on l.id = p.loja_id
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in ('cliente', 'parceiro')
         and p.loja_id is not null
         and l.cliente_id = clientes.id
    )
  );

drop policy if exists lojas_select_cliente_solicitante_proprio on public.lojas;
drop policy if exists lojas_select_por_acesso on public.lojas;
create policy lojas_select_por_acesso
  on public.lojas
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
        from public.perfis p
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in ('cliente', 'parceiro')
         and p.loja_id is not null
         and p.loja_id = lojas.id
    )
  );

drop policy if exists chamados_select_cliente_solicitante_proprio on public.chamados;
drop policy if exists chamados_select_por_acesso on public.chamados;
create policy chamados_select_por_acesso
  on public.chamados
  for select
  to authenticated
  using (
    public.usuario_operacional_ativo()
    or exists (
      select 1
        from public.perfis p
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in ('cliente', 'parceiro')
         and p.loja_id is not null
         and p.loja_id = chamados.loja_id
    )
  );

drop policy if exists chamados_insert_operacionais on public.chamados;
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
         and l.cliente_id = chamados.organizacao_id
    )
  );

drop policy if exists chamados_bases_select_operacionais on public.chamados_bases_conhecimento;
create policy chamados_bases_select_operacionais
  on public.chamados_bases_conhecimento
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.chamados c
       where c.id = chamado_id
         and (
           public.usuario_operacional_ativo()
           or exists (
             select 1
               from public.perfis p
              where p.id = auth.uid()
                and p.ativo = true
                and p.papel::text in ('cliente', 'parceiro')
                and p.loja_id is not null
                and p.loja_id = c.loja_id
           )
         )
    )
  );

drop policy if exists chamados_bases_insert_operacionais on public.chamados_bases_conhecimento;
create policy chamados_bases_insert_operacionais
  on public.chamados_bases_conhecimento
  for insert
  to authenticated
  with check (
    exists (
      select 1
        from public.perfis p
       where p.id = auth.uid()
         and p.ativo = true
         and p.papel::text in (
           'super_admin',
           'admin',
           'analista',
           'tecnico_quarta',
           'tecnico_terceirizado'
         )
    )
    and exists (
      select 1
        from public.bases_conhecimento b
       where b.id = base_conhecimento_id
         and b.ativo = true
    )
    and exists (
      select 1
        from public.chamados c
       where c.id = chamado_id
    )
  );
