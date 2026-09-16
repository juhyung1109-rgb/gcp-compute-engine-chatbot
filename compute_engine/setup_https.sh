#!/bin/bash
set -ex

# 1. Update .env to PORT=3001
sed -i 's/PORT=3000/PORT=3001/g' /opt/chatbot/.env
systemctl restart chatbot.service

# 2. Wait for Node.js to be up on 3001
sleep 2
curl -s http://127.0.0.1:3001/api/config

# 3. Clean up iptables redirect
iptables -t nat -F PREROUTING

# 4. Configure Nginx with SSL for port 443 & 3000
cat << 'EOF_NGINX' > /etc/nginx/sites-available/chatbot
# HTTP Redirect to HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://104.197.160.233.sslip.io$request_uri;
    }
}

# HTTPS on port 443 and port 3000
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    listen 3000 ssl;
    listen [::]:3000 ssl;

    server_name 104.197.160.233.sslip.io 104.197.160.233 localhost;

    ssl_certificate /etc/letsencrypt/live/104.197.160.233.sslip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/104.197.160.233.sslip.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # If plain HTTP request is sent to HTTPS port 3000 or 443
    error_page 497 =301 https://104.197.160.233.sslip.io$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        # Disable buffering for SSE streaming
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
EOF_NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/chatbot

# Test Nginx syntax and reload
nginx -t
systemctl restart nginx

echo "HTTPS setup completed successfully!"
