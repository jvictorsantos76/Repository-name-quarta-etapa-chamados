-- Cadastro mestre ERP operacional de clientes/parceiros.
-- Mantem compatibilidade com clientes/lojas/chamados durante a transicao.

create table if not exists public.parceiros (
  id uuid primary key default gen_random_uuid(),
  tipo_parceiro text not null default 'cliente',
  razao_social text not null,
  nome_fantasia text not null,
  codigo_interno text null,
  cnpj_cpf text null,
  inscricao_estadual text null,
  inscricao_municipal text null,
  crt text null,
  situacao text not null default 'ativo',
  cliente_desde date null,
  segmento text null,
  cnae text null,
  suframa text null,
  website text null,
  ativo boolean not null default true,
  cliente_legado_id uuid null references public.clientes(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_tipo_parceiro_check check (
    tipo_parceiro in ('cliente', 'fornecedor', 'fabricante', 'terceirizado', 'transportadora')
  ),
  constraint parceiros_situacao_check check (
    situacao in ('ativo', 'inativo', 'prospect', 'bloqueado')
  ),
  constraint parceiros_razao_social_nao_vazia_check check (btrim(razao_social) <> ''),
  constraint parceiros_nome_fantasia_nao_vazio_check check (btrim(nome_fantasia) <> ''),
  constraint parceiros_website_check check (
    website is null or website ~* '^https?://'
  )
);

create table if not exists public.parceiros_enderecos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  tipo_endereco text not null default 'principal',
  principal boolean not null default false,
  cep text null,
  endereco text null,
  numero text null,
  complemento text null,
  bairro text null,
  cidade text null,
  estado text null,
  pais text not null default 'Brasil',
  latitude numeric(10, 7) null,
  longitude numeric(10, 7) null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_enderecos_tipo_check check (
    tipo_endereco in ('principal', 'cobranca', 'entrega', 'operacional', 'outro')
  )
);

