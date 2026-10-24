# SchoolNext ERP — Self-Managed Ubuntu Server Deployment Guide

## 1. Operating System & Server Requirements

- **OS**: Ubuntu 22.04 LTS or 24.04 LTS (x86_64)
- **RAM**: Minimum 2 GB (4 GB recommended)
- **CPU**: 2 vCPUs minimum
- **Disk**: 25 GB SSD minimum
- **Node.js**: v20.x or v22.x LTS (installed via NodeSource)
- **Database**: MySQL Server 8.0+ or MariaDB 10.6+
- **Process Manager**: PM2 (`npm install -g pm2`)
- **Reverse Proxy**: Nginx with Certbot (Let's Encrypt SSL)

---

## 2. Server Provisioning & Packages

```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git ufw certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2
```

---

## 3. MySQL Database Setup

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Configure database & least-privilege user
sudo mysql -u root
```

Inside MySQL console:
```sql
-- Ensure InnoDB is default
SET GLOBAL default_storage_engine = InnoDB;

-- Create production database
CREATE DATABASE schoolnext_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated least-privilege user
CREATE USER 'schoolnext_app'@'127.0.0.1' IDENTIFIED BY 'StrongRandomProductionPassword!2026';
GRANT ALL PRIVILEGES ON schoolnext_prod.* TO 'schoolnext_app'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. Application Deployment

Clone the repository to `/var/www/schoolnext`:

```bash
sudo mkdir -p /var/www/schoolnext
sudo chown -R $USER:$USER /var/www/schoolnext
cd /var/www/schoolnext

# Clone your repository
git clone <repository_url> .

# Setup backend production environment
cp backend/.env.example backend/.env
nano backend/.env
```

Ensure production values in `backend/.env`:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="mysql://schoolnext_app:StrongRandomProductionPassword!2026@127.0.0.1:3306/schoolnext_prod"
JWT_ACCESS_SECRET="<generate_secure_random_64_char_string>"
JWT_REFRESH_SECRET="<generate_another_secure_random_64_char_string>"
COOKIE_SECRET="<generate_secure_random_cookie_secret>"
CORS_ORIGIN="https://erp.yourdomain.com"
COOKIE_DOMAIN=".yourdomain.com"
COOKIE_SECURE="true"
```

Install dependencies and build:
```bash
# Install backend dependencies
npm --prefix backend install --omit=dev

# Generate Prisma Client & apply migrations
cd backend
npx prisma generate
npx prisma migrate deploy

# Seed production baseline plans & super admin (never run demo seed in production!)
# Run specific production setup scripts
cd ..

# Install frontend dependencies and build Next.js
npm --prefix frontend install
npm --prefix frontend run build
```

---

## 5. PM2 Process Management

Create `ecosystem.config.cjs` in `/var/www/schoolnext`:

```javascript
module.exports = {
  apps: [
    {
      name: 'schoolnext-backend',
      cwd: './backend',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'schoolnext-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

Start and persist with PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 6. Nginx Reverse Proxy & SSL

Create `/etc/nginx/sites-available/schoolnext`:

```nginx
server {
    server_name erp.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Backend API routing
    location /api/v1/ {
        proxy_pass http://127.0.0.1:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend Next.js routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & configure SSL:
```bash
sudo ln -s /etc/nginx/sites-available/schoolnext /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free Let's Encrypt certificate
sudo certbot --nginx -d erp.yourdomain.com
```

---

## 7. Firewall (UFW) Configuration

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 8. Automated Daily MySQL Backup

Create `/usr/local/bin/backup-schoolnext.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

mysqldump -u schoolnext_app -p'StrongRandomProductionPassword!2026' schoolnext_prod | gzip > "$BACKUP_DIR/schoolnext_prod_$TIMESTAMP.sql.gz"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
```

Add to cron (`sudo crontab -e`):
```cron
0 2 * * * /usr/local/bin/backup-schoolnext.sh > /dev/null 2>&1
```
