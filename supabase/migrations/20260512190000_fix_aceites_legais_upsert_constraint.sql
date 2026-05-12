do $$
begin
  if to_regclass('public.aceites_legais') is not null then
    begin
      alter table public.aceites_legais
        add constraint aceites_legais_solicitacao_documento_key
        unique (solicitacao_acesso_id, tipo_documento);
    exception
      when duplicate_object then
        null;
    end;
  end if;
end $$;
