import subprocess
import ctypes
import sys
import os

# --- Auto-elevate to admin on Windows ---
def require_admin():
    if os.name != "nt":
        return
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False
    if not is_admin:
        params = " ".join(f'"{arg}"' for arg in sys.argv)
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, params, None, 1)
        sys.exit()

require_admin()

# --- Turn Bluetooth ON ---
def bluetooth_enable():
    cmd = r"Get-PnpDevice -Class Bluetooth | Enable-PnpDevice -Confirm:$false"
    subprocess.run(["powershell", "-Command", cmd], shell=True)
    print("Bluetooth Enabled via Real Mode click!")

if __name__ == "__main__":
    bluetooth_enable()
