-- migration: add_parceiros_informacoes_acesso_operacional
-- purpose: estruturar informacoes de acesso ao local em public.parceiros
-- affected tables: public.parceiros
-- special considerations: migration defensiva, sem drop de colunas legadas e sem alteracao de rls/grants

alter table public.parceiros
  add column if not exists responsavel_local_nome text null,
  add column if not exists responsavel_local_contato_id uuid null,
  add column if not exists responsavel_local_telefone text null,
  add column if not exists responsavel_local_whatsapp boolean not null default false,
  add column if not exists possui_portaria_recepcao boolean not null default false,
  add column if not exists possui_doca_carga_descarga boolean not null default false,
  add column if not exists identificacao_doca text null,
  add column if not exists documentos_entrada text[] null;

alter table public.parceiros
  alter column responsavel_local_whatsapp set default false,
  alter column possui_portaria_recepcao set default false,
  alter column possui_doca_carga_descarga set default false,
  alter column necessita_autorizacao_previa set default false;

update public.parceiros
   set responsavel_local_whatsapp = false
 where responsavel_local_whatsapp is null;

update public.parceiros
   set possui_portaria_recepcao = false
 where possui_portaria_recepcao is null;

update public.parceiros
   set possui_doca_carga_descarga = false
 where possui_doca_carga_descarga is null;

update public.parceiros
   set necessita_autorizacao_previa = false
 where necessita_autorizacao_previa is null;

alter table public.parceiros
  alter column responsavel_local_whatsapp set not null,
  alter column possui_portaria_recepcao set not null,
  alter column possui_doca_carga_descarga set not null;

update public.parceiros
   set responsavel_local_nome = responsavel_local
 where responsavel_local_nome is null
   and nullif(btrim(coalesce(responsavel_local, '')), '') is not null;

update public.parceiros
   set responsavel_local_telefone = telefone_responsavel_local
 where responsavel_local_telefone is null
   and nullif(btrim(coalesce(telefone_responsavel_local, '')), '') is not null;

update public.parceiros
   set documentos_entrada = array[documento_necessario_entrada]
 where documentos_entrada is null
   and nullif(btrim(coalesce(documento_necessario_entrada, '')), '') is not null;

update public.parceiros
   set possui_portaria_recepcao = true
 where possui_portaria_recepcao = false
   and nullif(btrim(coalesce(portaria_recepcao, '')), '') is not null;

update public.parceiros
   set possui_doca_carga_descarga = true,
       identificacao_doca = coalesce(identificacao_doca, nullif(btrim(doca_carga_descarga), ''))
 where possui_doca_carga_descarga = false
   and nullif(btrim(coalesce(doca_carga_descarga, '')), '') is not null;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'parceiros_responsavel_local_contato_id_fkey'
       and conrelid = 'public.parceiros'::regclass
  ) then
    alter table public.parceiros
      add constraint parceiros_responsavel_local_contato_id_fkey
      foreign key (responsavel_local_contato_id)
      references public.parceiros_contatos(id)
      on delete set null;
  end if;
end $$;
