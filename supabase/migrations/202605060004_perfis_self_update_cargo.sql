do $$
begin
  if to_regclass('public.perfis') is not null then
    grant select on table public.perfis to authenticated;
    grant update (
      telefone,
      avatar_url,
      biografia,
      cargo,
      tema_preferido,
      cor_preferida,
      fonte_escala
    ) on table public.perfis to authenticated;
  end if;
end $$;
