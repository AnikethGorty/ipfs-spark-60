import os
import socket
import threading
import json
from flask import Flask, request, jsonify
import psutil
from zeroconf import Zeroconf, ServiceInfo, InterfaceChoice
import time

app = Flask(__name__)

# -----------------------------------------------------
# Select a REAL IPv4 LAN/WiFi IP (avoid VirtualBox etc.)
# -----------------------------------------------------
def get_real_ip():
    bad_ifaces = ["Virtual", "VMware", "vEthernet", "Loopback", "Bluetooth", "WSL"]

    for name, addrs in psutil.net_if_addrs().items():
        if any(bad in name for bad in bad_ifaces):
            continue

        for a in addrs:
            if a.family.name == "AF_INET":
                ip = a.address
                if ip.startswith("169.254."):
                    continue  # skip APIPA
                return ip

    return "127.0.0.1"


# -----------------------------
# Metrics
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
# Zeroconf (forced to correct IP)
# -----------------------------
zc = None
service_info = None

def advertise_service(port: int):
    global zc, service_info

    try:
        ip = get_real_ip()
        hostname = socket.gethostname()
        service_name = f"ipfs-spark-node-{hostname}-{port}"

        # Force zeroconf to bind to ONLY the chosen interface
        zc = Zeroconf(interfaces=[ip], interface_choice=InterfaceChoice.Manual)

        info = ServiceInfo(
            "_http._tcp.local.",
            f"{service_name}._http._tcp.local.",
            addresses=[socket.inet_aton(ip)],
            port=port,
            properties={'path': '/'},
            server=f"{hostname}.local.",
        )

        zc.register_service(info)
        service_info = info

        print(f"[agent] Advertising on {ip}:{port}")

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
# Flask Endpoints
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
