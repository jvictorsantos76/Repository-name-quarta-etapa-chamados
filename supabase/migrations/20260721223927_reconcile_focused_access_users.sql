do $$
declare
  quarta_etapa_cliente_id uuid;
  quarta_etapa_loja_id uuid;
begin
  select c.id
    into quarta_etapa_cliente_id
    from public.clientes c
   where c.ativo = true
     and c.nome_fantasia = 'Quarta Etapa Tecnologia para Negócios'
   order by c.created_at asc
   limit 1;

  if quarta_etapa_cliente_id is not null then
    select l.id
      into quarta_etapa_loja_id
      from public.lojas l
     where l.ativo = true
       and l.cliente_id = quarta_etapa_cliente_id
       and l.nome_loja = 'Matriz'
     order by l.created_at asc
     limit 1;
  end if;

  update public.perfis p
     set papel = case lower(p.email)
           when 'joaovictor@quartaetapa.com.br' then 'super_admin'::public.papel_usuario
           when 'sup02@quartaetapa.com.br' then 'admin'::public.papel_usuario
           when 'sup03@quartaetapa.com.br' then 'tecnico_quarta'::public.papel_usuario
           when 'joaovictordossantos@gmail.com' then 'cliente'::public.papel_usuario
           when 'quartaetapa@gmail.com' then 'cliente'::public.papel_usuario
           else p.papel
         end,
         ativo = true,
         cliente_id = case
           when lower(p.email) in (
             'joaovictordossantos@gmail.com',
             'quartaetapa@gmail.com'
           ) then quarta_etapa_cliente_id
           else null
         end,
         loja_id = case
           when lower(p.email) in (
             'joaovictordossantos@gmail.com',
             'quartaetapa@gmail.com'
           ) then quarta_etapa_loja_id
           else null
         end,
         updated_at = now()
   where lower(p.email) in (
     'joaovictor@quartaetapa.com.br',
     'sup02@quartaetapa.com.br',
     'sup03@quartaetapa.com.br',
     'joaovictordossantos@gmail.com',
     'quartaetapa@gmail.com'
   );
end $$;

revoke truncate on table public.perfis from anon, authenticated;
revoke truncate on table public.solicitacoes_acesso from anon, authenticated;
revoke truncate on table public.aceites_legais from anon, authenticated;
revoke truncate on table public.chamados from anon, authenticated;
revoke truncate on table public.clientes from anon, authenticated;
revoke truncate on table public.lojas from anon, authenticated;
revoke truncate on table public.historico_status from anon, authenticated;
revoke truncate on table public.registros_tecnicos from anon, authenticated;
revoke truncate on table public.evidencias_anexos from anon, authenticated;
