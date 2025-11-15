import os
import socket
import threading
import json
from flask import Flask, request, jsonify
import psutil
from zeroconf import Zeroconf, ServiceInfo
import time

app = Flask(__name__)

# -----------------------------------------------------
# Helper: pick a REAL LAN/WiFi IP (avoid VM + 169.254)
# -----------------------------------------------------
def get_real_ip():
    bad_keywords = ["Virtual", "VMware", "vEthernet", "Loopback", "Bluetooth", "WSL"]
    for name, addrs in psutil.net_if_addrs().items():
        if any(bad in name for bad in bad_keywords):
            continue

        for a in addrs:
            if a.family.name == "AF_INET":
                ip = a.address

                # Ignore APIPA ranges (169.254.x.x)
                if ip.startswith("169.254."):
                    continue

                # Good IP found
                return ip

    # Fallback
    return "127.0.0.1"


# -----------------------------
# Metrics endpoint
# -----------------------------
def get_metrics():
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()._asdict()

        conns = psutil.net_connections(kind='inet')
        listening = []
        for c in conns:
            if c.status == psutil.CONN_LISTEN:
                laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else ""
                listening.append({"fd": c.fd, "laddr": laddr, "pid": c.pid})

        if_addrs = psutil.net_if_addrs()
        if_stats = psutil.net_if_stats()

        interfaces = {}
        for name, addrs in if_addrs.items():
            ips = [a.address for a in addrs if a.family.name == "AF_INET"]
            interfaces[name] = {
                "ips": ips,
                "is_up": if_stats.get(name).isup if if_stats.get(name) else False
            }

        return {
            "cpu_percent": cpu,
            "memory": mem,
            "listening": listening,
            "interfaces": interfaces
        }

    except Exception as e:
        return {"error": str(e)}


# -----------------------------
# Zeroconf (mDNS)
# -----------------------------
zc = None
service_info = None

def advertise_service(port: int):
    global zc, service_info
    try:
        ip = get_real_ip()
        hostname = socket.gethostname()
        name = f"ipfs-spark-node-{hostname}-{port}"

        zc = Zeroconf()
        info = ServiceInfo(
            "_http._tcp.local.",
            f"{name}._http._tcp.local.",
            addresses=[socket.inet_aton(ip)],
            port=port,
            properties={'path': '/'},
            server=f"{hostname}.local."
        )

        zc.register_service(info)
        service_info = info
        print(f"[agent] Advertising as {hostname} on {ip}:{port}")

    except Exception as e:
        print(f"[agent] Zeroconf failed: {e}")


def stop_advertise():
    global zc, service_info
    try:
        if zc and service_info:
            zc.unregister_service(service_info)
            zc.close()
    except:
        pass


# -----------------------------
# Flask endpoints
# -----------------------------
@app.route("/metrics", methods=["GET"])
def metrics():
    return jsonify(get_metrics())


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "time": time.time()})


@app.route("/shutdown", methods=["POST"])
def shutdown():
    stop_advertise()
    func = request.environ.get("werkzeug.server.shutdown")
    if func:
        func()
    return jsonify({"status": "shutting down"})


# -----------------------------
# Run Agent
# -----------------------------
def run_agent():
    port = int(os.environ.get("IPFS_SPARK_PORT", "5000"))

    threading.Thread(
        target=lambda: app.run(
            host="0.0.0.0",
            port=port,
            debug=False,
            use_reloader=False
        )
    ).start()

    time.sleep(0.3)
    advertise_service(port)


if __name__ == "__main__":
    try:
        run_agent()
        print("[agent] Real Mode node is LIVE.")
        input("Press Enter to exit...\n")
    finally:
        stop_advertise()
