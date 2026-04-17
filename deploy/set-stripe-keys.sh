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

# Prompt (silent/hidden input)
echo "Cola as 3 chaves (input escondido, pressiona Enter após cada uma):"
echo ""

read -r -s -p "  STRIPE_SECRET_KEY (sk_test_... / sk_live_...): " STRIPE_SECRET_KEY
echo ""
read -r -s -p "  STRIPE_PUBLISHABLE_KEY (pk_test_... / pk_live_...): " STRIPE_PUBLISHABLE_KEY
echo ""
read -r -s -p "  STRIPE_WEBHOOK_SECRET (whsec_...): " STRIPE_WEBHOOK_SECRET
echo ""
echo ""

# Trim whitespace
STRIPE_SECRET_KEY="$(echo -n "$STRIPE_SECRET_KEY" | tr -d '[:space:]')"
STRIPE_PUBLISHABLE_KEY="$(echo -n "$STRIPE_PUBLISHABLE_KEY" | tr -d '[:space:]')"
STRIPE_WEBHOOK_SECRET="$(echo -n "$STRIPE_WEBHOOK_SECRET" | tr -d '[:space:]')"

# Validate format
fail=0
if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
  echo "✗ STRIPE_SECRET_KEY inválida (deve começar por sk_test_ ou sk_live_)"
  fail=1
fi
if [[ ! "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
  echo "✗ STRIPE_PUBLISHABLE_KEY inválida (deve começar por pk_test_ ou pk_live_)"
  fail=1
fi
if [[ ! "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
  echo "✗ STRIPE_WEBHOOK_SECRET inválida (deve começar por whsec_)"
  fail=1
fi

# Test-mode vs live coherence warning
if [[ "$STRIPE_SECRET_KEY" == sk_test_* && "$STRIPE_PUBLISHABLE_KEY" != pk_test_* ]] || \
   [[ "$STRIPE_SECRET_KEY" == sk_live_* && "$STRIPE_PUBLISHABLE_KEY" != pk_live_* ]]; then
  echo "⚠  Secret e Publishable estão em modos diferentes (test vs live). Continuar mesmo assim?"
  read -r -p "   (y/N): " answer
  [[ ! "$answer" =~ ^[Yy]$ ]] && exit 1
fi

if [ $fail -ne 0 ]; then
  echo ""
  echo "Abortado sem alterações."
  exit 1
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
