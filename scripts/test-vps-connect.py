import paramiko
import sys

hostname = "103.77.214.146"
username = "root"
password = "TDCloudPgy82#5@"

print(f"Connecting to {username}@{hostname}...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname, port=22, username=username, password=password, timeout=10)
    stdin, stdout, stderr = client.exec_command("uname -a && cat /etc/os-release | grep PRETTY_NAME && which node npm git nginx docker 2>/dev/null || true")
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("SUCCESS! Output:")
    print(out)
    if err:
        print("STDERR:", err)
    client.close()
except Exception as e:
    print("ERROR:", e)
    sys.exit(1)
