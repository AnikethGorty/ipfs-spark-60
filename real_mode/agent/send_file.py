import requests
import sys
import os

if len(sys.argv) < 3:
    print("Usage: python send_file.py <peer-ip> <file-path>")
    sys.exit(0)

peer = sys.argv[1]
file_path = sys.argv[2]

if not os.path.exists(file_path):
    print("File not found:", file_path)
    sys.exit(1)

url = f"http://{peer}:5000/upload"

with open(file_path, "rb") as f:
    files = {"file": f}
    print("[SENDER] Sending file…")
    r = requests.post(url, files=files)

print("[SENDER] Response:", r.text)
