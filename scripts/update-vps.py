import sys
import os
import paramiko
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

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

    # 1. Git pull
    print("\n[STEP 1] Git pull latest code on VPS...")
    cmd_git = """
    cd /var/www/stockai && git fetch origin && git reset --hard origin/main
    """
    status, out, _ = run_command(client, cmd_git)

    # 2. Build on VPS
    print("\n[STEP 2] Running next build on VPS...")
    cmd_build = """
    cd /var/www/stockai && npm run build
    """
    status, out, _ = run_command(client, cmd_build, timeout=300)

    # 3. Reload PM2
    print("\n[STEP 3] Reloading PM2 process...")
    cmd_pm2 = """
    pm2 reload stockai || pm2 restart stockai
    pm2 status
    """
    status, out, _ = run_command(client, cmd_pm2)

    client.close()
    print("\nVPS Deployment complete!")

if __name__ == '__main__':
    main()
