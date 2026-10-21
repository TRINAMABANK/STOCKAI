import sys
import os

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import paramiko
import time

HOSTNAME = "103.77.214.146"
USERNAME = "root"
PASSWORD = "TDCloudPgy82#5@"

def run_command(client, command, print_output=True, timeout=300):
    print(f"\n[EXEC] {command}")
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    
    channel = stdout.channel
    out_chunks = []
    err_chunks = []
    
    while not channel.exit_status_ready():
        if channel.recv_ready():
            chunk = channel.recv(4096).decode('utf-8', errors='replace')
            if print_output:
                sys.stdout.write(chunk)
                sys.stdout.flush()
            out_chunks.append(chunk)
        if channel.recv_stderr_ready():
            err_chunk = channel.recv_stderr(4096).decode('utf-8', errors='replace')
            if print_output:
                sys.stderr.write(err_chunk)
                sys.stderr.flush()
            err_chunks.append(err_chunk)
        time.sleep(0.1)
        
    while channel.recv_ready():
        chunk = channel.recv(4096).decode('utf-8', errors='replace')
        if print_output:
            sys.stdout.write(chunk)
            sys.stdout.flush()
        out_chunks.append(chunk)
    while channel.recv_stderr_ready():
        err_chunk = channel.recv_stderr(4096).decode('utf-8', errors='replace')
        if print_output:
            sys.stderr.write(err_chunk)
            sys.stderr.flush()
        err_chunks.append(err_chunk)
        
    status = channel.recv_exit_status()
    print(f"[EXIT CODE]: {status}")
    return status, "".join(out_chunks), "".join(err_chunks)

def main():
    print(f"Connecting to VPS {USERNAME}@{HOSTNAME}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOSTNAME, port=22, username=USERNAME, password=PASSWORD, timeout=15)
    print("SUCCESS: Connected to VPS via SSH!")

    # 1. System Info Check
    status, out, _ = run_command(client, "free -m && df -h /")
    
    # 2. Update and install packages
    print("\n[STEP 2] Installing Nginx, Certbot and essentials...")
    run_command(client, "export DEBIAN_FRONTEND=noninteractive && apt-get update -y && apt-get install -y curl git nginx certbot python3-certbot-nginx build-essential ufw", timeout=300)

    # 3. Check and install Node.js 20
    status, out, _ = run_command(client, "node -v || true")
    if "v20" not in out and "v22" not in out and "v18" not in out:
        print("\n[STEP 3] Installing Node.js 20 LTS from Nodesource...")
        run_command(client, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs", timeout=300)
    
    run_command(client, "node -v && npm -v")
    
    # 4. Install PM2 globally
    run_command(client, "which pm2 || npm install -g pm2")

    # 5. Clone or update repository
    print("\n[STEP 5] Syncing STOCKAI code to /var/www/stockai...")
    run_command(client, """
    mkdir -p /var/www
    if [ ! -d "/var/www/stockai/.git" ]; then
        rm -rf /var/www/stockai
        git clone https://github.com/TRINAMABANK/STOCKAI.git /var/www/stockai
    else
        cd /var/www/stockai && git reset --hard HEAD && git fetch origin && git checkout main && git pull origin main
    fi
    """, timeout=180)

    # 6. Setup environment file
    print("\n[STEP 6] Setting up environment variables (.env.production)...")
    env_content = """NODE_ENV=production
PORT=3000
APP_URL=https://demoladipage.com
NEXTAUTH_URL=https://demoladipage.com
SESSION_SECRET=stockai-secure-oauth-secret-token-key-2026-production
INITIAL_ADMIN_PASSWORD=Admin@2026
"""
    sftp = client.open_sftp()
    with sftp.file('/var/www/stockai/.env.production', 'w') as f:
        f.write(env_content)
    with sftp.file('/var/www/stockai/.env.local', 'w') as f:
        f.write(env_content)
    sftp.close()
    print("SUCCESS: Environment files created.")

    # 7. Install dependencies & build on VPS
    print("\n[STEP 7] Running npm install & npm run build on VPS...")
    run_command(client, "cd /var/www/stockai && npm install", timeout=300)
    status, _, _ = run_command(client, "cd /var/www/stockai && npm run build", timeout=300)
    if status != 0:
        print("ERROR: Next.js build failed on VPS!")
        client.close()
        sys.exit(1)

    # 8. Start application with PM2
    print("\n[STEP 8] Starting application with PM2...")
    run_command(client, """
    cd /var/www/stockai
    pm2 delete stockai 2>/dev/null || true
    pm2 start npm --name "stockai" -- start
    pm2 save
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
    """)

    # 9. Configure Nginx
    print("\n[STEP 9] Configuring Nginx for demoladipage.com...")
    nginx_conf = """server {
    listen 80;
    server_name demoladipage.com www.demoladipage.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    sftp = client.open_sftp()
    with sftp.file('/etc/nginx/sites-available/demoladipage.com', 'w') as f:
        f.write(nginx_conf)
    sftp.close()

    run_command(client, """
    ln -sf /etc/nginx/sites-available/demoladipage.com /etc/nginx/sites-enabled/demoladipage.com
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    """)

    # 10. Issue Let's Encrypt SSL
    print("\n[STEP 10] Requesting Let's Encrypt SSL certificate for https://demoladipage.com...")
    run_command(client, "certbot --nginx -d demoladipage.com -d www.demoladipage.com --non-interactive --agree-tos -m triqnnamabank@gmail.com --redirect || certbot --nginx -d demoladipage.com --non-interactive --agree-tos -m triqnnamabank@gmail.com --redirect || true", timeout=180)

    # 11. Final Health Check
    print("\n[STEP 11] Performing Health Check...")
    run_command(client, "pm2 status")
    run_command(client, "curl -I -k https://demoladipage.com/ || curl -I http://localhost:3000/")
    run_command(client, "curl -I -k https://demoladipage.com/admin || curl -I http://localhost:3000/admin")

    client.close()
    print("\nDEPLOYMENT COMPLETED SUCCESSFULLY ON VPS!")

if __name__ == "__main__":
    main()
