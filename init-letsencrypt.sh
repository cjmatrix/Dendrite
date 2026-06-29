#!/bin/bash
# init-letsencrypt.sh
# Run this ONCE on your EC2 instance to get the initial SSL certificate.
# After that, the certbot container auto-renews every 12 hours.
#
# Usage: chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh

DOMAIN="api.nurons.me"
EMAIL="cjmartingarrix@gmail.com"    # Let's Encrypt registration email
STAGING=0                          # Set to 1 for testing (avoids rate limits)

echo "### Creating required directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

echo "### Starting Nginx without SSL (for ACME challenge)..."
# Temporarily replace SSL config with a simple HTTP-only config
docker compose up -d nginx

echo "### Requesting Let's Encrypt certificate..."
if [ $STAGING -eq 1 ]; then
  STAGING_FLAG="--staging"
else
  STAGING_FLAG=""
fi

docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  $STAGING_FLAG \
  -d $DOMAIN

echo "### Reloading Nginx with SSL..."
docker compose exec nginx nginx -s reload

echo "### Done! SSL certificate installed for $DOMAIN"