create table if not exists public.parceiros_contatos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  nome text not null,
  cargo text null,
  telefone text null,
  celular text null,
  whatsapp text null,
  email text null,
  departamento text null,
  principal boolean not null default false,
  contato_financeiro boolean not null default false,
  contato_tecnico boolean not null default false,
  contato_operacional boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_contatos_nome_nao_vazio_check check (btrim(nome) <> ''),
  constraint parceiros_contatos_email_check check (
    email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

create table if not exists public.parceiros_filiais (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  loja_legado_id uuid null references public.lojas(id),
  nome_filial text not null,
  codigo_interno text null,
  cep text null,
  endereco text null,
  numero text null,
  complemento text null,
  bairro text null,
  cidade text null,
  estado text null,
  pais text not null default 'Brasil',
  latitude numeric(10, 7) null,
  longitude numeric(10, 7) null,
  contato_nome text null,
  contato_telefone text null,
  contato_email text null,
  sla_padrao text null,
  horario_atendimento text null,
  observacoes_operacionais text null,
  status text not null default 'ativa',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_filiais_nome_nao_vazio_check check (btrim(nome_filial) <> ''),
  constraint parceiros_filiais_status_check check (
    status in ('ativa', 'inativa', 'bloqueada', 'implantacao')
  )
);

create table if not exists public.parceiros_financeiro (
  parceiro_id uuid primary key references public.parceiros(id),
  condicao_pagamento text null,
  limite_credito numeric(14, 2) null,
  categoria_financeira text null,
  centro_custo text null,
  vendedor text null,
  comissao numeric(7, 4) null,
  forma_pagamento_padrao text null,
  responsavel_financeiro text null,
  email_nf text null,
  dia_faturamento integer null,
  retencao text null,
  natureza_operacao text null,
  observacoes_financeiras text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_financeiro_dia_faturamento_check check (
    dia_faturamento is null or dia_faturamento between 1 and 31
  ),
  constraint parceiros_financeiro_email_nf_check check (
    email_nf is null or email_nf ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

create table if not exists public.parceiros_operacional (
  parceiro_id uuid primary key references public.parceiros(id),
  sla_padrao text null,
  atendimento_remoto boolean not null default true,
  atendimento_presencial boolean not null default true,
  cobranca_km boolean not null default false,
  valor_km numeric(12, 2) null,
  horario_atendimento text null,
  cobertura text null,
  criticidade text null,
  necessita_agendamento boolean not null default false,
  necessita_autorizacao boolean not null default false,
  exige_cracha boolean not null default false,
  exige_foto boolean not null default false,
  restricao_horario text null,
  contato_escalonamento text null,
  grupo_tecnico_padrao text null,
  observacoes_operacionais text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id)
);

create table if not exists public.parceiros_contratos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  contrato text not null,
  vigencia_inicio date null,
  vigencia_fim date null,
  sla text null,
  status text not null default 'ativo',
  observacoes text null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  atualizado_por uuid null references auth.users(id),
  constraint parceiros_contratos_nome_nao_vazio_check check (btrim(contrato) <> ''),
  constraint parceiros_contratos_status_check check (
    status in ('ativo', 'inativo', 'encerrado', 'em_negociacao')
  )
);

create table if not exists public.parceiros_anexos (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  nome_original text not null,
  path_storage text not null,
  mime_type text null,
  tamanho_bytes bigint null,
  usuario_id uuid not null references public.perfis(id),
  observacao text null,
  created_at timestamptz not null default now(),
  constraint parceiros_anexos_nome_original_nao_vazio_check check (btrim(nome_original) <> ''),
  constraint parceiros_anexos_path_check check (path_storage ~ '^parceiros/[0-9a-fA-F-]{36}/')
);

create table if not exists public.parceiros_historico (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros(id),
  parceiro_filial_id uuid null references public.parceiros_filiais(id),
  usuario_id uuid null references public.perfis(id),
  tipo_evento text not null,
  descricao text not null,
  dados jsonb null,
  created_at timestamptz not null default now(),
  constraint parceiros_historico_tipo_evento_nao_vazio_check check (btrim(tipo_evento) <> ''),
  constraint parceiros_historico_descricao_nao_vazia_check check (btrim(descricao) <> '')
);

alter table if exists public.chamados
  add column if not exists parceiro_id uuid null references public.parceiros(id),
  add column if not exists parceiro_filial_id uuid null references public.parceiros_filiais(id);

create unique index if not exists parceiros_cliente_legado_id_unique_idx
  on public.parceiros (cliente_legado_id)
  where cliente_legado_id is not null;

create unique index if not exists parceiros_filiais_loja_legado_id_unique_idx
  on public.parceiros_filiais (loja_legado_id)
  where loja_legado_id is not null;

create unique index if not exists parceiros_codigo_interno_unique_idx
  on public.parceiros (lower(btrim(codigo_interno)))
  where codigo_interno is not null and btrim(codigo_interno) <> '';

create unique index if not exists parceiros_cnpj_cpf_unique_idx
  on public.parceiros (regexp_replace(cnpj_cpf, '[^0-9]', '', 'g'))
  where cnpj_cpf is not null and btrim(cnpj_cpf) <> '';

create unique index if not exists parceiros_filiais_codigo_unique_idx
  on public.parceiros_filiais (parceiro_id, lower(btrim(codigo_interno)))
  where codigo_interno is not null and btrim(codigo_interno) <> '';

create index if not exists parceiros_tipo_parceiro_idx on public.parceiros (tipo_parceiro);
create index if not exists parceiros_ativo_idx on public.parceiros (ativo);
create index if not exists parceiros_situacao_idx on public.parceiros (situacao);
create index if not exists parceiros_created_at_idx on public.parceiros (criado_em);
create index if not exists parceiros_enderecos_parceiro_id_idx on public.parceiros_enderecos (parceiro_id);
create index if not exists parceiros_enderecos_ativo_idx on public.parceiros_enderecos (ativo);
create index if not exists parceiros_contatos_parceiro_id_idx on public.parceiros_contatos (parceiro_id);
create index if not exists parceiros_contatos_ativo_idx on public.parceiros_contatos (ativo);
create index if not exists parceiros_filiais_parceiro_id_idx on public.parceiros_filiais (parceiro_id);
create index if not exists parceiros_filiais_ativo_idx on public.parceiros_filiais (ativo);
create index if not exists parceiros_financeiro_parceiro_id_idx on public.parceiros_financeiro (parceiro_id);
create index if not exists parceiros_operacional_parceiro_id_idx on public.parceiros_operacional (parceiro_id);
create index if not exists parceiros_contratos_parceiro_id_idx on public.parceiros_contratos (parceiro_id);
create index if not exists parceiros_contratos_status_idx on public.parceiros_contratos (status);
create index if not exists parceiros_anexos_parceiro_id_idx on public.parceiros_anexos (parceiro_id);
create index if not exists parceiros_anexos_usuario_id_idx on public.parceiros_anexos (usuario_id);
create index if not exists parceiros_anexos_created_at_idx on public.parceiros_anexos (created_at);
create index if not exists parceiros_historico_parceiro_id_idx on public.parceiros_historico (parceiro_id);
create index if not exists parceiros_historico_parceiro_filial_id_idx on public.parceiros_historico (parceiro_filial_id);
create index if not exists parceiros_historico_usuario_id_idx on public.parceiros_historico (usuario_id);
create index if not exists parceiros_historico_created_at_idx on public.parceiros_historico (created_at);
create index if not exists chamados_parceiro_id_idx on public.chamados (parceiro_id);
create index if not exists chamados_parceiro_filial_id_idx on public.chamados (parceiro_filial_id);

drop trigger if exists trg_parceiros_updated_at on public.parceiros;
create trigger trg_parceiros_updated_at
  before update on public.parceiros
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_enderecos_updated_at on public.parceiros_enderecos;
create trigger trg_parceiros_enderecos_updated_at
  before update on public.parceiros_enderecos
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_contatos_updated_at on public.parceiros_contatos;
create trigger trg_parceiros_contatos_updated_at
  before update on public.parceiros_contatos
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_filiais_updated_at on public.parceiros_filiais;
create trigger trg_parceiros_filiais_updated_at
  before update on public.parceiros_filiais
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_financeiro_updated_at on public.parceiros_financeiro;
create trigger trg_parceiros_financeiro_updated_at
  before update on public.parceiros_financeiro
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_operacional_updated_at on public.parceiros_operacional;
create trigger trg_parceiros_operacional_updated_at
  before update on public.parceiros_operacional
  for each row execute function public.atualizar_atualizado_em();

drop trigger if exists trg_parceiros_contratos_updated_at on public.parceiros_contratos;
create trigger trg_parceiros_contratos_updated_at
  before update on public.parceiros_contratos
  for each row execute function public.atualizar_atualizado_em();

insert into public.parceiros (
  tipo_parceiro,
  razao_social,
  nome_fantasia,
  cnpj_cpf,
  situacao,
  ativo,
  cliente_legado_id,
  criado_em,
  atualizado_em
)
select
  'cliente',
  coalesce(nullif(btrim(c.razao_social), ''), c.nome_fantasia),
  c.nome_fantasia,
  c.cnpj,
  case when c.ativo then 'ativo' else 'inativo' end,
  c.ativo,
  c.id,
  coalesce(c.created_at, now()),
  coalesce(c.updated_at, now())
from public.clientes c
where not exists (
  select 1
    from public.parceiros p
   where p.cliente_legado_id = c.id
);

insert into public.parceiros_contatos (
  parceiro_id,
  nome,
  telefone,
  email,
  principal,
  contato_operacional,
  ativo
)
select
  p.id,
  p.nome_fantasia,
  c.telefone,
  c.email_contato,
  true,
  true,
  c.ativo
from public.clientes c
join public.parceiros p on p.cliente_legado_id = c.id
where (c.email_contato is not null or c.telefone is not null)
  and not exists (
    select 1
      from public.parceiros_contatos pc
     where pc.parceiro_id = p.id
       and pc.principal = true
  );

insert into public.parceiros_filiais (
  parceiro_id,
  loja_legado_id,
  nome_filial,
  codigo_interno,
  endereco,
  cidade,
  estado,
  contato_nome,
  contato_telefone,
  status,
  ativo,
  criado_em,
  atualizado_em
)
select
  p.id,
  l.id,
  l.nome_loja,
  l.codigo_interno,
  l.endereco,
  l.cidade,
  l.estado,
  l.contato_local,
  l.telefone,
  case when l.ativo then 'ativa' else 'inativa' end,
  l.ativo,
  coalesce(l.created_at, now()),
  coalesce(l.updated_at, now())
from public.lojas l
join public.parceiros p on p.cliente_legado_id = l.cliente_id
where not exists (
  select 1
    from public.parceiros_filiais pf
   where pf.loja_legado_id = l.id
);

insert into public.parceiros_historico (
  parceiro_id,
  parceiro_filial_id,
  tipo_evento,
  descricao,
  dados,
  created_at
)
select
  p.id,
  null,
  'backfill_cliente_legado',
  'Parceiro criado a partir do cadastro legado de clientes.',
  jsonb_build_object('cliente_legado_id', p.cliente_legado_id),
  p.criado_em
from public.parceiros p
where p.cliente_legado_id is not null
  and not exists (
    select 1
      from public.parceiros_historico ph
     where ph.parceiro_id = p.id
       and ph.tipo_evento = 'backfill_cliente_legado'
  );

update public.chamados c
   set parceiro_id = p.id
  from public.parceiros p
 where c.parceiro_id is null
   and p.cliente_legado_id = c.cliente_id;

update public.chamados c
   set parceiro_filial_id = pf.id
  from public.parceiros_filiais pf
 where c.parceiro_filial_id is null
   and pf.loja_legado_id = c.loja_id;

insert into storage.buckets (id, name, public)
values ('parceiros-anexos', 'parceiros-anexos', false)
on conflict (id) do update
   set public = false;

alter table public.parceiros enable row level security;
alter table public.parceiros_enderecos enable row level security;
alter table public.parceiros_contatos enable row level security;
alter table public.parceiros_filiais enable row level security;
alter table public.parceiros_financeiro enable row level security;
alter table public.parceiros_operacional enable row level security;
alter table public.parceiros_contratos enable row level security;
alter table public.parceiros_anexos enable row level security;
alter table public.parceiros_historico enable row level security;

grant select, insert, update on table public.parceiros to authenticated;
grant select, insert, update on table public.parceiros_enderecos to authenticated;
grant select, insert, update on table public.parceiros_contatos to authenticated;
grant select, insert, update on table public.parceiros_filiais to authenticated;
grant select, insert, update on table public.parceiros_financeiro to authenticated;
grant select, insert, update on table public.parceiros_operacional to authenticated;
grant select, insert, update on table public.parceiros_contratos to authenticated;
grant select, insert on table public.parceiros_anexos to authenticated;
grant select, insert on table public.parceiros_historico to authenticated;
grant references on table public.parceiros to authenticated;
grant references on table public.parceiros_filiais to authenticated;

grant select, insert, update, delete on table public.parceiros to service_role;
grant select, insert, update, delete on table public.parceiros_enderecos to service_role;
grant select, insert, update, delete on table public.parceiros_contatos to service_role;
grant select, insert, update, delete on table public.parceiros_filiais to service_role;
grant select, insert, update, delete on table public.parceiros_financeiro to service_role;
grant select, insert, update, delete on table public.parceiros_operacional to service_role;
grant select, insert, update, delete on table public.parceiros_contratos to service_role;
grant select, insert, update, delete on table public.parceiros_anexos to service_role;
grant select, insert, update, delete on table public.parceiros_historico to service_role;

revoke all on table public.parceiros from anon;
revoke all on table public.parceiros_enderecos from anon;
revoke all on table public.parceiros_contatos from anon;
revoke all on table public.parceiros_filiais from anon;
revoke all on table public.parceiros_financeiro from anon;
revoke all on table public.parceiros_operacional from anon;
revoke all on table public.parceiros_contratos from anon;
revoke all on table public.parceiros_anexos from anon;
revoke all on table public.parceiros_historico from anon;

revoke delete on table public.parceiros from authenticated;
revoke delete on table public.parceiros_enderecos from authenticated;
revoke delete on table public.parceiros_contatos from authenticated;
revoke delete on table public.parceiros_filiais from authenticated;
revoke delete on table public.parceiros_financeiro from authenticated;
revoke delete on table public.parceiros_operacional from authenticated;
revoke delete on table public.parceiros_contratos from authenticated;
revoke delete on table public.parceiros_anexos from authenticated;
revoke delete on table public.parceiros_historico from authenticated;

drop policy if exists parceiros_select_acesso on public.parceiros;
create policy parceiros_select_acesso
  on public.parceiros
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and public.usuario_acesso_chamados_ativo())
  );

