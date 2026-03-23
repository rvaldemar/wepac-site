#!/bin/bash
# ==============================================================================
# Server Setup Script for WEPAC
# ==============================================================================
# Run this on the server BEFORE first deploy:
#   ssh deploy@77.42.82.10 'bash -s' < deploy/server_setup.sh
# ==============================================================================

set -e

APP_NAME="wepac"
APP_DIR="/var/www/${APP_NAME}"
DOMAIN="wepac.pt"

echo "=== Setting up ${APP_NAME} on server ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"

# Create directory structure
echo "Creating directory structure..."
sudo mkdir -p ${APP_DIR}/{shared,releases}
sudo mkdir -p ${APP_DIR}/shared/public
sudo chown -R deploy:deploy ${APP_DIR}

# Install systemd service
echo "Installing systemd service..."
cat > /tmp/wepac.service << 'EOF'
[Unit]
Description=WEPAC Next.js Website
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/var/www/wepac/current
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3003
Environment=HOSTNAME=0.0.0.0
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wepac
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/wepac.service /etc/systemd/system/wepac.service
sudo systemctl daemon-reload
sudo systemctl enable wepac

# Setup nginx (HTTP only first, for certbot)
echo "Setting up nginx (HTTP only for certbot)..."
sudo tee /etc/nginx/sites-available/${APP_NAME} > /dev/null << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${APP_DIR}/shared/public;
    }

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Point DNS for ${DOMAIN} and www.${DOMAIN} to this server (77.42.82.10)"
echo "2. Run first deploy: ./deploy/deploy.sh"
echo "3. Get SSL certificate:"
echo "   sudo certbot certonly --webroot -w ${APP_DIR}/shared/public -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@rvs.solutions"
echo "4. Update nginx to full HTTPS config:"
echo "   sudo cp ${APP_DIR}/current/deploy/nginx.conf /etc/nginx/sites-available/${APP_NAME}"
echo "   sudo nginx -t && sudo systemctl reload nginx"
