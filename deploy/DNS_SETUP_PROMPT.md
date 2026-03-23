# WEPAC.pt — Configuração de Domínio e SSL

## Contexto

O site da WEPAC (Next.js) já está deployed e a correr no servidor **77.42.82.10** (porta 3003, Nginx como reverse proxy, systemd service `wepac`). O site responde em HTTP no servidor mas ainda não é acessível via wepac.pt porque o DNS não está apontado.

O domínio **wepac.pt** está registado no **dominios.pt** (nameservers: dns1-4.host-redirect.com).

Este servidor já serve outros sites — não alterar nenhuma outra configuração nginx.

---

## Passo 1 — Configurar DNS no dominios.pt

1. Fazer login em https://www.dominios.pt com as credenciais WEPAC
2. Ir à gestão do domínio **wepac.pt** → zona DNS
3. Criar ou editar os seguintes registos:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **A** | `@` | `77.42.82.10` | 3600 |
| **A** | `www` | `77.42.82.10` | 3600 |

4. Se existirem registos A antigos para outro IP → apagar ou substituir
5. Se existir um CNAME em `www` → apagar (não pode coexistir com A record)
6. Se existir parking/redirect activo do dominios.pt → desactivar
7. Guardar alterações

### Verificar propagação

```bash
dig wepac.pt A +short
# Deve retornar: 77.42.82.10

dig www.wepac.pt A +short
# Deve retornar: 77.42.82.10
```

Propagação: geralmente <1h, pode ir até 24h.

---

## Passo 2 — Obter certificado SSL (após DNS propagado)

```bash
ssh deploy@77.42.82.10

sudo certbot certonly --webroot \
  -w /var/www/wepac/shared/public \
  -d wepac.pt -d www.wepac.pt \
  --non-interactive --agree-tos \
  --email admin@rvs.solutions
```

---

## Passo 3 — Activar HTTPS no Nginx

```bash
sudo tee /etc/nginx/sites-available/wepac > /dev/null << 'NGINX'
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

sudo nginx -t && sudo systemctl reload nginx
```

---

## Passo 4 — Verificação final

- [ ] `https://wepac.pt` → mostra o site WEPAC (fundo preto, "Sons que inspiram")
- [ ] `https://www.wepac.pt` → redirige para `https://wepac.pt`
- [ ] Cadeado SSL verde no browser
- [ ] `https://staging.weddingmagic.rvs.solutions` → continua a funcionar (não tocar)
- [ ] `https://agents.rvs.solutions` → continua a funcionar (não tocar)

---

## Referência

| Item | Valor |
|------|-------|
| Servidor | 77.42.82.10 (Hetzner VPS) |
| User SSH | deploy |
| App | Next.js 16 standalone |
| Porta | **3003** |
| Systemd service | `wepac` |
| Nginx config | /etc/nginx/sites-available/wepac |
| Registrar | dominios.pt |
| Nameservers | dns1-4.host-redirect.com |

**IMPORTANTE:** Este servidor serve múltiplos sites. NÃO alterar nenhum outro ficheiro nginx nem reiniciar outros serviços.
