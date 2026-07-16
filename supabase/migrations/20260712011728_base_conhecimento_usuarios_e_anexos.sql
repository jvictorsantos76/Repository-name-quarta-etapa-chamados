create table if not exists public.base_conhecimento_usuarios (
  artigo_id uuid not null references public.bases_conhecimento(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  criado_por uuid null references auth.users(id),
  primary key (artigo_id, usuario_id)
);

create index if not exists base_conhecimento_usuarios_usuario_idx
  on public.base_conhecimento_usuarios (usuario_id)
  where ativo = true;

alter table public.base_conhecimento_usuarios enable row level security;

grant select, insert, update on table public.base_conhecimento_usuarios to authenticated;
revoke delete on table public.base_conhecimento_usuarios from anon, authenticated;

drop policy if exists base_conhecimento_usuarios_select_operacionais
  on public.base_conhecimento_usuarios;
create policy base_conhecimento_usuarios_select_operacionais
  on public.base_conhecimento_usuarios
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (ativo = true and usuario_id = auth.uid())
  );

drop policy if exists base_conhecimento_usuarios_insert_catalogo
  on public.base_conhecimento_usuarios;
create policy base_conhecimento_usuarios_insert_catalogo
  on public.base_conhecimento_usuarios
  for insert
  to authenticated
  with check (public.usuario_catalogo_chamados_ativo() and criado_por = auth.uid());

drop policy if exists base_conhecimento_usuarios_update_catalogo
  on public.base_conhecimento_usuarios;
create policy base_conhecimento_usuarios_update_catalogo
  on public.base_conhecimento_usuarios
  for update
  to authenticated
  using (public.usuario_catalogo_chamados_ativo())
  with check (public.usuario_catalogo_chamados_ativo());

drop policy if exists bases_conhecimento_select_operacional_editorial
  on public.bases_conhecimento;
create policy bases_conhecimento_select_operacional_editorial
  on public.bases_conhecimento
  for select
  to authenticated
  using (
    public.usuario_catalogo_chamados_ativo()
    or (
      ativo = true
      and exists (
        select 1
          from public.base_conhecimento_status s
         where s.codigo = bases_conhecimento.status
           and s.ativo = true
           and s.publica_artigo = true
      )
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
      and (
        confidencialidade in ('publica', 'interno_restrito')
        or (
          confidencialidade = 'tecnico'
          and (
            not exists (
              select 1
                from public.base_conhecimento_usuarios u
               where u.artigo_id = bases_conhecimento.id
                 and u.ativo = true
            )
            or exists (
              select 1
                from public.base_conhecimento_usuarios u
               where u.artigo_id = bases_conhecimento.id
                 and u.usuario_id = auth.uid()
                 and u.ativo = true
            )
          )
        )
      )
    )
  );
