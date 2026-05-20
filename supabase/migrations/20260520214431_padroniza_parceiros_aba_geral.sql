alter table public.parceiros
  add column if not exists tipo_pessoa text null;

alter table public.parceiros_contatos
  add column if not exists tipo_contato text null;

update public.parceiros
   set tipo_pessoa = case
     when length(regexp_replace(coalesce(cnpj_cpf, ''), '[^0-9]', '', 'g')) = 11 then 'fisica'
     else 'juridica'
   end
 where tipo_pessoa is null;

alter table public.parceiros
  drop constraint if exists parceiros_tipo_pessoa_check;

alter table public.parceiros
  add constraint parceiros_tipo_pessoa_check check (
    tipo_pessoa is null or tipo_pessoa in ('juridica', 'fisica')
  );

alter table public.parceiros
  drop constraint if exists parceiros_tipo_parceiro_check;

alter table public.parceiros
  add constraint parceiros_tipo_parceiro_check check (
    tipo_parceiro in (
      'cliente',
      'fornecedor',
      'fabricante',
      'terceirizado',
      'transportadora',
      'parceiro',
      'prestador',
      'interno',
      'prospect'
    )
  );

alter table public.parceiros
  drop constraint if exists parceiros_situacao_check;

alter table public.parceiros
  add constraint parceiros_situacao_check check (
    situacao in (
      'ativo',
      'implantacao',
      'prospect',
      'suspenso',
      'bloqueado',
      'encerrado',
      'inativo'
    )
  );

alter table public.parceiros_contatos
  drop constraint if exists parceiros_contatos_tipo_contato_check;

alter table public.parceiros_contatos
  add constraint parceiros_contatos_tipo_contato_check check (
    tipo_contato is null or tipo_contato in (
      'comercial',
      'financeiro',
      'tecnico',
      'operacional',
      'administrativo',
      'compras',
      'diretoria',
      'fiscal',
      'contratos',
      'sla'
    )
  );
