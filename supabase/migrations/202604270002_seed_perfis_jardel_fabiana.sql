insert into public.perfis (
  id,
  nome_completo,
  email,
  papel,
  ativo
)
values
  (
    'bdd89fd1-aac4-4f11-af7a-6defa4488c72',
    'Jardel Rodrigues',
    'sup02@quartaetapa.com.br',
    'analista',
    true
  ),
  (
    '71ce0ce0-875c-4bcf-bb44-05ec826692e2',
    'Fabiana Carvalho',
    'fabiana.carvalho@quartaetapa.com.br',
    'gestor',
    true
  )
on conflict (id) do update
set
  nome_completo = excluded.nome_completo,
  email = excluded.email,
  papel = excluded.papel,
  ativo = excluded.ativo;
