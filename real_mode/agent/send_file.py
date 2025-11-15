import requests
import sys

if len(sys.argv) < 3:
    print("Usage: python send_file.py <peer-ip> <file-path>")
    sys.exit(0)

peer = sys.argv[1]
file_path = sys.argv[2]

url = f"http://{peer}:5000/upload"

with open(file_path, "rb") as f:
    files = {"file": f}
    r = requests.post(url, files=files)

print("Response:", r.text)
