#!/bin/bash
# =============================================================
# WEPAC.pt — SSL + Nginx Setup
# Correr no terminal local com: bash wepac-ssl-setup.sh
# Ou dar a este script ao Claude CLI: claude "corre o script wepac-ssl-setup.sh"
# =============================================================

set -euo pipefail

SERVER="deploy@77.42.82.10"
DOMAIN="wepac.pt"

echo "🔒 Passo 2: Obter certificado SSL..."
ssh "$SERVER" "sudo certbot certonly --webroot \
  -w /var/www/wepac/shared/public \
  -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos \
  --email admin@rvs.solutions"

echo "✅ Certificado SSL obtido."

echo "🌐 Passo 3: Configurar HTTPS no Nginx..."
ssh "$SERVER" "sudo tee /etc/nginx/sites-available/wepac > /dev/null" << 'NGINX'
upstream wepac_node {
    server 127.0.0.1:3003;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name wepac.pt www.wepac.pt;

    location /.well-known/acme-challenge/ {
        root /var/www/wepac/shared/public;
    }

    location / {
        return 301 https://wepac.pt$request_uri;
    }
}

# www → non-www redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.wepac.pt;

    ssl_certificate /etc/letsencrypt/live/wepac.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wepac.pt/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://wepac.pt$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wepac.pt;

    ssl_certificate /etc/letsencrypt/live/wepac.pt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wepac.pt/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/wepac/current/public;

    access_log /var/log/nginx/wepac_access.log;
    error_log /var/log/nginx/wepac_error.log;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /_next/static/ {
        alias /var/www/wepac/current/.next/static/;
        expires max;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://wepac_node;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

echo "✅ Nginx configurado."

echo "🔍 A testar configuração Nginx..."
ssh "$SERVER" "sudo nginx -t && sudo systemctl reload nginx"

echo "✅ Nginx recarregado."

echo ""
echo "============================================"
echo "🎉 DONE! Verifica:"
echo "  https://wepac.pt"
echo "  https://www.wepac.pt"
echo "============================================"
