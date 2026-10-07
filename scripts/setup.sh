#!/usr/bin/env bash
# Intreview setup: checks dependencies, detects hardware, recommends and pulls a
# compatible Ollama model, and prepares .env.local.
#
# Works natively on Linux and macOS. On Windows, run it inside WSL2 (see the README).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Intreview setup =="
echo

# --- 1. Node/npm ---
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found. Install version 20+ before continuing: https://nodejs.org/"
  exit 1
fi
echo "Node.js: $(node --version)"

if [ ! -d node_modules ]; then
  echo "Installing dependencies (npm install)..."
  npm install
else
  echo "node_modules already exists, skipping npm install (run 'npm install' manually to update)."
fi

# --- 2. Ollama ---
if ! command -v ollama >/dev/null 2>&1; then
  echo
  echo "Ollama not found. Install it with:"
  echo "  curl -fsSL https://ollama.com/install.sh | sh"
  echo "(on macOS you can also download the app from https://ollama.com/download)"
  exit 1
fi
echo "Ollama found: $(ollama --version 2>&1 | head -1)"

# --- 3. Detect hardware capacity (VRAM or RAM) in GB ---
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

  # AMD GPUs (amdgpu) expose total VRAM through sysfs, no ROCm install needed.
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
echo "Detected memory (GPU VRAM, or system RAM if no dedicated GPU was found): ${gb}GB"

if [ "$gb" -ge 12 ]; then
  model="gemma4:12b"
elif [ "$gb" -ge 8 ]; then
  model="gemma4:e4b"
  echo "Warning: with less than 12GB the recommended model (gemma4:12b) is a tight fit; $model is a smaller alternative and has NOT been tested with Intreview."
elif [ "$gb" -gt 0 ]; then
  model="gemma4:e2b"
  echo "Warning: $model is a small model and has NOT been tested with Intreview; expect more generic questions."
else
  echo "Could not detect memory automatically, using the default model (gemma4:12b)."
  model="gemma4:12b"
fi

echo "Recommended model: $model"
echo

read -r -p "Pull this model now with 'ollama pull $model'? [Y/n] " answer
answer=${answer:-Y}
if [[ "$answer" =~ ^[Yy]$ ]]; then
  ollama pull "$model"
else
  echo "Skipping the download. Run it manually later: ollama pull $model"
fi

# --- 4. .env.local ---
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  sed -i.bak "s/^OLLAMA_MODEL=.*/OLLAMA_MODEL=${model}/" .env.local && rm -f .env.local.bak
  echo
  echo ".env.local created with OLLAMA_MODEL=${model}."
  echo "TAVILY_API_KEY still needs to be filled in: create a free key (no card) at https://tavily.com/"
  echo "and paste it into .env.local (optional: it is only used by the research and job-search steps; the interview works without it)."
else
  echo
  echo ".env.local already exists, leaving it alone."
fi

# --- 5. git hooks ---
if [ -d .git ]; then
  git config core.hooksPath scripts/git-hooks
  echo
  echo "Pre-commit hook enabled (blocks accidental commits of data/ and .env* files)."
fi

echo
echo "All set. Run 'npm run dev' and open http://127.0.0.1:3000"
