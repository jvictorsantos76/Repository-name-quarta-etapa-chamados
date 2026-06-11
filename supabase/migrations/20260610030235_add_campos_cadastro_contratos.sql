alter table public.parceiros_contratos
  add column if not exists descricao_contrato text null,
  add column if not exists valor numeric(14,2) null,
  add column if not exists data_base date null,
  add column if not exists vencimento text null,
  add column if not exists dia_vencimento integer null,
  add column if not exists periodicidade text null,
  add column if not exists valor_total_previsto numeric(14,2) null,
  add column if not exists gerar_nota_fiscal boolean not null default false,
  add column if not exists data_contrato date null,
  add column if not exists impressao_periodo_cobranca text null,
  add column if not exists cobrar_outro_contato boolean not null default false;

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_valor_nao_negativo_check,
  add constraint parceiros_contratos_valor_nao_negativo_check
    check (valor is null or valor >= 0);

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_valor_total_previsto_nao_negativo_check,
  add constraint parceiros_contratos_valor_total_previsto_nao_negativo_check
    check (valor_total_previsto is null or valor_total_previsto >= 0);

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_dia_vencimento_check,
  add constraint parceiros_contratos_dia_vencimento_check
    check (dia_vencimento is null or dia_vencimento between 1 and 31);

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_vencimento_check,
  add constraint parceiros_contratos_vencimento_check
    check (
      vencimento is null or
      vencimento in ('mes_corrente', 'mes_subsequente', 'dia_fixo', 'apos_emissao')
    );

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_periodicidade_check,
  add constraint parceiros_contratos_periodicidade_check
    check (
      periodicidade is null or
      periodicidade in ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'unico')
    );

alter table public.parceiros_contratos
  drop constraint if exists parceiros_contratos_impressao_periodo_cobranca_check,
  add constraint parceiros_contratos_impressao_periodo_cobranca_check
    check (
      impressao_periodo_cobranca is null or
      impressao_periodo_cobranca in ('nao_imprime', 'competencia', 'vencimento')
    );
