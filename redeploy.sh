#!/bin/bash
set -e

echo "============================================"
echo "  FULL CLEAN REDEPLOY - Nama Medical Web"
echo "============================================"

echo ""
echo "=== [1/5] Stopping app ==="
pm2 stop namaweb 2>/dev/null || true
pm2 delete namaweb 2>/dev/null || true

echo ""
echo "=== [2/5] Dropping & recreating database ==="
sudo -u postgres psql -c "DROP DATABASE IF EXISTS nama_medical_web;"
sudo -u postgres psql -c "CREATE DATABASE nama_medical_web OWNER postgres;"
echo "Database recreated!"

echo ""
echo "=== [3/5] Cleaning old files ==="
rm -rf /var/www/namaweb
mkdir -p /var/www/namaweb

echo ""
echo "=== [4/5] Copying new files ==="
cp -r /tmp/namawab_upload/* /var/www/namaweb/
cd /var/www/namaweb

# Create .env from example
cp .env.example .env
echo "Created .env from .env.example"
cat .env

echo ""
echo "=== [5/5] Installing & Starting ==="
npm install
pm2 start server.js --name namaweb
pm2 save
sleep 4
pm2 logs namaweb --lines 20 --nostream
echo ""
pm2 list

echo ""
echo "============================================"
echo "  REDEPLOY COMPLETE!"
echo "  http://46.224.178.153"
echo "============================================"
