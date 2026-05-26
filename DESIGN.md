---

name: Quarta Etapa Operacional

colors:

  surface: '#081421'

  surface-dim: '#081421'

  surface-bright: '#2e3a49'

  surface-container-lowest: '#040f1c'

  surface-container-low: '#101c2a'

  surface-container: '#14212f'

  surface-container-high: '#1c2b3a'

  surface-container-highest: '#263647'

  on-surface: '#e2e8f0'

  on-surface-variant: '#94a3b8'

  outline: '#334155'

  outline-variant: '#1e293b'

  primary: '#2563eb'

  on-primary: '#ffffff'

  primary-container: '#1e40af'

  on-primary-container: '#dbeafe'

  secondary: '#0ea5e9'

  on-secondary: '#ffffff'

  secondary-container: '#0c4a6e'

  on-secondary-container: '#e0f2fe'

  error: '#ef4444'

  on-error: '#ffffff'

  success: '#10b981'

  on-success: '#ffffff'

  warning: '#f59e0b'

  on-warning: '#ffffff'

  info: '#3b82f6'

  on-info: '#ffffff'



status:

  pendente: '#2563eb'

  orcamento: '#9333ea'

  agendado: '#ca8a04'

  analisado: '#ddeb24'

  em-atendimento: '#ea580c'

  pendente-peca: '#dc2626'

  resolvido: '#16a34a'

  faturado: '#064e3b'

  arquivado: '#000000'



priority:

  baixa: '#334155'

  media: '#2563eb'

  alta: '#ea580c'

  critica: '#dc2626'



typography:

  family: Geist, ui-sans-serif, system-ui, sans-serif

  size-base: 14px

  scale: 1.2

  weights:

    regular: 400

    medium: 500

    semibold: 600

    bold: 700



spacing:

  base: 4px

  scale: \[0, 4, 8, 12, 16, 24, 32, 48, 64]



rounding:

  none: 0

  small: 4px

  medium: 8px

  large: 12px

  full: 9999px

---



\# Portal de Atendimento Quarta Etapa - Design System

Este sistema de design foi extraído e consolidado a partir da análise das interfaces operacionais da Quarta Etapa Tecnologia para Negócios. Ele foca em densidade de informação, clareza técnica e eficiência para fluxos de Service Desk e Field Service.



\## 1. Princípios Visuais



\- \*\*Densidade Operacional\*\*: Layouts compactos que priorizam a visualização de dados sem excesso de espaços em branco.

\- \*\*Foco em Status\*\*: Uso rigoroso de cores semânticas para identificar o estado dos chamados e a urgência das tarefas.

\- \*\*Hierarquia Estruturada\*\*: Uso de cards com bordas sutis e cabeçalhos claros para agrupar informações relacionadas.

\- \*\*Modo Escuro (Dark Mode)\*\*: Base visual primária para reduzir a fadiga ocular em uso contínuo.



\## 2. Layout \& Estrutura



\- \*\*Sidebar\*\*: Navegação vertical à esquerda, compacta, com ícones e labels curtos.

\- \*\*Header\*\*: Barra superior contendo breadcrumbs (trilha de navegação), busca global, acesso a FAQ e menu de usuário.

\- \*\*Main Content\*\*: Área central para tabelas de gestão e formulários de abertura de chamados.

\- \*\*Footer\*\*: Rodapé institucional com links de governança, versão do sistema e referências legais (LGPD/GDPR).



\## 3. Componentes Principais



\### Tabelas (Data Tables)

\- Cabeçalhos de baixo contraste.

\- Linhas com divisores sutis (`outline-variant`).

\- Uso extensivo de Badges para status e prioridade.

\- Colunas alinhadas para leitura rápida de ID, Título, Cliente e Técnico.

\### Registros de Configuração

\- Telas administrativas pequenas de configuração devem seguir o padrão canônico de Status de Chamados.

\- Usar listagem tabular, filtros visíveis, paginação local e navegação Primeiro, Voltar, Avançar e Último.

\- Garantir persistência nas tabelas operacionais existentes via Server Actions, mantendo autorização, RLS e revalidação da tela.



\### Formulários

\- Labels acima dos campos com tipografia pequena e clara (`on-surface-variant`).

\- Inputs com fundo `surface-container-low` e bordas `outline-variant`.

\- Agrupamento de campos em blocos numerados (ex: "1. Identificação do chamado").

\- Grandes cadastros devem exibir legenda discreta para diferenciar campos obrigatórios, opcionais, automáticos e somente leitura.

\- Botões de ação primária em azul (`primary`) e secundários em contorno.



\### Badges de Status

\- Formato arredondado ou pílula.

\- Cores sólidas ou com opacidade, mapeadas conforme a tabela de cores de status definida no frontmatter.



\## 4. Tipografia



\- \*\*Fonte Principal\*\*: Geist (ou sans-serif do sistema).

\- \*\*Escala\*\*: Prioriza tamanhos entre 12px (metadados/labels) e 24px (títulos de página).

\- \*\*Peso\*\*: Uso de Medium (500) para labels e Semibold (600) para títulos de cards e botões.



\## 5. Cores Semânticas (Regras)



\- \*\*Ação Primária\*\*: Azul Corporativo (`primary`).

\- \*\*Sucesso\*\*: Verde para chamados resolvidos ou conclusões positivas.

\- \*\*Atenção/Erro\*\*: Vermelho para prioridade crítica, prazos expirados ou erros de validação.

\- \*\*Avisos\*\*: Amarelo/Laranja para estados de agendamento ou atenção intermediária.


