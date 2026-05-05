do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'papel_usuario'
  ) then
    alter type public.papel_usuario
    add value if not exists 'super_admin';

    alter type public.papel_usuario
    add value if not exists 'cliente';

    alter type public.papel_usuario
    add value if not exists 'solicitante';
  end if;
end $$;
