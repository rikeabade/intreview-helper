# Intreview

Simulador de entrevistas técnicas, **100% local**, personalizado por vaga: você informa a empresa, a Job Description e seu CV, e o Intreview pesquisa como aquela empresa costuma conduzir entrevistas antes de simular uma com você — com perguntas adaptativas, feedback e um relatório final.

O app e o LLM rodam na sua máquina; as únicas chamadas à internet são as buscas opcionais (pesquisa da empresa e Job Search) e o carregamento do editor de código a partir de uma CDN (veja [SECURITY.md](./SECURITY.md)). Veja [GLOSSARY.md](./GLOSSARY.md) para o vocabulário do domínio e [docs/adr/](./docs/adr/) para decisões arquiteturais.

## Setup rápido

Se você está em Linux ou macOS, depois de clonar o repositório basta:

```bash
./scripts/setup.sh
```

Esse script checa o Node, instala o Ollama se precisar, detecta a VRAM/RAM da sua máquina pra recomendar o melhor modelo, baixa o modelo, e cria o `.env.local`. Depois é só preencher a chave da Tavily (passo 2 abaixo) e rodar `npm run dev`.

Se preferir fazer manualmente, ou estiver no Windows, siga os passos abaixo.

### 1. Ollama (LLM local)

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
# ou baixe o app em https://ollama.com/download
```

**Windows:** instale via WSL2 (recomendado — GPU e desempenho melhores) ou use o instalador nativo em https://ollama.com/download/windows.
Pra usar WSL2: abra um terminal Ubuntu (WSL) e siga os passos de Linux acima dentro dele. O resto do setup (Node, `npm run dev`) também roda dentro do WSL2.

Depois de instalado, baixe o modelo recomendado:

```bash
ollama pull gemma4:12b
```

Modelos que testamos com o Intreview (mesmo prompt real de uma vaga, numa Radeon RX 7700 XT de 12 GB, janela de contexto de 8192):

| Modelo | Tamanho | Resultado do teste |
|---|---|---|
| `gemma4:12b` (**padrão**) | ~8 GB | Cabe 100% na GPU (mesmo com 16384 de contexto), ~56–60 tokens/s. Perguntas personalizadas pelo CV, feedback específico, respeita o idioma pedido. |
| `qwen2.5:14b-instruct` | ~9 GB | Funciona (~36 tokens/s), mas as perguntas ficam mais genéricas. |
| `qwen3.5:9b` | ~6,6 GB | Rápido e específico, mas respondeu em português quando a interface estava em inglês. Não recomendado. |
| `gemma4:26b` | ~17 GB | Não cabe em 12 GB: ~4 tokens/s com parte na CPU, ~45 s por pergunta e relatórios de vários minutos. Não recomendado para 12 GB. |

Modelos **não testados** (use por conta própria): `gemma4:e4b` e `gemma4:e2b` para GPUs com menos de 12 GB. O `./scripts/setup.sh` escolhe um modelo pela memória detectada e avisa quando ele não foi testado. Confira também a licença do modelo na página dele em https://ollama.com/library.

A janela de contexto padrão do Ollama (4096 tokens) é pequena demais: o prompt do Intreview (vaga + CV + dossiê + conversa) passa disso e o início era cortado em silêncio. O app usa 8192 por padrão; ajuste com `OLLAMA_NUM_CTX` no `.env.local` se a sua memória permitir mais.

**Tempo limite.** O app espera a resposta completa do modelo (sem streaming). Respostas longas, como o relatório final, podem demorar em modelos lentos ou que usam CPU. O Intreview aguarda até 15 minutos por chamada (`OLLAMA_TIMEOUT_MS`, em milissegundos) e, se esse prazo estourar, mostra uma mensagem pedindo um modelo menor ou um prazo maior. O limite de 5 minutos do `fetch` do Node foi removido de propósito: ele cortava gerações legítimas de modelos grandes e aparecia, de forma enganosa, como "não foi possível conectar ao Ollama".

Se tiver GPU AMD no Linux e o Ollama não detectá-la automaticamente, tente:
```bash
export HSA_OVERRIDE_GFX_VERSION=11.0.0
```
(adicione ao `.bashrc`/`.zshrc` se precisar sempre).

### 2. Tavily Search API (opcional — só pra etapa de pesquisa)

Crie uma chave gratuita, sem cartão de crédito (1000 créditos/mês), em https://tavily.com/. Sem essa chave o app funciona normalmente, só sem a etapa de pesquisa da empresa.

### 3. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `TAVILY_API_KEY` no `.env.local`. Ajuste `OLLAMA_MODEL` se baixou um modelo diferente do padrão.

### 4. Instalar e rodar

```bash
npm install
npm run dev
```

Abra http://127.0.0.1:3000.

> O servidor escuta **só em `127.0.0.1`** (os scripts `dev` e `start` já passam `-H 127.0.0.1`) e o app **não tem autenticação**: use o endereço `127.0.0.1` e não exponha a porta na rede, em um túnel ou em um proxy reverso sem antes colocar autenticação na frente. Detalhes em [SECURITY.md](./SECURITY.md).

## Como funciona

1. **Nova vaga** (`/roles/new`): cole ou envie (PDF/TXT) a Job Description e seu CV, informe a empresa e, se for consultoria, o cliente.
2. **Pesquisar**: na página da vaga, dispara uma busca (Tavily Search) sobre como a empresa conduz entrevistas técnicas, resumida pelo LLM local num Research Dossier. O resultado fica em `data/<empresa>/<vaga>/research-dossier.md` — edite esse arquivo à vontade pra remover fontes ruins, depois clique em "Recarregar do arquivo".
3. **Iniciar entrevista**: escolha as fases (Comportamental, Técnico, System Design, Live Coding) e quantas perguntas por fase. O entrevistador (LLM local) adapta as perguntas com base na JD, no CV e no Research Dossier, dando feedback inline a cada resposta.
4. **Relatório final**: ao concluir todas as fases, um Report é gerado e salvo junto com o Transcript completo em `data/<empresa>/<vaga>/sessions/<id>.md`.

Todos os dados ficam em `data/` (fora do git, nunca commitado — veja [SECURITY.md](./SECURITY.md)).

## Segurança e privacidade

Leia [SECURITY.md](./SECURITY.md) antes de usar com dados reais — resume o que sai da sua máquina (buscas opcionais na Tavily e nos quadros de vagas Greenhouse, Lever e Ashby, e o carregamento do editor Monaco pela CDN jsDelivr), o que o app não protege (não há autenticação) e como seus dados ficam protegidos contra commit acidental.

## Licença

[MIT](./LICENSE).
