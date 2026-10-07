#!/usr/bin/env bash
# Setup do Intreview: checa dependências, detecta hardware, recomenda e baixa
# um modelo Ollama compatível, e prepara o .env.local.
#
# Funciona em Linux e macOS nativamente. No Windows, rode isso dentro do WSL2
# (veja o README para instruções).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Intreview setup =="
echo

# --- 1. Node/npm ---
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js não encontrado. Instale a versão 20+ antes de continuar: https://nodejs.org/"
  exit 1
fi
echo "Node.js: $(node --version)"

if [ ! -d node_modules ]; then
  echo "Instalando dependências (npm install)..."
  npm install
else
  echo "node_modules já existe, pulando npm install (rode 'npm install' manualmente se precisar atualizar)."
fi

# --- 2. Ollama ---
if ! command -v ollama >/dev/null 2>&1; then
  echo
  echo "Ollama não encontrado. Instale com:"
  echo "  curl -fsSL https://ollama.com/install.sh | sh"
  echo "(no Mac também dá pra baixar o app em https://ollama.com/download)"
  exit 1
fi
echo "Ollama encontrado: $(ollama --version 2>&1 | head -1)"

# --- 3. Detectar capacidade de hardware (VRAM ou RAM) em GB ---
detect_memory_gb() {
  if command -v nvidia-smi >/dev/null 2>&1; then
    local mb
    mb=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1)
    if [ -n "${mb:-}" ]; then
      echo $(( mb / 1024 ))
      return
    fi
  fi

  if command -v rocm-smi >/dev/null 2>&1; then
    local mb
    mb=$(rocm-smi --showmeminfo vram --csv 2>/dev/null | tail -1 | grep -oE '[0-9]+' | tail -1)
    if [ -n "${mb:-}" ]; then
      echo $(( mb / 1024 / 1024 ))
      return
    fi
  fi

  # GPUs AMD (amdgpu) expõem a VRAM total direto via sysfs, sem precisar do ROCm instalado.
  if ls /sys/class/drm/card*/device/mem_info_vram_total >/dev/null 2>&1; then
    local max_bytes=0
    for f in /sys/class/drm/card*/device/mem_info_vram_total; do
      local bytes
      bytes=$(cat "$f" 2>/dev/null || echo 0)
      if [ "$bytes" -gt "$max_bytes" ]; then
        max_bytes=$bytes
      fi
    done
    if [ "$max_bytes" -gt 0 ]; then
      echo $(( max_bytes / 1024 / 1024 / 1024 ))
      return
    fi
  fi

  case "$(uname -s)" in
    Darwin)
      local bytes
      bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
      echo $(( bytes / 1024 / 1024 / 1024 ))
      return
      ;;
    Linux)
      local kb
      kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
      echo $(( kb / 1024 / 1024 ))
      return
      ;;
    *)
      echo 0
      return
      ;;
  esac
}

gb=$(detect_memory_gb)
echo
echo "Memória detectada (VRAM da GPU, ou RAM do sistema se não achou GPU dedicada): ${gb}GB"

if [ "$gb" -ge 12 ]; then
  model="gemma4:12b"
elif [ "$gb" -ge 8 ]; then
  model="gemma4:e4b"
  echo "Aviso: com menos de 12GB o modelo recomendado (gemma4:12b) fica apertado; $model é uma alternativa menor e NÃO foi testada com o Intreview."
elif [ "$gb" -gt 0 ]; then
  model="gemma4:e2b"
  echo "Aviso: $model é um modelo pequeno e NÃO foi testado com o Intreview; espere perguntas mais genéricas."
else
  echo "Não consegui detectar memória automaticamente — usando o modelo padrão (gemma4:12b)."
  model="gemma4:12b"
fi

echo "Modelo recomendado: $model"
echo

read -r -p "Baixar esse modelo agora via 'ollama pull $model'? [S/n] " answer
answer=${answer:-S}
if [[ "$answer" =~ ^[Ss]$ ]]; then
  ollama pull "$model"
else
  echo "Pulando download. Rode manualmente depois: ollama pull $model"
fi

# --- 4. .env.local ---
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  sed -i.bak "s/^OLLAMA_MODEL=.*/OLLAMA_MODEL=${model}/" .env.local && rm -f .env.local.bak
  echo
  echo ".env.local criado com OLLAMA_MODEL=${model}."
  echo "Falta preencher TAVILY_API_KEY — crie uma chave gratuita (sem cartão) em https://tavily.com/"
  echo "e cole em .env.local (opcional: só é usada na etapa de pesquisa, a entrevista funciona sem ela)."
else
  echo
  echo ".env.local já existe, não mexi nele."
fi

# --- 5. git hooks ---
if [ -d .git ]; then
  git config core.hooksPath scripts/git-hooks
  echo
  echo "Hook de pre-commit ativado (bloqueia commits acidentais de data/ e .env*)."
fi

echo
echo "Tudo pronto. Rode 'npm run dev' e abra http://127.0.0.1:3000"
