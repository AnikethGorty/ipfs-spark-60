import os
import socket
import threading
import json
import time
from flask import Flask, request, jsonify
import psutil

app = Flask(__name__)

BROADCAST_PORT = 5001
AGENT_PORT = 5000
BROADCAST_INTERVAL = 2  # seconds


# -----------------------------------------------------
# Get real WiFi IP (not virtual)
# -----------------------------------------------------
def get_real_ip():
    for name, addrs in psutil.net_if_addrs().items():
        if "Wi-Fi" in name or "WiFi" in name or "Wireless" in name:
            for a in addrs:
                if a.family.name == "AF_INET":
                    return a.address
    return "127.0.0.1"



IP = get_real_ip()
HOSTNAME = socket.gethostname()


# -----------------------------------------------------
# Peer discovery (UDP broadcast)
# -----------------------------------------------------
peers = {}

def broadcast_presence():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    while True:
        packet = json.dumps({
            "ip": IP,
            "port": AGENT_PORT,
            "name": HOSTNAME
        }).encode()

        sock.sendto(packet, ("255.255.255.255", BROADCAST_PORT))
        time.sleep(BROADCAST_INTERVAL)


def listen_for_peers():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("", BROADCAST_PORT))

    while True:
        data, addr = sock.recvfrom(4096)
        try:
            info = json.loads(data.decode())
            peer_ip = info["ip"]

            if peer_ip != IP:  # don't include self
                peers[peer_ip] = info
        except:
            pass


# -----------------------------------------------------
# Metrics endpoint
# -----------------------------------------------------
def get_metrics():
    try:
        return {
            "ip": IP,
            "hostname": HOSTNAME,
            "peers": list(peers.values())
        }
    except Exception as e:
        return {"error": str(e)}


# -----------------------------------------------------
# Flask endpoints
# -----------------------------------------------------
@app.route("/metrics", methods=["GET"])
def metrics():
    return jsonify(get_metrics())


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "time": time.time()})


# -----------------------------------------------------
# Run Agent
# -----------------------------------------------------
def run_agent():
    threading.Thread(target=broadcast_presence, daemon=True).start()
    threading.Thread(target=listen_for_peers, daemon=True).start()

    app.run(host="0.0.0.0", port=AGENT_PORT, debug=False, use_reloader=False)


if __name__ == "__main__":
    print(f"[agent] Running on IP {IP}:{AGENT_PORT}")
    print("[agent] LAN discovery enabled (UDP broadcast)")
    run_agent()
