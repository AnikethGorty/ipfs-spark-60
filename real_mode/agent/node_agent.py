import os
import socket
import threading
from flask import Flask, request, jsonify
import psutil
from zeroconf import Zeroconf, ServiceInfo

app = Flask(__name__)

# -----------------------------
# Metrics
# -----------------------------
def get_metrics():
    # Find active network interfaces & signal quality
    wifi_quality = None
    try:
        out = os.popen("netsh wlan show interfaces").read()
        for line in out.splitlines():
            if "Signal" in line:
                wifi_quality = line.split(":")[-1].strip()
    except:
        pass

    metrics = {
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent,
        "battery": psutil.sensors_battery().percent if psutil.sensors_battery() else None,
        "wifi_signal": wifi_quality,
        "interfaces": list(psutil.net_if_addrs().keys())
    }
    return metrics


@app.route("/metrics")
def metrics():
    return jsonify(get_metrics())


# -----------------------------
# File Upload
# -----------------------------
@app.route("/upload", methods=["POST"])
def upload_file():
    f = request.files["file"]
    save_path = os.path.join("received", f.filename)
    os.makedirs("received", exist_ok=True)
    f.save(save_path)
    return jsonify({"status": "ok", "saved_to": save_path})


# -----------------------------
# Zeroconf Advertise
# -----------------------------
def advertise_service(port):
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    desc = {"node": hostname}

    info = ServiceInfo(
        "_realspark._tcp.local.",
        f"{hostname}._realspark._tcp.local.",
        addresses=[socket.inet_aton(ip)],
        port=port,
        properties=desc,
        server=f"{hostname}.local."
    )

    zeroconf = Zeroconf()
    zeroconf.register_service(info)
    print(f"[agent] Advertising as {hostname} on {ip}:{port}")

    return zeroconf


# -----------------------------
# Run Agent
# -----------------------------
def run_agent():
    port = 5000
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=port, debug=False)).start()
    advertise_service(port)


if __name__ == "__main__":
    run_agent()
    print("[agent] Real Mode node is LIVE.")
    input("Press Enter to exit...\n")
