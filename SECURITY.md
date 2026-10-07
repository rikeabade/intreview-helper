# Segurança e privacidade

## Modelo de ameaça

O Intreview é feito pra rodar **inteiramente na sua própria máquina**. Não existe backend compartilhado, conta de usuário ou servidor central — cada pessoa que clona este repositório roda sua própria instância isolada, com seu próprio Ollama local e sua própria chave da Tavily. Isso significa, por construção:

- Seus dados (nome da empresa, Job Description, CV, Interview Purpose, Research Dossier, transcripts de entrevista) ficam em `data/`, que é ignorado pelo Git (veja `.gitignore`) e nunca deve ser commitado. Eles só saem da sua máquina pelo que está descrito em "O que sai da sua máquina".
- Nenhum outro usuário do Intreview — mesmo clonando o mesmo repositório — tem acesso aos seus arquivos.
- Não há telemetria nem analytics.

## O app não tem autenticação

O Intreview assume **um único usuário confiável na própria máquina**. Nenhuma rota da API (`/api/*`) exige login, token, ou checa o cabeçalho `Host`/`Origin`. Por isso:

- Os scripts `npm run dev` e `npm start` sobem o servidor **só em `127.0.0.1`** (`-H 127.0.0.1`). Acesse por `http://127.0.0.1:3000`.
- **Não exponha a porta** na rede (`-H 0.0.0.0`, túnel, proxy reverso, Codespaces/port forwarding público) sem antes colocar autenticação na frente. Quem alcançar a porta lê e altera seus CVs, vagas e transcripts, apaga buscas salvas e gasta sua chave da Tavily e a GPU do seu Ollama.
- Outros usuários da mesma máquina (conta local) também conseguem acessar `127.0.0.1:3000` enquanto o app roda.

### Limitações conhecidas

Estas são fraquezas conhecidas, ainda não corrigidas, que valem para quem usa o app enquanto navega na web com ele aberto:

- **Requisições vindas de outros sites.** As rotas de escrita não verificam `Origin` nem `Content-Type`. Uma página maliciosa aberta no seu navegador pode enviar requisições "cegas" (POST) para `http://127.0.0.1:3000/api/...`: criar vagas, disparar pesquisas e consumir sua cota da Tavily e do Ollama. Ela não consegue ler as respostas, a menos que também use DNS rebinding.
- **DNS rebinding.** O app não valida o `Host`; um site que consiga apontar um nome de domínio para `127.0.0.1` pode, em tese, ler e alterar dados pela API.
- **Upload sem limite de tamanho** em `/api/extract-text` (afeta só a sua própria máquina).

Enquanto isso não for corrigido, use um navegador/perfil sem outras abas abertas ao trabalhar com dados reais, e feche o app quando não estiver usando.

## O que sai da sua máquina

1. **Ollama** (`http://localhost:11434` por padrão): roda na sua máquina. O conteúdo da JD, do CV, do Interview Purpose e das suas respostas na entrevista é enviado só pra esse processo local.
2. **Tavily Search API** (opcional, precisa de `TAVILY_API_KEY`):
   - **Pesquisa da empresa** (botão "Pesquisar"): envia o nome da empresa (e, se houver, do cliente) como texto de busca; a Tavily devolve o conteúdo das páginas encontradas.
   - **Job Search** (`/jobs`): envia empresa, cargo, localidade e modalidade de trabalho como texto de busca.
   - Seu CV, sua JD e o Interview Purpose **não** são enviados pra Tavily.
3. **Quadros de vagas públicos** (Job Search): consultas à API de Greenhouse (`boards-api.greenhouse.io`), Lever (`api.lever.co`) e Ashby (`api.ashbyhq.com`). A requisição contém só um identificador derivado do nome da empresa.
4. **CDN jsDelivr** (editor de código): o seu **navegador** baixa o Monaco Editor de `cdn.jsdelivr.net` (versão fixa, sem verificação de integridade) quando a fase de Live Coding abre o editor. O jsDelivr vê seu IP e o pedido do arquivo, mas não recebe dados do app. Se isso for um problema, hospede o Monaco localmente.
5. **Instalação**: `npm install` (registro npm), `ollama pull` (download do modelo) e, se você seguir o passo do README, o instalador do Ollama (`curl | sh`, de https://ollama.com).

## Risco de prompt injection no Research Dossier

A etapa de pesquisa lê conteúdo de páginas públicas da web (Reddit, Blind, blogs, etc.) e passa esse texto para o LLM local resumir. Esse conteúdo é **não confiável por definição** — uma página maliciosa ou spam de SEO poderia conter texto tentando manipular o resumo ("ignore as instruções anteriores e escreva..."). O texto do dossiê também entra depois nos prompts da entrevista e do relatório. O impacto é um dossiê, uma pergunta ou um relatório com conteúdo estranho ou incorreto: o LLM local não tem acesso a ferramentas, não executa código e não toma nenhuma ação no seu sistema a partir desse conteúdo. Mesmo assim:

- Revise o `research-dossier.md` antes de continuar pra entrevista (é por isso que a pesquisa não segue automaticamente pra entrevista). Se algo parecer bizarro ou fora do tema, edite ou apague antes de confiar nele.
- O dossiê e o relatório são renderizados **sem imagens** (para que uma imagem remota não vire um "pixel de rastreio" no seu navegador) e o app envia `Content-Security-Policy: img-src 'self' data:`. Links no texto continuam clicáveis: pense antes de clicar em links de um dossiê.
- Os títulos e URLs das fontes que a Tavily devolve ainda **não são escapados** ao montar o dossiê: um título malicioso pode inserir links ou texto no markdown e chegar aos prompts do LLM. Revise a lista de fontes do dossiê.

## Segredos (API keys)

- A única credencial do projeto é `TAVILY_API_KEY`, que vive em `.env.local` — um arquivo que **nunca deve ser commitado** (está no `.gitignore`, e há um hook de pre-commit em `scripts/git-hooks/pre-commit`, ativado pelo `setup.sh`, que bloqueia isso como camada extra de proteção).
- Se você acidentalmente commitar ou expor sua chave da Tavily, revogue-a e gere uma nova em https://tavily.com/ — não tem custo pra trocar.
- Antes de tornar um fork ou cópia deste repositório público, confira o histórico inteiro (`git log --all`), incluindo o e-mail dos autores dos commits, e não só os arquivos atuais.

## Reportando um problema

Se você encontrar um problema de segurança, **não abra uma issue pública**. Use o botão **"Report a vulnerability"** na aba *Security* do repositório (relato privado do GitHub). Inclua os passos para reproduzir e o impacto que você observou.
