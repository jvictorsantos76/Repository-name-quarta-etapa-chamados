# Politica de Seguranca para MCPs

## Principios

- Seguranca tem prioridade sobre conveniencia.
- MCPs devem usar a menor permissao possivel.
- MCPs sensiveis devem iniciar em modo somente leitura quando possivel.
- Ambientes local, homologacao e producao devem ser tratados separadamente.
- Toda permissao concedida deve ter finalidade, responsavel, risco e data de revisao.
- Revisar MCPs a cada 30 dias ou antes de liberar qualquer permissao de escrita.

## Regras para tokens e secrets

- Nunca gravar tokens, chaves, senhas, URLs privadas ou credenciais no repositorio.
- Usar variaveis de ambiente para credenciais.
- Registrar apenas nomes das variaveis, nunca valores.
- Nao passar chaves em argumentos de comando quando o MCP aceitar variavel de ambiente.
- Para GitHub, usar o nome `GITHUB_PERSONAL_ACCESS_TOKEN` quando uma credencial for necessaria.
- Para Context7, usar o nome `CONTEXT7_API_KEY` quando uma credencial for necessaria.
- Revogar credenciais quando um MCP for removido, rejeitado ou deixar de ser usado.
- Se houver suspeita de exposicao, rotacionar a credencial antes de continuar o uso.

## Regras para leitura e escrita

- Comecar em modo leitura sempre que possivel.
- Permissao de escrita exige justificativa, revisao de risco e validacao em ambiente seguro.
- Escrita em GitHub deve ser testada primeiro em issue de teste, nunca diretamente na branch principal.
- Escrita em Supabase, banco de dados ou producao deve ser classificada como risco alto.
- Operacoes destrutivas exigem confirmacao explicita e registro do motivo.

## Regras para producao

- Nao usar MCP em producao sem necessidade operacional clara.
- Separar credenciais de local, homologacao e producao.
- Nao executar migrations automaticamente.
- Nao alterar policies, RLS, dados operacionais ou configuracoes produtivas por automacao sem aprovacao explicita.
- Qualquer acao que possa alterar producao deve ser tratada como risco alto.

## Regras para logs

- Logs nao devem conter tokens, secrets, credenciais ou dados pessoais desnecessarios.
- Prints de navegador devem ser evitados quando houver dados sensiveis.
- Evidencias de teste devem ser sanitizadas quando necessario.
- Ao compartilhar logs, remover identificadores pessoais, emails, dados de clientes e dados de chamados que nao sejam necessarios para diagnostico.

## Regras para dados e LGPD

- Minimizar exposicao de dados pessoais.
- Consultar apenas dados necessarios para a tarefa.
- Evitar exportar dados de usuarios, clientes, tecnicos, chamados, evidencias e historico.
- Telas administrativas e dados operacionais exigem autenticacao e autorizacao adequadas.
- O acesso operacional do sistema deve continuar respeitando as regras existentes de perfis, permissoes e RLS.

## Regras especificas por MCP

### Context7

- Permitido para documentacao tecnica publica.
- Quando exigir autenticacao, usar `CONTEXT7_API_KEY` fora do repositorio.
- Nao usar `--api-key` com valor literal em arquivos de configuracao.
- Nao deve ter permissao de escrita.

### OpenAI Docs

- Permitido para documentacao oficial publica da OpenAI.
- Nao deve exigir secrets do projeto.
- Usar como fonte primaria para Codex, Responses API, modelos, prompts e configuracoes OpenAI.
- Nao deve ter permissao de escrita.

### GitHub MCP

- Iniciar em read-only sempre que possivel.
- Usar `GITHUB_PERSONAL_ACCESS_TOKEN` quando uma credencial for necessaria.
- Registrar escopos concedidos.
- Escrita futura exige revisao previa e teste em issue de teste.

### Supabase MCP ou equivalente

- Iniciar somente leitura.
- Usar local ou homologacao antes de qualquer avaliacao produtiva.
- Nao aplicar migrations automaticamente.
- Nao executar deletes ou alteracoes destrutivas sem confirmacao explicita.
- Verificar RLS e policies sem expor dados sensiveis.

### Browser automation

- Priorizar localhost.
- Homologacao somente quando necessario.
- Producao apenas com aprovacao explicita e plano de teste seguro.
- Evitar prints e logs com dados sensiveis.

### Google Drive ou documentacao interna

- Acesso apenas aos documentos necessarios.
- Nao usar documentos pessoais ou fora do escopo.
- Nao alterar documentos por padrao.

### Figma MCP ou equivalente

- Usar somente quando houver necessidade real de UI/UX.
- Limitar acesso aos arquivos necessarios.
- Documentar telas usadas como referencia.

## Revisao periodica

- Revisar todos os MCPs pelo menos a cada 30 dias.
- Revisar imediatamente antes de liberar permissao de escrita.
- Verificar se o MCP ainda e usado.
- Verificar se as permissoes continuam proporcionais.
- Verificar se houve exposicao de secrets ou dados sensiveis.
- Atualizar status, responsavel, data e observacoes em `docs/mcp/mcp-instalados.md`.

## Criterios de bloqueio

Bloquear, remover ou rejeitar MCP que:

- exige permissao ampla sem justificativa;
- nao permite limitar acesso;
- expoe secrets ou dados sensiveis;
- executa operacoes destrutivas sem controle;
- nao agrega valor claro ao projeto;
- nao funciona apos reiniciar o Codex;
- duplica ferramenta mais simples e mais segura.
