-- migration: add_parceiros_estacionamento_terceiros
-- purpose: estruturar estacionamento privativo e estacionamento de terceiros em public.parceiros
-- affected tables: public.parceiros
-- special considerations: migration defensiva, sem drop de coluna legada estacionamento e sem alteracao de rls/grants

alter table public.parceiros
  add column if not exists estacionamento_privativo boolean not null default false,
  add column if not exists estacionamento_terceiros boolean not null default false,
  add column if not exists estacionamento_terceiros_nome text null,
  add column if not exists estacionamento_terceiros_endereco text null,
  add column if not exists estacionamento_terceiros_valores text null;

alter table public.parceiros
  alter column estacionamento_privativo set default false,
  alter column estacionamento_terceiros set default false;

update public.parceiros
   set estacionamento_privativo = false
 where estacionamento_privativo is null;

update public.parceiros
   set estacionamento_terceiros = false
 where estacionamento_terceiros is null;

alter table public.parceiros
  alter column estacionamento_privativo set not null,
  alter column estacionamento_terceiros set not null;

update public.parceiros
   set estacionamento_privativo = true
 where estacionamento_privativo = false
   and nullif(btrim(coalesce(estacionamento, '')), '') is not null;