drop policy if exists parceiros_insert_catalogo on public.parceiros;
create policy parceiros_insert_catalogo
  on public.parceiros
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and criado_por = auth.uid()
  );

drop policy if exists parceiros_update_catalogo on public.parceiros;
create policy parceiros_update_catalogo
  on public.parceiros
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_enderecos_select_acesso on public.parceiros_enderecos;
create policy parceiros_enderecos_select_acesso
  on public.parceiros_enderecos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.parceiros p
      where p.id = parceiro_id
        and (
          public.usuario_catalogo_chamados_ativo()
          or (p.ativo = true and public.usuario_acesso_chamados_ativo())
        )
    )
  );

drop policy if exists parceiros_enderecos_insert_catalogo on public.parceiros_enderecos;
create policy parceiros_enderecos_insert_catalogo
  on public.parceiros_enderecos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_enderecos_update_catalogo on public.parceiros_enderecos;
create policy parceiros_enderecos_update_catalogo
  on public.parceiros_enderecos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_contatos_select_acesso on public.parceiros_contatos;
create policy parceiros_contatos_select_acesso
  on public.parceiros_contatos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.parceiros p
      where p.id = parceiro_id
        and (
          public.usuario_catalogo_chamados_ativo()
          or (p.ativo = true and public.usuario_acesso_chamados_ativo())
        )
    )
  );

