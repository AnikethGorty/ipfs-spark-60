import os
import socket
import threading
import json
from flask import Flask, request, jsonify
import psutil
from zeroconf import Zeroconf, ServiceInfo
import time

app = Flask(__name__)

# -----------------------------
# Metrics
# -----------------------------
def get_metrics():
    """Return a dict of simple host metrics: cpu, mem, network interfaces, and listening ports."""
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()._asdict()
        # list listening TCP ports
        conns = psutil.net_connections(kind='inet')
        listening = []
        for c in conns:
            if c.status == psutil.CONN_LISTEN:
                laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else ""
                listening.append({"fd": c.fd, "laddr": laddr, "pid": c.pid})
        # basic network interfaces
        if_addrs = psutil.net_if_addrs()
        if_stats = psutil.net_if_stats()
        interfaces = {}
        for name, addrs in if_addrs.items():
            ips = [a.address for a in addrs if a.family.name in ('AF_INET', 'AF_INET6')]
            interfaces[name] = {
                "ips": ips,
                "is_up": if_stats.get(name).isup if if_stats.get(name) else False
            }
        return {"cpu_percent": cpu, "memory": mem, "listening": listening, "interfaces": interfaces}
    except Exception as e:
        return {"error": str(e)}

# -----------------------------
# Zeroconf (mDNS) advertising
# -----------------------------
_zc = None
_service_info = None

def advertise_service(port: int, name: str = None):
    """Advertise a simple HTTP service over mDNS/zeroconf so local devices can discover this node."""
    global _zc, _service_info
    try:
        _zc = Zeroconf()
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        if not name:
            name = f"ipfs-spark-node-{hostname}-{port}"
        desc = {'path': '/'}
        info = ServiceInfo(
            "_http._tcp.local.",
            f"{name}._http._tcp.local.",
            addresses=[socket.inet_aton(ip)],
            port=port,
            properties=desc,
            server=f"{hostname}.local."
        )
        _zc.register_service(info)
        _service_info = info
        print(f"[agent] Advertised service {name} at {ip}:{port}")
    except Exception as e:
        print(f"[agent] Failed to advertise service: {e}")

def stop_advertise():
    global _zc, _service_info
    try:
        if _zc and _service_info:
            _zc.unregister_service(_service_info)
            _zc.close()
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
    func = request.environ.get('werkzeug.server.shutdown')
    if func:
        func()
    return jsonify({"status": "shutting down"})

# -----------------------------
# Run Agent
# -----------------------------
def run_agent():
    port = int(os.environ.get("IPFS_SPARK_PORT", "5000"))
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)).start()
    # small delay to ensure server is up
    time.sleep(0.2)
    advertise_service(port)


if __name__ == "__main__":
    try:
        run_agent()
        print("[agent] Real Mode node is LIVE.")
        input("Press Enter to exit...\n")
    finally:
        stop_advertise()
