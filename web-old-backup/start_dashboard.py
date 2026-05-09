import subprocess
import sys

sys.argv = ["python", "-m", "main", "dashboard", "--port", "9119"]
result = subprocess.run(sys.argv, capture_output=True, text=True, cwd=r"C:\Users\home\AppData\Local\hermes\hermes-agent\hermes_cli")
print(result.stdout)
print(result.stderr)