drop policy if exists parceiros_contatos_insert_catalogo on public.parceiros_contatos;
create policy parceiros_contatos_insert_catalogo
  on public.parceiros_contatos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_contatos_update_catalogo on public.parceiros_contatos;
create policy parceiros_contatos_update_catalogo
  on public.parceiros_contatos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_filiais_select_acesso on public.parceiros_filiais;
create policy parceiros_filiais_select_acesso
  on public.parceiros_filiais
  for select
  to authenticated
  using (
    exists (
      select 1 from public.parceiros p
      where p.id = parceiro_id
        and (
          public.usuario_catalogo_chamados_ativo()
          or (p.ativo = true and public.usuario_acesso_chamados_ativo())
        )
    )
  );

drop policy if exists parceiros_filiais_insert_catalogo on public.parceiros_filiais;
create policy parceiros_filiais_insert_catalogo
  on public.parceiros_filiais
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_filiais_update_catalogo on public.parceiros_filiais;
create policy parceiros_filiais_update_catalogo
  on public.parceiros_filiais
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_financeiro_select_catalogo on public.parceiros_financeiro;
create policy parceiros_financeiro_select_catalogo
  on public.parceiros_financeiro
  for select
  to authenticated
  using (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_financeiro_insert_catalogo on public.parceiros_financeiro;
create policy parceiros_financeiro_insert_catalogo
  on public.parceiros_financeiro
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_financeiro_update_catalogo on public.parceiros_financeiro;
create policy parceiros_financeiro_update_catalogo
  on public.parceiros_financeiro
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_operacional_select_acesso on public.parceiros_operacional;
create policy parceiros_operacional_select_acesso
  on public.parceiros_operacional
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or public.usuario_acesso_chamados_ativo()
  );

