#!/bin/bash
# ==============================================================================
# Interactive Stripe keys setup for WEPAC bilheteira.
#
# Run ON THE SERVER. Prompts for the 3 Stripe keys, validates the format,
# writes them to /var/www/wepac/shared/.env.production, and restarts wepac.
#
# The keys are typed into the remote TTY — the operator's local machine and
# any intermediary tool (including Claude Code) never see them.
#
# Usage locally (one-liner):
#   scp deploy/set-stripe-keys.sh deploy@77.42.82.10:/tmp/ \
#     && ssh -t deploy@77.42.82.10 'bash /tmp/set-stripe-keys.sh; rm -f /tmp/set-stripe-keys.sh'
# ==============================================================================

set -euo pipefail

ENV_FILE="/var/www/wepac/shared/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE não existe. Abortado."
  exit 1
fi

echo "━━━ Stripe keys → $ENV_FILE ━━━"
echo ""

# Check for existing entries
EXISTING=$(grep -c "^STRIPE_" "$ENV_FILE" 2>/dev/null || echo "0")
if [ "$EXISTING" -gt 0 ]; then
  echo "⚠  Já existem $EXISTING entradas STRIPE_* neste ficheiro."
  read -r -p "   Substituir? (y/N): " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "   Cancelado."
    exit 0
  fi
  # Remove previous Stripe lines (and the "# Stripe ..." comment above them if present)
  sed -i '/^# Stripe /d' "$ENV_FILE"
  sed -i '/^STRIPE_SECRET_KEY=/d' "$ENV_FILE"
  sed -i '/^STRIPE_PUBLISHABLE_KEY=/d' "$ENV_FILE"
  sed -i '/^STRIPE_WEBHOOK_SECRET=/d' "$ENV_FILE"
  echo "   Entradas antigas removidas."
  echo ""
fi

# Prompt helper: asks for one key at a time, validates format, confirms receipt
# with a masked preview, re-prompts on invalid input.
# Args: 1) label   2) regex   3) variable name to store the result
prompt_key() {
  local label="$1"
  local regex="$2"
  local var_name="$3"
  local val=""
  while true; do
    printf "  %s: " "$label" >&2
    read -r -s val
    printf "\n" >&2
    val="$(echo -n "$val" | tr -d '[:space:]')"
    if [[ -z "$val" ]]; then
      echo "    ✗ vazio — tenta de novo" >&2
      continue
    fi
    if [[ ! "$val" =~ $regex ]]; then
      echo "    ✗ formato inválido (esperado: $regex) — tenta de novo" >&2
      continue
    fi
    # Masked preview: first 10 chars + … + last 4
    local preview="${val:0:10}…${val: -4}"
    echo "    ✓ recebida ($preview)" >&2
    echo "" >&2
    printf -v "$var_name" '%s' "$val"
    return 0
  done
}

echo "Cola cada chave quando pedida (input escondido, Enter para confirmar)."
echo "Pressiona Ctrl+C para abortar a qualquer momento."
echo ""

prompt_key "STRIPE_SECRET_KEY (sk_test_... / sk_live_...)" "^sk_(test|live)_[A-Za-z0-9]+$" STRIPE_SECRET_KEY
prompt_key "STRIPE_PUBLISHABLE_KEY (pk_test_... / pk_live_...)" "^pk_(test|live)_[A-Za-z0-9]+$" STRIPE_PUBLISHABLE_KEY
prompt_key "STRIPE_WEBHOOK_SECRET (whsec_...)" "^whsec_[A-Za-z0-9]+$" STRIPE_WEBHOOK_SECRET

# Test-mode vs live coherence
sk_mode=""
pk_mode=""
[[ "$STRIPE_SECRET_KEY" == sk_test_* ]] && sk_mode="test"
[[ "$STRIPE_SECRET_KEY" == sk_live_* ]] && sk_mode="live"
[[ "$STRIPE_PUBLISHABLE_KEY" == pk_test_* ]] && pk_mode="test"
[[ "$STRIPE_PUBLISHABLE_KEY" == pk_live_* ]] && pk_mode="live"

if [[ "$sk_mode" != "$pk_mode" ]]; then
  echo "⚠  Secret ($sk_mode) e Publishable ($pk_mode) em modos diferentes."
  read -r -p "   Continuar mesmo assim? (y/N): " answer
  [[ ! "$answer" =~ ^[Yy]$ ]] && { echo "Abortado."; exit 1; }
fi

# Detect mode for the comment header
MODE="test"
[[ "$STRIPE_SECRET_KEY" == sk_live_* ]] && MODE="LIVE"

# Append (use printf to avoid interpreting `_` etc.)
{
  printf '\n'
  printf '# Stripe (bilheteira) — %s — set %s\n' "$MODE" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  printf 'STRIPE_SECRET_KEY=%s\n' "$STRIPE_SECRET_KEY"
  printf 'STRIPE_PUBLISHABLE_KEY=%s\n' "$STRIPE_PUBLISHABLE_KEY"
  printf 'STRIPE_WEBHOOK_SECRET=%s\n' "$STRIPE_WEBHOOK_SECRET"
} >> "$ENV_FILE"

echo "✓ Escrito em $ENV_FILE (modo: $MODE)"
echo ""

# Restart
echo "A reiniciar wepac..."
sudo systemctl restart wepac
sleep 2

if systemctl is-active --quiet wepac; then
  echo "✓ wepac está a correr"
else
  echo "✗ wepac NÃO arrancou — verifica:"
  echo "  sudo journalctl -u wepac --since '1 minute ago' --no-pager -q"
  exit 1
fi

echo ""
echo "━━━ Concluído ($MODE mode) ━━━"
echo ""
echo "Próximo passo:"
echo "  1. https://wepac.pt/bilheteira/signup com o teu @wepac.pt"
echo "  2. Admin → A Voz da Ibéria Antiga → colar Price IDs nas tiers"
echo "  3. Testar reserva com cartão 4242 4242 4242 4242 (test mode)"
