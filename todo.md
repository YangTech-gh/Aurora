# Project TODO

- [x] Definir a direção visual elegante e refinada do editor, com tema escuro, tipografia editorial e acentos violeta/menta.
- [x] Implementar a estrutura principal do editor com barra superior, biblioteca, canvas, painel de propriedades e árvore de camadas.
- [x] Implementar canvas com seleção visual de elementos, arrastar, soltar, reposicionar e redimensionar.
- [x] Implementar biblioteca inicial de seções, textos, botões, imagens, contêineres e layouts reutilizáveis.
- [x] Implementar painel de propriedades para conteúdo, dimensões, espaçamento, tipografia, cores e posicionamento.
- [x] Implementar árvore de camadas para seleção, hierarquia e organização dos componentes.
- [x] Implementar modos de breakpoint para desktop, tablet e mobile com overrides visuais.
- [x] Integrar GSAP 3.15 para pré-visualização e configuração inicial de animações.
- [x] Implementar ajustes inteligentes de layout e sincronização com o modelo de página.
- [x] Implementar persistência de projetos, páginas, componentes e configurações responsivas.
- [x] Implementar painel de código com exportação inicial em HTML/CSS, Vue, React e Svelte.
- [x] Adicionar testes Vitest para exportação e modelo de página.
- [x] Validar o editor em desktop e viewport mobile, corrigindo erros de build e interação.

## Validation follow-ups

- [x] Posicionar novos componentes no ponto real de drop do canvas usando as coordenadas do evento.
- [x] Adicionar controles completos de cor no inspector, incluindo foreground/text color além do background.
- [x] Implementar reordenação real na árvore de camadas com atualização da hierarquia/modelo.
- [x] Criar lógica real de smart layout, snapping e auto-adjust durante drag, resize e inserção.
- [x] Conectar carregamento e listagem de projetos via tRPC, persistir projectId e tratar loading/erro no save remoto.
- [x] Corrigir os geradores de código para produzir saídas válidas para Vue, React e Svelte e ampliar os testes.

## Final quality follow-ups

- [x] Implementar reordenação de camadas entre diferentes níveis e pais, atualizando a hierarquia completa do modelo.
- [x] Adicionar estado de loading para o save remoto, com botão desabilitado e feedback visual durante a operação.
- [x] Ampliar os testes de exportação para validar atributos específicos de Vue, React e Svelte, incluindo class/className, :style/style e conteúdo.

## Last validation fixes

- [x] Validar o editor em viewport mobile real, por exemplo 390x844, revisando canvas e controles.
- [x] Corrigir a reinserção de camadas ao mover entre pais e adicionar cobertura de teste para essa operação.

## Layer reorder coverage

- [x] Adicionar teste Vitest que mova uma camada removida entre pais ao soltá-la sobre um alvo não-container, validando a reinserção correta e a ordem final.

## Second review and expansion

- [x] Auditar a implementação entregue, localizar regressões e revisar todos os fluxos principais do editor.
- [x] Importar projetos a partir de pasta local usando seleção de diretório e reconstruir páginas/arquivos reconhecidos.
- [x] Importar projetos públicos diretamente de URLs do GitHub com validação, limite de tamanho e parsing seguro.
- [x] Persistir origem do projeto, framework detectado, arquivos importados e metadados de exportação.
- [x] Adicionar componentes avançados à biblioteca: carrossel, formulário completo, vídeo, vídeo scrub, grid, navbar e card.
- [x] Expandir o inspector com conteúdo, estados, dimensões, constraints, layout, spacing, tipografia, cores, borders, shadows, assets e acessibilidade.
- [x] Implementar vídeo scrub no canvas com timeline, seek, play/pause e preview responsivo.
- [x] Detectar HTML, Vue, React e Svelte a partir de arquivos importados e adaptar o contrato de componentes/GSAP.
- [x] Implementar presets e snippets GSAP contextuais por framework, incluindo plugins e lifecycle adequado.
- [x] Conectar upload e gerenciamento de assets ao storage persistente, sem manter bytes no banco.
- [x] Revisar exportadores para preservar origem, atributos, estilos, animações e componentes avançados por framework.
- [x] Ampliar testes unitários e de integração para importação, detecção, vídeo scrub, GSAP e exports.
- [x] Fazer revisão visual e validação final em desktop e mobile, corrigindo build, console e usabilidade.

## Audit gaps to resolve

