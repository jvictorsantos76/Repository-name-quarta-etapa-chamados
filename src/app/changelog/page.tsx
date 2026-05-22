import Link from "next/link";
import { APP_UPDATED_AT, APP_VERSION } from "@/config/version";

const versoes = [
  {
    versao: "v0.9.39",
    data: "22/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.1.3 corrige a regra funcional da Localização operacional para tratar latitude e longitude como campos derivados do link ou endereço informado.",
      "O preview interno passa a usar coordenadas somente quando elas forem válidas; caso contrário, usa o endereço cadastral ou textual como referência.",
    ],
    correcoes: [
      "Campos vazios de coordenadas deixam de ser interpretados como 0,0, evitando preview e rota para um ponto inválido.",
      "Links curtos do Google Maps continuam salvos, mas usam o endereço cadastral como fallback sem resolução automática.",
    ],
  },
  {
    versao: "v0.9.38",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.1.2 troca o iframe do preview por uma visualização interna estável, evitando área em branco quando o provedor externo não renderiza embutido.",
      "O preview passa a priorizar o endereço exibido no campo de Google Maps antes da localização de referência salva anteriormente.",
    ],
    correcoes: [
      "A ação Visualizar no mapa deixa de depender de carregamento em iframe e mantém Conferir no Google Maps e Iniciar rota como ações externas.",
    ],
  },
  {
    versao: "v0.9.37",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.1.1 simplifica Localização operacional usando o endereço cadastral como referência inicial para preview.",
      "Latitude e longitude passam a aparecer como campos compactos gerados a partir do link, endereço ou coordenadas informadas.",
      "A ação Visualizar no mapa passa a atualizar o preview interno, removendo botões auxiliares desnecessários.",
    ],
    correcoes: [
      "Links curtos do Google Maps continuam salvos, mas o preview usa o endereço cadastral como fallback sem tentar resolver URL curta no servidor.",
    ],
  },
  {
    versao: "v0.9.36",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.1.0 adiciona localização operacional separada do endereço cadastral, com interpretação de coordenadas ou URL longa do Google Maps.",
      "A aba Geral passa a exibir preview interno de mapa sem API Key, botão Iniciar rota e ação para copiar coordenadas.",
      "Cadastro passa a persistir informações de acesso e horários operacionais para uso em Field Service.",
    ],
    correcoes: [
      "Migration defensiva adiciona apenas colunas nullable em public.parceiros, preservando RLS, grants, delete, Storage e autenticação.",
    ],
  },
  {
    versao: "v0.9.35",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.7 separa visualmente os retornos das consultas de CNPJ e CEP.",
    ],
    correcoes: [
      "A validação do CEP passa a aparecer junto ao botão Buscar CEP, evitando feedback distante do ponto de ação.",
    ],
  },
  {
    versao: "v0.9.34",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.6 aproxima o retorno da consulta de CNPJ do campo e do botão Consultar CNPJ.",
    ],
    correcoes: [
      "A mensagem de sucesso, situação cadastral e ação de substituir dados deixam de aparecer distante do ponto de consulta.",
    ],
  },
  {
    versao: "v0.9.33",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.5 melhora a usabilidade da aba Geral com status sem redundância, tipo/perfil mais compactos e CNPJ agrupado ao botão Consultar CNPJ.",
      "Contatos passam a exibir ações auxiliares seguras para e-mail e WhatsApp quando houver dados válidos.",
      "Cadastro de contatos passa a aceitar observações internas exclusivas por contato.",
    ],
    correcoes: [
      "A mudança adiciona apenas a coluna nullable public.parceiros_contatos.observacoes, preservando RLS, grants, delete e Storage.",
    ],
  },
  {
    versao: "v0.9.32",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.4 permite criar uma organização vinculada a partir do próprio cadastro quando o agrupador ainda não existe.",
      "O vínculo continua gravado em public.parceiros.organizacao_id, sem transformar clientes/parceiros em organizações apenas na interface.",
    ],
    correcoes: [
      "A criação é explícita no salvamento e reutiliza organização existente com o mesmo nome quando encontrada, evitando duplicidade operacional simples.",
    ],
  },
  {
    versao: "v0.9.31",
    data: "21/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.3 conclui a aba Geral com consulta pública de CNPJ pela BrasilAPI, busca de CEP pelo ViaCEP e abertura pública do endereço no Google Maps.",
      "A tela passa a permitir vínculo editável com Organização, preservando cliente legado e sincronizando clientes.organizacao_id apenas quando o usuário altera explicitamente o vínculo.",
      "A situação cadastral fiscal retornada na consulta de CNPJ fica restrita ao feedback visual, sem alterar a situação operacional do parceiro.",
    ],
    correcoes: [
      "Migration defensiva adiciona parceiros.organizacao_id com FK e backfill sem sobrescrever vínculos existentes, mantendo RLS, grants e delete inalterados.",
    ],
  },
  {
    versao: "v0.9.30",
    data: "20/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.2 padroniza a aba Geral com tipo de pessoa, perfil operacional, máscaras brasileiras, selects de CRT, situação, segmento, UF, país e contato principal.",
      "A visualização de Pessoa Física passa a usar CPF, Nome Completo e Nome de Exibição, ocultando campos fiscais de Pessoa Jurídica sem apagar dados legados.",
      "Localização deixa de expor latitude e longitude como campos principais no modo confortável e registra como backlog as integrações futuras de CNPJ, CEP, Google Maps, múltiplos contatos e múltiplos endereços.",
    ],
    correcoes: [
      "Migration defensiva amplia os valores aceitos em parceiros e contatos sem alterar RLS, grants, Storage, delete ou dados existentes.",
    ],
  },
  {
    versao: "v0.9.29",
    data: "20/05/2026",
    alteracoes: [
      "Organizações v1.1.1 explicita quais clientes alimentam o vínculo administrativo, mostrando parceiro mestre e quantidade de filiais operacionais por cliente.",
      "Clientes / Parceiros v1.0.1 mostra o cliente legado, a organização derivada e as filiais conectadas ao cadastro mestre.",
      "Novo Chamado v0.2.7 exibe organização administrativa, parceiro mestre e filial mestre derivados automaticamente do cliente e da filial selecionados.",
    ],
    correcoes: [
      "A transparência dos vínculos passa a vir de consultas de leitura sobre os campos existentes, sem escolha manual divergente e sem mudança de RLS ou schema.",
    ],
  },
  {
    versao: "v0.9.28",
    data: "19/05/2026",
    alteracoes: [
      "Organizações v1.1.0 passa a vincular clientes existentes ao agrupador administrativo, preservando clientes e lojas como base operacional dos chamados.",
      "Novo Chamado v0.2.6 deriva a organização administrativa exclusivamente do cliente selecionado no backend, sem escolha manual divergente na interface.",
    ],
    correcoes: [
      "Migration separada corrige chamados.organizacao_id para referenciar public.organizacoes, convertendo dados legados quando houver vínculo e mantendo NULL quando não houver organização resolvida.",
    ],
  },
  {
    versao: "v0.9.27",
    data: "19/05/2026",
    alteracoes: [
      "Clientes / Parceiros v1.0.0 cria o cadastro mestre ERP operacional separado de Organizações, com abas para Geral, Filiais, Contatos, Financeiro, Contratos e SLA, Operação, Anexos e Histórico.",
      "Nova estrutura Supabase adiciona parceiros, filiais, contatos, financeiro, operacional, contratos, anexos e histórico com backfill idempotente de clientes e lojas legados.",
      "Chamados passam a receber campos opcionais parceiro_id e parceiro_filial_id, preservando cliente_id e loja_id durante a transição operacional.",
    ],
    correcoes: [
      "RLS, grants para authenticated/service_role e bucket parceiros-anexos são definidos por migration versionada, mantendo delete fechado para usuários comuns.",
    ],
  },
  {
    versao: "v0.9.26",
    data: "18/05/2026",
    alteracoes: [
      "Status de chamados v1.0.0 passa a ser o padrão canônico para registros pequenos de configuração.",
      "Tipos de chamado, origens de chamado e grupos de atendimento v1.0.0 adotam filtros visíveis, paginação local e navegação Primeiro, Voltar, Avançar e Último.",
    ],
    correcoes: [
      "Catálogos de configuração passam a compartilhar um cliente operacional simples, preservando Server Actions, RLS e permissões existentes.",
    ],
  },
  {
    versao: "v0.9.25",
    data: "17/05/2026",
    alteracoes: [
      "Status de chamados v0.1.5 sincroniza o estado visual das linhas após atualização da lista.",
    ],
    correcoes: [
      "Corrige a exibição temporária de dois registros marcados como padrão quando o autosave troca o status padrão.",
    ],
  },
  {
    versao: "v0.9.24",
    data: "17/05/2026",
    alteracoes: [
      "Status de chamados v0.1.4 exibe a regra de padrão único diretamente na lista de registros.",
    ],
    correcoes: [
      "Corrige o autosave ao sair dos campos da linha de status, garantindo que as alterações sejam salvas com os dados atuais.",
      "Ao marcar um status como padrão, a tela recarrega a lista para refletir que os demais registros foram desmarcados automaticamente.",
    ],
  },
  {
    versao: "v0.9.23",
    data: "17/05/2026",
    alteracoes: [
      "Status de chamados v0.1.3 passa a garantir regra única de padrão: ao definir um status como padrão, os demais são desmarcados automaticamente no salvamento.",
    ],
    correcoes: [
      "Removido o indicador redundante de contagem de padrão no topo da tela de Status de chamados.",
      "Migration nova reforça no banco que apenas um registro em chamado_status pode ficar com eh_padrao = true.",
    ],
  },
  {
    versao: "v0.9.22",
    data: "17/05/2026",
    alteracoes: [
      "Status de chamados v0.1.2 adiciona filtros por campo e paginação local com opções de 10, 20, 30 ou 50 registros, além de navegação para primeiro, anterior, próximo e último.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.9.21",
    data: "17/05/2026",
    alteracoes: [
      "Versionamento passa a ser centralizado no botão/painel global em todo o sistema, removendo badges locais de versão das páginas e preservando o rodapé interno apenas nas telas com chrome operacional.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.9.20",
    data: "13/05/2026",
    alteracoes: [
      "Status de chamados v0.1.1 reorganiza a página com layout mais denso e responsivo, mantendo Código, Nome, Descrição, Cor, Ordem, Ativo, Padrão, Referências, autosave e exclusão visíveis em mobile, tablet e desktop.",
      "Status de chamados v0.1.0 troca botões de salvar/atualizar por autosave, gera código automaticamente a partir do nome, usa seletor de cor, compacta o campo de ordem e adiciona exclusão segura sem vínculos.",
      "Consolida a matriz de papéis para Super-Admin, Admin, Comercial, Analista, Técnico-Quarta, Técnico-Terceirizado, Cliente e Parceiro.",
      "Cria o cadastro de Status de chamados e adiciona telas administrativas individuais para status, tipos, origens e grupos de atendimento em Configurar.",
      "Base de Conhecimento passa a ser ferramenta operacional em Ferramentas, com edição para Super-Admin/Admin/Analista e consulta para técnicos.",
      "Novo Chamado v0.2.5 passa a usar status padrão cadastrado e restringe cliente/parceiro à loja vinculada ao perfil.",
      "Novo Chamado v0.2.4 adiciona criação inline de filial vinculada à organização selecionada no bloco Organização e Filial.",
      "Novo Chamado v0.2.3 reorganiza Assunto, Problema Relatado, Organização e Filial nos blocos operacionais da abertura de chamado.",
      "Rodapé interno v0.9.18 aproxima a hierarquia visual da referência Uber, com topo institucional, colunas discretas e linha inferior de governança.",
      "Versionamento v0.9.17 passa a usar botão fixo sobre a sidebar, com painel compacto apenas na sidebar recolhida e no mobile.",
      "Rodapé interno v0.9.17 fica exclusivamente no fluxo normal da página, sem sobrepor tabelas, cards ou ações mobile.",
      "Rodapé interno v0.9.16 passa a ficar no fim da página com links principais agrupados por Operação, Administração e Suporte e governança.",
      "Versionamento visível v0.9.16 passa a ficar fixo no canto inferior esquerdo, acompanhando a largura da sidebar e exibindo apenas versão global e versão da tela aberta.",
      "Navegação principal v0.9.15 passa a abrir grupos da sidebar recolhida em painel lateral isolado, sem alterar a largura da barra.",
      "Rodapé interno v0.9.15 substitui o badge solto de versão por links compactos para Dashboard, Novo chamado, Usuários, Permissões, FAQ, Roadmap, Changelog, Termos e Privacidade.",
      "Cadastro de Usuário v0.4.1 passa a registrar os aceites legais com a constraint única exigida pelo upsert, estabilizando o cadastro público no banco atual.",
      "Solicitações de Acesso v0.3.3 mantém aprovação manual e deixa o fluxo pronto para operar mesmo quando o envio automático do Supabase Auth estiver indisponível.",
      "Cadastro de Usuário v0.4.0 passa a registrar a solicitação mesmo quando o Supabase Auth não consegue enviar a confirmação automática, criando o usuário por fluxo administrativo e encaminhando a liberação para aprovação manual.",
      "Solicitações de Acesso v0.3.2 passa a sempre gerar link manual de recuperação ou convite durante a aprovação administrativa, reduzindo dependência operacional do SMTP para o primeiro acesso.",
      "Cadastro de Usuário v0.3.9 mantém senha no pedido público, exige confirmação de e-mail e retorna o fluxo para aprovação administrativa obrigatória antes do acesso operacional.",
      "Confirmação de e-mail passa a apenas mover a solicitação para pendente_aprovacao, sem criar perfil operacional automático nem liberar uso temporário do sistema.",
      "Solicitações de Acesso v0.3.1 exige confirmação de e-mail antes da aprovação, reaproveita reset de senha ou convite Supabase e registra link manual de contingência.",
      "Alteração de senha passa a validar a mesma política configurada no Supabase: mínimo de 8 caracteres, letra minúscula, letra maiúscula e número.",
      "Helpers server-side, home e detalhes de chamados deixam de tratar solicitante como papel operacional ativo no onboarding atual.",
      "Cadastro de Usuário v0.3.7 trata solicitação pendente duplicada como fluxo recuperável, orientando o usuário a usar o link de confirmação ou recuperação de senha.",
      "Cadastro de Usuário v0.3.6 recupera usuários Auth existentes ainda não confirmados, criando a solicitação operacional para que o link de confirmação já enviado continue válido.",
      "Cadastro de Usuário v0.3.5 tenta registrar a solicitação pelo cliente administrativo e usa fallback RLS público específico de cadastro quando o PostgREST administrativo falha.",
      "Cadastro de Usuário v0.3.4 preserva o usuário Auth quando a gravação operacional falha, permitindo retomar o cadastro com o mesmo e-mail e senha.",
      "Aguardando Aprovação passa a sincronizar a sessão Supabase do navegador com os cookies do servidor e redirecionar usuários já autorizados.",
      "Aguardando Aprovação passa a verificar a sessão ativa no servidor e redirecionar automaticamente usuários já autorizados para o destino correto.",
      "Cadastro de Usuário v0.3.2 recupera usuários Auth órfãos de tentativas anteriores quando o e-mail já foi confirmado e ainda não existe perfil operacional.",
      "Cadastro de Usuário v0.3.1 passa a gravar a solicitação de acesso pelo cliente administrativo do servidor após criar o usuário Auth, evitando falha por RLS no envio público.",
      "Confirmação de e-mail só grava a sessão local depois de atualizar solicitacoes_acesso, perfis e aceites legais com sucesso.",
      "Aguardando Aprovação passa a voltar ao login via logout servidor, limpando a sessão antes de permitir entrar com outro usuário.",
      "Migration corretiva v202605110001 reaplica a governança de acesso pendente quando o histórico remoto indica aplicação anterior sem o schema efetivo.",
      "Cadastro de Usuário v0.3.0 passa a criar conta Supabase com senha, exigir confirmação de e-mail e registrar a solicitação como pendente_confirmacao_email.",
      "Confirmação de e-mail ativa acesso temporário restrito como solicitante por até 72 horas úteis, com expiração calculada no banco.",
      "Novo Chamado v0.2.1 restringe usuários pendentes à abertura de chamados próprios na unidade vinculada ao cadastro.",
      "RLS de chamados, clientes, lojas, histórico, registros técnicos e evidências passa a bloquear policies amplas de desenvolvimento e separar acesso operacional de acesso temporário.",
      "Solicitações de Acesso v0.3.0 registra confirmação de e-mail, expiração, bloqueio, motivo de rejeição e vínculo com usuário Auth para auditoria.",
      "Solicitações de Acesso v0.2.1 ajusta o provisionamento para convite Supabase Auth em usuários novos e recuperação de senha em usuários Auth já existentes.",
      "Aprovação administrativa deixa de gerar magic link como caminho operacional de provisionamento, preservando o fluxo de definição de senha e login por e-mail/senha.",
      "Navegação principal v0.9.1 passa a usar Sidebar fixa e recolhível no desktop/tablet, inspirada na lógica visual do GLPI e com identidade Quarta Etapa.",
      "Header global passa a atuar como barra superior com Home, breadcrumb, busca global, FAQ e menu do usuário, sem duplicar a navegação operacional.",
      "Menu mobile passa a abrir a mesma navegação principal em drawer vertical pelo botão hambúrguer.",
      "Nova página Roadmap exibe recursos em breve e a sugestão de evolução em 12 meses sem gerar rotas 404.",
      "Favicon passa a usar os arquivos reais do pacote Genfavicon nos caminhos do App Router e fallback /favicon.ico.",
      "Header global v0.9.0 passa a usar navegação responsiva com logo Quarta Etapa à esquerda, menu principal, dropdown Programas, busca global inicial, FAQ e menu completo do usuário.",
      "Logo do header passa a alternar automaticamente entre versão clara e escura conforme o tema ativo.",
      "Menu principal remove Unidades da navegação de primeiro nível e mantém cadastros secundários acessíveis por áreas existentes.",
      "Busca global inicial exibe o campo operacional sem criar consultas novas nem ampliar acesso a dados.",
      "Novo Chamado v0.2.0 implementa o Bloco 1 - Identificação do chamado com título manual, tipo, origem, ID externo, organização, grupo e bases relacionadas.",
      "Catálogos de tipo, origem, grupo de atendimento e base de conhecimento passam a ter tabelas próprias, RLS e cadastro inline restrito a admin, gestor e analista.",
      "Abertura de chamados passa a salvar vínculos estruturados preservando campos legados para compatibilidade com listagem e detalhe.",
      "Cabeçalho passa a ter ações rápidas de alternar tema claro/escuro e encerrar sessão.",
      "Conta v0.1.1 remove card redundante de Perfil e mantém acesso ao perfil pelo card principal do usuário.",
      "Permissões v0.1.1 adiciona ações rápidas de conta também no rodapé da tela.",
      "Nova área Conta - Quarta Etapa v0.1.0 centraliza Perfil, Aparência e Permissões em cards clicáveis.",
      "Perfil passa a ficar em /conta/perfil, com /perfil preservado por redirecionamento compatível.",
      "Aparência e Acessibilidade v0.1.0 fica em tela própria e mantém auto save apenas para preferências visuais.",
      "Permissões v0.1.0 exibe nível operacional e ações permitidas por tela a partir de matriz centralizada.",
      "Cargo passa a ser editável pelo próprio usuário com RLS restrito aos campos básicos do perfil.",
      "Preferências de aparência passam a ser aplicadas globalmente no SaaS com fallback em localStorage e carregamento inicial no layout raiz.",
      "Perfil de Usuário v0.1.4 passa a salvar tema, cor e fonte atualizando Supabase, navegador e DOM imediatamente.",
      "Perfil de Usuário v0.1.3 adiciona preferências de aparência e acessibilidade com tema, cor de destaque e escala de fonte salvas em public.perfis.",
      "Perfil de Usuário v0.1.2 passa a ter upload de foto com Supabase Storage e prévia no formulário.",
      "Perfil de Usuário v0.1.1 passa a incluir seção Segurança com alteração de senha e encerramento manual de sessão.",
    ],
    correcoes: [
      "Versionamento volta a aparecer na tela de Status de chamados com o mesmo padrão visível usado nas telas operacionais.",
      "Menu do usuário fecha ao clicar fora, ao pressionar Escape ou ao navegar por um link interno.",
      "Badge de versão deixa de ficar preso sob a sidebar recolhida e passa a se adaptar ao estado expandido, recolhido e mobile.",
      "Corrige o erro local em que a solicitação era criada, mas o registro de aceites legais falhava por ausência da constraint única usada no upsert de aceites_legais.",
      "Consolida o diagnóstico de produção: as telas públicas e administrativas ainda estão em build anterior e precisam de novo deploy para remover o bloqueio por confirmação automática de e-mail.",
      "Corrige o erro de cadastro público quando o Supabase retorna falha no envio do e-mail de confirmação, preservando o pedido para tratamento administrativo.",
      "Corrige a ausência de link manual em aprovações administrativas quando o Supabase aceita a operação de recuperação ou convite, mas a entrega por e-mail continua instável.",
      "Login passa a orientar que o acesso recém-solicitado depende de aprovação administrativa ou do link enviado pela equipe responsável, evitando leitura equivocada de credencial inválida.",
      "Corrige o cenário em que usuário confirmado recebia autenticação válida, mas seguia sem perfil operacional ativo e acabava liberado por lógica temporária divergente do processo administrativo.",
      "Corrige aprovações administrativas sem confirmação de e-mail, bloqueando o provisionamento até o cadastro cumprir a etapa obrigatória do Auth.",
      "Corrige reenvio de acesso aprovado com ação explícita para gerar novo link sem reprovisionar o perfil já aprovado.",
      "Evita exibir erro genérico quando o cadastro já foi registrado e o usuário apenas reenviou o mesmo e-mail.",
      "Corrige cadastros que recebiam e-mail de confirmação antes da solicitação operacional existir e depois não conseguiam reenviar o cadastro com o mesmo e-mail.",
      "Reduz falhas de envio de solicitação quando o Auth cria a conta, mas a chamada administrativa de solicitacoes_acesso não conclui.",
      "Corrige cenário em que o link de confirmação era enviado, mas o usuário Auth era removido após falha de solicitacoes_acesso, causando senha inválida no login.",
      "Corrige persistência em Aguardando Aprovação quando o navegador mantinha sessão Supabase local, mas os cookies próprios do app não estavam atualizados.",
      "Corrige usuário com e-mail confirmado no Supabase Auth, mas sem public.solicitacoes_acesso/public.perfis, que ficava preso na tela de aguardando aprovação.",
      "Corrige o caso em que o usuário recebia e-mail de confirmação, mas ficava preso em Aguardando Aprovação porque a solicitação operacional não havia sido persistida no banco.",
      "Evita deixar usuário Auth órfão quando a gravação de solicitacoes_acesso falha durante o cadastro público.",
      "Remoção de textos decorativos como Editar, Adicionar e Admin quando não representam botões clicáveis.",
      "Salvamento de telefone, biografia e foto do próprio perfil volta a respeitar RLS com update restrito aos campos básicos.",
      "Avatar salvo em public.perfis.avatar_url passa a aparecer no cabeçalho e no avatar grande do perfil após reload.",
      "Logout manual executa signOut no navegador e no servidor, limpa cookies locais de sessão e redireciona para o login sem reativar login automático.",
      "Erros inesperados passam a exibir uma tela própria do Portal com ações para tentar novamente, voltar ao login ou retornar aos chamados.",
    ],
  },
  {
    versao: "v0.8.2",
    data: "05/05/2026",
    alteracoes: [],
    correcoes: [
      "Sessões Supabase expiradas passam a ser renovadas no middleware com refresh_token antes das páginas protegidas validarem o perfil ativo.",
      "Cookies de sessão inválidos são limpos antes do redirecionamento para login, reduzindo falsos estados de usuário sem acesso ativo no Browser nativo.",
      "Cadastro de Usuário v0.2.1 volta a registrar solicitações públicas no schema atual, sem depender da função de expiração removida do banco.",
      "Solicitações públicas passam a ser criadas com status pendente_aprovacao, preservando o fluxo de aprovação sem liberar acesso automático.",
    ],
  },
  {
    versao: "v0.8.0",
    data: "04/05/2026",
    alteracoes: [
      "Cadastro de Usuário v0.2.0 passa a salvar expiração de 72 horas úteis calculada no banco e mantém o fluxo público sem liberação automática.",
      "Solicitações de Acesso v0.2.0 passam a exigir nível antes da aprovação, motivo na rejeição e exibir status, expiração, responsáveis e provisionamento.",
      "Perfil de Usuário v0.1.0 adiciona botão no topo com nome, nível e avatar/iniciais, além de edição básica de telefone, foto por URL e biografia.",
      "Níveis super_admin, admin, gestor, analista, tecnico, cliente e solicitante passam a ser tratados por helpers centralizados, mantendo operador como legado.",
    ],
    correcoes: [
      "Botão visual de Google OAuth fica oculto até haver implementação adequada do provedor.",
      "Administração de usuários fica restrita a super_admin e admin, preservando autorização operacional em public.perfis.",
    ],
  },
  {
    versao: "v0.7.1",
    data: "03/05/2026",
    alteracoes: [
      "Revisão do fluxo Supabase Auth separando solicitação pública, aprovação administrativa, convite por e-mail, callback de sessão e autorização por public.perfis.",
      "Tela de Login v0.2.0 passa a oferecer Magic Link/OTP para e-mails já autorizados, sem auto-criação de usuário.",
      "Callback /auth/confirm passa a validar token_hash, code, tipo de OTP, sessão e perfil ativo antes de liberar acesso.",
      "Recuperação de senha passa a direcionar para alteração autenticada em /auth/alterar-senha.",
      "Administração de usuários passa a permitir reprovisionar solicitações aprovadas sem auth_user_id, perfil_id ou provisionado_em.",
      "Changelog registra a necessidade operacional de configurar SMTP próprio, Redirect URLs e templates Supabase Auth fora do repositório.",
    ],
    correcoes: [
      "Solicitação aprovada sem provisionamento volta a ter ação de retry em vez de ficar bloqueada na interface administrativa.",
    ],
  },
  {
    versao: "v0.7.0",
    data: "01/05/2026",
    alteracoes: [
      "Aprovação de solicitações passa a enviar convite Supabase Auth e criar perfil operacional ativo com papel operador.",
      "Solicitações de acesso passam a registrar vínculo com usuário Auth, perfil, data de provisionamento e erro de provisionamento quando ocorrer.",
      "Cadastro passa a informar que usuários aprovados recebem convite por e-mail para definir acesso.",
      "Termos de Uso e Política de Privacidade foram ampliados com referências objetivas a LGPD/GDPR, direitos dos titulares, bases legais e contato.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.6.1",
    data: "28/04/2026",
    alteracoes: [
      "Tela de Login v0.1.0 com logo ampliado, caminhos separados para usuários cadastrados e novos usuários.",
      "Inclusão de contatos de desenvolvimento/suporte técnico e administrativo no painel institucional do login.",
      "Referência curta a LGPD/GDPR na autenticação, com manutenção dos links para Política de Privacidade e Termos de Uso.",
      "Badge global passa a exibir a versão específica da tela de login no mesmo local do versionamento geral, sem sobrepor o conteúdo no mobile.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.6.0",
    data: "27/04/2026",
    alteracoes: [
      "Tela de login redesenhada para o Portal de Atendimento Quarta Etapa.",
      "Preparação para login com Google via Supabase OAuth.",
      "Cadastro público controlado com solicitação pendente de aprovação.",
      "Páginas iniciais de Política de Privacidade, Termos de Uso e aguardando aprovação.",
      "Área administrativa inicial para listar e atualizar solicitações de acesso.",
    ],
    correcoes: [
      "Usuário autenticado sem perfil operacional ativo passa a ser direcionado para aguardando aprovação.",
    ],
  },
  {
    versao: "v0.5.0",
    data: "27/04/2026",
    alteracoes: [
      "Login com Supabase Auth por e-mail e senha.",
      "Sessão autenticada usada para carregar o perfil ativo em public.perfis.",
      "Abertura, histórico, registro técnico e evidências passam a usar o usuário logado.",
      "RLS operacional reforçada para usuários authenticated sem service_role no client.",
    ],
    correcoes: [
      "Remoção de IDs fixos de operador, técnico e usuário de histórico nas ações do chamado.",
    ],
  },
  {
    versao: "v0.4.0",
    data: "27/04/2026",
    alteracoes: [
      "Status de chamados padronizados para o fluxo operacional completo.",
      "Abertura de chamados com categoria, ativo, complemento, marca e modelo.",
      "Detalhe do chamado passa a permitir alteração de status com histórico.",
      "Evidências reforçadas com upload por chamado e exibição de tipo, legenda e link.",
    ],
    correcoes: [
      "Listagem de chamados ajustada para exibir todos os status atuais e novos campos.",
    ],
  },
  {
    versao: "v0.3.0",
    data: "27/04/2026",
    alteracoes: [
      "Inclusão do papel analista no fluxo de perfis e permissões.",
      "Migrations para atualizar o ENUM papel_usuario e semear Jardel/Fabiana.",
      "Permissões de chamados alinhadas para admin, gestor, analista, técnico e operador.",
      "Formulário de chamados passa a usar perfis cadastrados no Supabase como fonte de usuários.",
    ],
    correcoes: [
      "Remoção da equivalência indevida entre admin e analista no formulário.",
    ],
  },
  {
    versao: "v0.2.0",
    data: "27/04/2026",
    alteracoes: [
      "Abertura de chamados com campos ITIL enxutos.",
      "Prioridade calculada automaticamente por impacto e urgência.",
      "Simulação inicial de papéis: cliente, analista e técnico.",
      "Upload múltiplo de evidências com remoção individual e drag and drop.",
      "Cores operacionais para status e prioridade.",
      "Botão mobile fixo para abrir novo chamado.",
      "Versionamento visível em todas as telas.",
    ],
    correcoes: [
      "Correção da ausência do botão Novo chamado no mobile.",
      "Organização das evidências por chamado no Storage.",
    ],
  },
  {
    versao: "v0.1.0",
    data: "25/04/2026",
    alteracoes: [
      "Listagem inicial de chamados integrada ao Supabase.",
      "Página de detalhe do chamado.",
      "Primeiro formulário de abertura de chamados.",
    ],
    correcoes: [],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Atualizações
          </p>
          <h1 className="mt-2 text-2xl font-bold">Changelog</h1>
          <p className="mt-2 text-sm text-gray-600">
            Versão atual: {APP_VERSION} publicada em {APP_UPDATED_AT}.
          </p>

          <div className="mt-6 space-y-6">
            {versoes.map((item) => (
              <article key={item.versao} className="rounded-lg border p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold">{item.versao}</h2>
                  <p className="text-sm text-gray-500">{item.data}</p>
                </div>

                <h3 className="mt-4 text-sm font-semibold">Alterações</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {item.alteracoes.map((alteracao) => (
                    <li key={alteracao}>{alteracao}</li>
                  ))}
                </ul>

                {item.correcoes.length > 0 && (
                  <>
                    <h3 className="mt-4 text-sm font-semibold">Correções</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {item.correcoes.map((correcao) => (
                        <li key={correcao}>{correcao}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
