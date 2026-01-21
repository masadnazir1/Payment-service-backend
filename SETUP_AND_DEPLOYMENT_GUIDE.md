# Setup & Deployment Guide - Payment Service Backend

Complete guide for setting up, configuring, and deploying the Payment Service Backend.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Setup](#database-setup)
3. [Authorize.Net Configuration](#authorizenet-configuration)
4. [Email Configuration](#email-configuration)
5. [Environment Variables](#environment-variables)
6. [Production Deployment](#production-deployment)
7. [Docker Setup](#docker-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)

---

## Local Development Setup

### Prerequisites

```bash
# Check Node.js version (requires v18+)
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher

# Check PostgreSQL version (requires v12+)
psql --version  # PostgreSQL 12.0 or higher
```

### Step 1: Install Node.js

**macOS:**

```bash
brew install node
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install nodejs npm
```

**Windows:** Download from https://nodejs.org/

### Step 2: Install PostgreSQL

**macOS:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:** Download from https://www.postgresql.org/download/windows/

### Step 3: Clone Repository

```bash
git clone https://github.com/your-org/payment-service-backend.git
cd payment-service-backend
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Create Environment File

```bash
cat > .env << 'EOF'
# Server Configuration
APP_PORT=9441
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_service_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_service_db
DB_USER=postgres
DB_PASSWORD=postgres

# API Keys
API_KEYS=dev-key-1,dev-key-2

# Authorize.Net Sandbox
AUTHORIZE_NET_ENVIRONMENT=SANDBOX
AUTHORIZE_NET_API_LOGIN_ID_TEST=YOUR_SANDBOX_LOGIN_ID
AUTHORIZE_NET_TRANSACTION_KEY_TEST=YOUR_SANDBOX_TRANSACTION_KEY

# Email (Development - no-op)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@callaxis.com

# Logging
LOG_DIR=./LOGS
LOG_LEVEL=info
EOF
```

### Step 6: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE payment_service_db;

# Exit
\q
```

### Step 7: Run Development Server

```bash
npm run dev
```

**Expected output:**

```
Database connected successfully!
payment-service-backend running at 9441
```

### Step 8: Test API

```bash
curl -X GET http://localhost:9441/api/v1/vendor-plans \
  -H "X-API-Key: dev-key-1" \
  -H "Content-Type: application/json"
```

---

## Database Setup

### Create Database & User

```bash
# Connect as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE payment_service_db
  WITH ENCODING 'UTF8'
  LOCALE 'en_US.UTF-8'
  TEMPLATE template0;

# Create user
CREATE USER payment_user WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO payment_user;

# Connect to database
\c payment_service_db

# Grant schema privileges
GRANT ALL ON SCHEMA public TO payment_user;

# Exit
\q
```

### Initialize Tables

Tables are created automatically on first run. To manually create:

```bash
# Uncomment in src/dbSetup/dbSetup.ts
# await createTables();

npm run dev
```

### Backup Database

```bash
# Full backup
pg_dump -U payment_user -h localhost payment_service_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U payment_user -h localhost payment_service_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# From SQL file
psql -U payment_user -h localhost payment_service_db < backup_20250121_120000.sql

# From compressed file
gunzip -c backup_20250121_120000.sql.gz | psql -U payment_user -h localhost payment_service_db
```

### Database Indexes (Production)

```sql
-- Performance indexes
CREATE INDEX idx_customer_email ON customer_profiles(user_email_id);
CREATE INDEX idx_payment_profile_customer ON payment_profiles(customer_profile_id);
CREATE INDEX idx_transaction_email ON payment_transactions(user_email);
CREATE INDEX idx_transaction_status ON payment_transactions(transaction_status);
CREATE INDEX idx_vendor_plan ON vendor_plans(vendor_name, plan_name);
CREATE INDEX idx_transaction_date ON payment_transactions(created_at);
```

---

## Authorize.Net Configuration

### Get Sandbox Credentials

1. **Sign Up:**
   - Go to https://developer.authorize.net/
   - Click "Sign Up"
   - Create developer account

2. **Get Credentials:**
   - Log into sandbox dashboard
   - Go to Account → API Credentials & Keys
   - Note your API Login ID and Transaction Key

### Get Live Credentials

1. **Create Live Account:**
   - https://www.authorize.net/
   - Sign up for merchant account

2. **Get Live API Keys:**
   - Log into production account
   - Account → API Credentials & Keys
   - Note API Login ID and Transaction Key

### Configure Environment

```env
# For single provider (Sandbox)
AUTHORIZE_NET_ENVIRONMENT=SANDBOX
AUTHORIZE_NET_API_LOGIN_ID_TEST=123456
AUTHORIZE_NET_TRANSACTION_KEY_TEST=your-key-here

# For multiple providers (Live)
AUTHORIZE_NET_ENVIRONMENT=LIVE

# FABZ Solutions
AUTHORIZE_NET_API_LOGIN_ID_LIVE__FABZ=fabz_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__FABZ=fabz_key

# Care Business Consulting
AUTHORIZE_NET_API_LOGIN_ID_LIVE__CAREBUZ=carebuz_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CAREBUZ=carebuz_key

# Chase Bank
AUTHORIZE_NET_API_LOGIN_ID_LIVE__CHASE=chase_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CHASE=chase_key
```

### Test Connection

```javascript
// test-authorize-net.js
import { AuthorizeNetService } from './src/services/AuthorizeNet.Service.js';

const result = await AuthorizeNetService.createCustomerProfile(
  'fabzsolutions',
  'test@example.com',
  'John',
  'Doe',
  '123 Main St',
  'New York',
  'NY',
  '10001',
  'USA',
  '2125551234',
  {
    dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
    dataValue: 'test_token',
  },
);

console.log('Connection successful:', result);
```

---

## Email Configuration

### Gmail Setup

1. **Enable 2-Factor Authentication:**
   - Go to myaccount.google.com
   - Security settings
   - Enable 2FA

2. **Generate App Password:**
   - Go to myaccount.google.com/apppasswords
   - Select Mail and Other (custom)
   - Google will generate 16-character password

3. **Configure Environment:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=noreply@callaxis.com
```

### SendGrid Setup

1. **Create Account:**
   - https://sendgrid.com/
   - Sign up for free account

2. **Get API Key:**
   - Dashboard → API Keys
   - Create new API key

3. **Configure Environment:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
SMTP_FROM=noreply@callaxis.com
```

### AWS SES Setup

1. **Create Account:**
   - AWS Console → Simple Email Service

2. **Verify Domain/Email:**
   - Add sender email in SES
   - Verify via email link

3. **Get Credentials:**
   - SMTP settings → Connection details

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-username
SMTP_PASSWORD=your-ses-password
SMTP_FROM=verified@yourdomain.com
```

### Test Email

```javascript
// test-email.js
import { EmailService } from './src/services/Email.service.js';

await EmailService.sendInvoice('Test Invoice', '<h1>Test Email</h1><p>This is a test</p>');

console.log('Email sent successfully');
```

---

## Environment Variables

### Complete .env Template

```env
# ============================================
# Server Configuration
# ============================================
APP_PORT=9441
NODE_ENV=development

# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql://payment_user:password@localhost:5432/payment_service_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_service_db
DB_USER=payment_user
DB_PASSWORD=secure_password_here

# ============================================
# API Configuration
# ============================================
API_KEYS=dev-key-1,dev-key-2,dev-key-3
JWT_SECRET=your-super-secret-jwt-key-here

# ============================================
# Authorize.Net Configuration (Sandbox)
# ============================================
AUTHORIZE_NET_ENVIRONMENT=SANDBOX
AUTHORIZE_NET_API_LOGIN_ID_TEST=YOUR_SANDBOX_LOGIN_ID
AUTHORIZE_NET_TRANSACTION_KEY_TEST=YOUR_SANDBOX_TRANSACTION_KEY

# ============================================
# Authorize.Net Configuration (Live)
# ============================================
# FABZ Solutions
AUTHORIZE_NET_API_LOGIN_ID_LIVE__FABZ=YOUR_FABZ_LIVE_LOGIN_ID
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__FABZ=YOUR_FABZ_LIVE_TRANSACTION_KEY

# Care Business Consulting Solutions
AUTHORIZE_NET_API_LOGIN_ID_LIVE__CAREBUZ=YOUR_CAREBUZ_LIVE_LOGIN_ID
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CAREBUZ=YOUR_CAREBUZ_LIVE_TRANSACTION_KEY

# Chase Bank
AUTHORIZE_NET_API_LOGIN_ID_LIVE__CHASE=YOUR_CHASE_LIVE_LOGIN_ID
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CHASE=YOUR_CHASE_LIVE_TRANSACTION_KEY

# ============================================
# Email Configuration
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@callaxis.com

# ============================================
# Third-Party Integration
# ============================================
REALTOR_UPLIFT_API_URL=https://api.realtoruplift.com
REALTOR_UPLIFT_API_KEY=your_realtor_uplift_api_key

# ============================================
# Logging Configuration
# ============================================
LOG_DIR=./LOGS
LOG_LEVEL=info

# ============================================
# Environment-specific Settings
# ============================================
# Development: Allow all origins, verbose logging
# Production: Restrict CORS, minimal logging
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

---

## Production Deployment

### Pre-deployment Checklist

- [ ] Environment variables set securely (use secrets manager)
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Load balancer configured (if applicable)
- [ ] Database indexed for performance
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled

### Build for Production

```bash
# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Verify build
ls -la dist/

# Expected output:
# drwxr-xr-x app.js
# drwxr-xr-x server.js
# drwxr-xr-x src/ (compiled JavaScript)
```

### Deploy to Server

```bash
# Copy files to production server
scp -r dist/ user@production.server:/var/www/payment-service/
scp -r package*.json user@production.server:/var/www/payment-service/
scp .env.production user@production.server:/var/www/payment-service/.env

# SSH into server
ssh user@production.server

# Install dependencies
cd /var/www/payment-service
npm install --production

# Start application
npm start
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'payment-service',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs payment-service

# Monitor
pm2 monit

# Restart on file changes (development)
pm2 start ecosystem.config.js --watch

# Reboot on server restart
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/payment-service

upstream payment_service {
    server 127.0.0.1:9441;
    keepalive 64;
}

server {
    listen 80;
    server_name api.payment.callaxis.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.payment.callaxis.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/payment.crt;
    ssl_certificate_key /etc/ssl/private/payment.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/payment-service.access.log;
    error_log /var/log/nginx/payment-service.error.log;

    # Proxy configuration
    location / {
        proxy_pass http://payment_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable Nginx configuration:

```bash
sudo ln -s /etc/nginx/sites-available/payment-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Docker Setup

### Dockerfile

```dockerfile
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY dist ./dist

# Expose port
EXPOSE 9441

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9441/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: payment-db
    environment:
      POSTGRES_USER: payment_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: payment_service_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U payment_user']
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: payment-service
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: payment_service_db
      DB_USER: payment_user
      DB_PASSWORD: secure_password
      API_KEYS: ${API_KEYS}
      AUTHORIZE_NET_ENVIRONMENT: ${AUTHORIZE_NET_ENVIRONMENT}
      AUTHORIZE_NET_API_LOGIN_ID_TEST: ${AUTHORIZE_NET_API_LOGIN_ID_TEST}
      AUTHORIZE_NET_TRANSACTION_KEY_TEST: ${AUTHORIZE_NET_TRANSACTION_KEY_TEST}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    ports:
      - '9441:9441'
    volumes:
      - ./LOGS:/app/LOGS
    restart: unless-stopped

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build Docker image
docker build -t payment-service:latest .

# Run container
docker run -d \
  --name payment-service \
  -p 9441:9441 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  payment-service:latest

# Using Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

---

## Monitoring & Logging

### Application Logging

Logs are written to `./LOGS/` directory with daily rotation.

```bash
# View real-time logs
tail -f ./LOGS/payment-service.log

# Search logs
grep "error" ./LOGS/payment-service.log

# Count occurrences
grep -c "approved" ./LOGS/payment-service.log
```

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

### Monitoring with PM2

```bash
# Real-time monitoring
pm2 monit

# Get detailed info
pm2 info payment-service

# Generate report
pm2 save
pm2 generate-monit-html

# Web dashboard
pm2 web
# Visit http://localhost:9615
```

### Health Check Endpoint (Recommended Addition)

```typescript
// Add to app.ts
app.app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});
```

Test health check:

```bash
curl http://localhost:9441/health
```

---

## Backup & Recovery

### Automated Database Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/payment-service"
DB_NAME="payment_service_db"
DB_USER="payment_user"
RETENTION_DAYS=30

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to cloud (optional)
# aws s3 cp $BACKUP_FILE s3://my-backups/payment-service/

echo "Backup completed: $BACKUP_FILE"
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /home/user/backup.sh >> /var/log/payment-backup.log 2>&1
```

### Restore from Backup

```bash
# List available backups
ls -lh /backups/payment-service/

# Restore
gunzip -c /backups/payment-service/backup_20250121_020000.sql.gz | \
  psql -U payment_user -d payment_service_db

# Verify restore
psql -U payment_user -d payment_service_db -c "SELECT COUNT(*) FROM payment_transactions;"
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 9441
lsof -i :9441

# Kill process
kill -9 <PID>

# Or use different port
APP_PORT=9442 npm start
```

### Database Connection Failed

```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Test connection
psql -U payment_user -h localhost -d payment_service_db
```

### Environment Variables Not Loaded

```bash
# Verify .env file exists
ls -la .env

# Check file permissions
chmod 600 .env

# Verify variables in running process
ps aux | grep node
# Check env variables in process
cat /proc/<PID>/environ | tr '\0' '\n' | grep APP_
```

### Memory Leaks

```bash
# Check memory usage
pm2 status

# Generate heap dump
node --inspect dist/server.js

# Use Chrome DevTools to analyze
# Open chrome://inspect in Chrome
```

---

## Security Best Practices

- [ ] Use environment variables for all secrets
- [ ] Rotate API keys regularly
- [ ] Enable HTTPS/TLS in production
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Use strong database passwords
- [ ] Restrict database access by IP
- [ ] Enable database SSL
- [ ] Implement rate limiting
- [ ] Monitor for suspicious activity
- [ ] Regular security audits
- [ ] Backup data regularly
- [ ] Document incident response procedures

---

**Version:** 1.0.0  
**Last Updated:** January 21, 2025
