# Padrão de Auto Save

## Decisão atual

O auto save fica restrito a preferências visuais reversíveis:

- tema;
- cor de destaque;
- tamanho da fonte.

Dados pessoais, permissões, vínculos operacionais, chamados, evidências e
histórico devem continuar com botão Salvar e validação explícita.

## Critérios para ampliar o padrão

Antes de aplicar auto save em outras áreas, o fluxo deve ter:

- debounce para reduzir gravações repetidas;
- estado visível de salvando, salvo e erro;
- rollback visual quando o banco rejeitar a alteração;
- mensagens compreensíveis para usuário não técnico;
- logs de falha suficientes para suporte;
- validação server-side e RLS preservadas.

## Motivo

Preferências visuais têm baixo impacto operacional e são fáceis de reverter.
Dados sensíveis e registros auditáveis exigem confirmação explícita para evitar
alterações acidentais e preservar rastreabilidade.