- [x] Reconstruir de fato páginas e nós a partir de arquivos importados de pasta ou GitHub, em vez de apenas aplicar metadados ao starter project.
- [x] Adicionar ao inspector controles reais de constraints, states, assets e acessibilidade.
- [x] Adicionar play/pause explícito ao scrub-video e cobrir o comportamento com teste.
- [x] Implementar tratamento distinto para lifecycle onEnter nos snippets GSAP e validar plugins/lifecycles por framework.
- [x] Criar gerenciamento de assets persistidos com listagem, reuso e seleção no painel Assets.
- [x] Corrigir exports avançados por framework, especialmente atributos JSX/React, e ampliar testes específicos desses blocos.
- [x] Adicionar testes para importação local/GitHub, upload/storage e vídeo scrub.
- [x] Eliminar warnings de runtime no browser e revalidar desktop/mobile após a correção.

## Evidence gaps before checkpoint

- [x] Adicionar teste do fluxo play/pause de scrub-video e sincronização do estado mediaPlaying.
- [x] Adicionar teste do endpoint projects.uploadAsset com mock de storagePut para sucesso e rejeição por tamanho.
- [x] Adicionar teste adicional de seek atualizando um HTMLVideoElement mockado além do clamp.
- [x] Limpar ou isolar a evidência de runtime e confirmar ausência de warnings/errors novos depois da correção de keys.

## Final evidence isolation

- [x] Extrair um helper de transição do estado mediaPlaying e testar a sequência play→pause usada pelo editor.
- [x] Capturar uma janela de runtime nova e isolada após o último reload, sem depender dos warnings históricos do browserConsole.log.

## Third review: full quality pass

- [x] Auditar feature-by-feature: canvas, drag/drop, resize, snapping, layers, pages, assets, importação, persistência, inspector, exports e runtime.
- [x] Consultar a documentação oficial GSAP 3.15 e registrar APIs, plugins, contexts e lifecycles aplicáveis ao editor.
- [x] Confirmar a versão real instalada do GSAP e alinhar tipos, imports e contratos de plugins.
- [x] Revisar breakpoints desktop/tablet/mobile com presets editáveis e overrides por nó sem perda de estilos.
- [x] Permitir editar o breakpoint Mobile com canvas, seleção, drag, resize, snapping, constraints e preview próprios.
- [x] Melhorar o painel de breakpoints com valores de viewport, escala, orientação e indicador do override ativo.
- [x] Expandir todos os componentes da biblioteca com props, estados, conteúdo, acessibilidade e comportamento responsivo.
- [x] Completar o inspector com layout, constraints, typography, fill, borders, shadows, states, assets, motion e accessibility.
- [x] Expandir GSAP para timeline, easing, duration, delay, repeat, yoyo, stagger, scrub, plugins e cleanup por framework.
- [x] Melhorar importação local/GitHub, detecção de origem e reconstrução sem perder arquivos/metadados.
- [x] Revisar persistência, histórico, assets e isolamento por usuário.
- [x] Revisar exports HTML/CSS, Vue, React e Svelte para preservar responsividade, componentes e animações.
- [x] Criar testes feature-by-feature e validar TypeScript, Vitest, build, console e screenshots desktop/mobile.

## Third review gaps to resolve

- [x] Adicionar orientação Portrait/Landscape por breakpoint e indicador explícito de override ativo por nó e viewport.
- [x] Expandir o inspector com controles específicos para carrossel, formulário, navbar, grid, card e vídeo.
- [x] Fazer os exports serializarem breakpoints, overrides e animações do projeto inteiro em HTML/CSS, Vue, React e Svelte.
- [x] Adicionar testes para largura persistida, Motion ampliado e fluxos principais de edição Mobile no canvas.

## Final gaps from third review

- [x] Aplicar a orientação Portrait/Landscape ao viewport do canvas de forma funcional por breakpoint e mantê-la persistida.
- [x] Substituir o campo placeholder de Poster por controle real de poster de vídeo usando asset selecionável ou URL editável.
- [x] Fazer os exports HTML/Vue/React/Svelte serializarem responsividade e motion do projeto inteiro, percorrendo toda a árvore de nós aninhados.
- [x] Adicionar testes para persistência de largura/orientação por breakpoint, configuração Motion expandida e edição Mobile no canvas.

## Export and interaction evidence

- [x] Criar export HTML de projeto completo com breakpoints, orientações, overrides e motion recursivos.
- [x] Fazer os exports Vue/React/Svelte emitirem e aplicarem claramente overrides responsivos completos, não apenas um manifesto.
- [x] Adicionar testes para salvar/carregar breakpoints e breakpointOrientations editados no projeto.
- [x] Adicionar testes específicos para Motion expandido e para operações de edição Mobile no canvas.

## Final third-review evidence gaps

- [ ] Aplicar visualForgeResponsiveCss no JSX do export React usando style injection válido.
- [ ] Adicionar teste de migrateProject/load restaurando breakpoints e breakpointOrientations salvos.
- [ ] Ampliar testes focados nos campos repeat/yoyo/stagger/scrub e geração GSAP contextual.
- [ ] Adicionar testes para seleção, drag e resize no breakpoint mobile com overrides mobile.
