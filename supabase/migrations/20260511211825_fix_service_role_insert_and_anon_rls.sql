do $$
begin
  -- Grant INSERT to service_role for solicitacoes_acesso (was missing)
  grant insert on table public.solicitacoes_acesso to service_role;

  -- Grant INSERT to service_role for aceites_legais (was missing)
  grant insert on table public.aceites_legais to service_role;

  -- Update anon RLS policy to allow pendente_confirmacao_email status
  drop policy if exists solicitacoes_acesso_insert_publico on public.solicitacoes_acesso;

  create policy solicitacoes_acesso_insert_publico
    on public.solicitacoes_acesso
    for insert
    to anon
    with check (
      status in ('pendente_aprovacao', 'pendente_confirmacao_email')
      and aceite_termos = true
      and aceite_privacidade = true
      and nome_completo <> ''
      and email <> ''
      and empresa <> ''
    );
end $$;