drop policy if exists parceiros_operacional_insert_catalogo on public.parceiros_operacional;
create policy parceiros_operacional_insert_catalogo
  on public.parceiros_operacional
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_operacional_update_catalogo on public.parceiros_operacional;
create policy parceiros_operacional_update_catalogo
  on public.parceiros_operacional
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_contratos_select_acesso on public.parceiros_contratos;
create policy parceiros_contratos_select_acesso
  on public.parceiros_contratos
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or public.usuario_acesso_chamados_ativo()
  );

drop policy if exists parceiros_contratos_insert_catalogo on public.parceiros_contratos;
create policy parceiros_contratos_insert_catalogo
  on public.parceiros_contratos
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists parceiros_contratos_update_catalogo on public.parceiros_contratos;
create policy parceiros_contratos_update_catalogo
  on public.parceiros_contratos
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists parceiros_anexos_select_acesso on public.parceiros_anexos;
create policy parceiros_anexos_select_acesso
  on public.parceiros_anexos
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or public.usuario_acesso_chamados_ativo()
  );

drop policy if exists parceiros_anexos_insert_catalogo on public.parceiros_anexos;
create policy parceiros_anexos_insert_catalogo
  on public.parceiros_anexos
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and usuario_id = auth.uid()
  );

drop policy if exists parceiros_historico_select_acesso on public.parceiros_historico;
create policy parceiros_historico_select_acesso
  on public.parceiros_historico
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or public.usuario_acesso_chamados_ativo()
  );

drop policy if exists parceiros_historico_insert_catalogo on public.parceiros_historico;
create policy parceiros_historico_insert_catalogo
  on public.parceiros_historico
  for insert
  to authenticated
  with check (
    public.usuario_catalogo_chamados_ativo()
    and (usuario_id is null or usuario_id = auth.uid())
  );

drop policy if exists parceiros_storage_select on storage.objects;
create policy parceiros_storage_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'parceiros-anexos'
    and name like 'parceiros/%'
    and (
      public.usuario_catalogo_chamados_ativo()
      or public.usuario_acesso_chamados_ativo()
    )
  );

drop policy if exists parceiros_storage_insert on storage.objects;
create policy parceiros_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'parceiros-anexos'
    and name like 'parceiros/%'
    and public.usuario_catalogo_chamados_ativo()
  );

drop policy if exists parceiros_storage_update on storage.objects;
create policy parceiros_storage_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'parceiros-anexos'
    and name like 'parceiros/%'
    and public.usuario_catalogo_chamados_ativo()
  )
  with check (
    bucket_id = 'parceiros-anexos'
    and name like 'parceiros/%'
    and public.usuario_catalogo_chamados_ativo()
  );
