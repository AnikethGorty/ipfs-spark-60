# start_real_mode.py
import os
import sys
import subprocess
import ctypes

def require_admin():
    # Only elevate on Windows (nt)
    if os.name != "nt":
        return

    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False

    if not is_admin:
        # Relaunch with admin rights
        params = " ".join(f'"{arg}"' for arg in sys.argv)
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, params, None, 1
        )
        sys.exit()

# auto elevate
require_admin()

# ------- AFTER ELEVATION ---------

AGENT_PATH = os.path.join(os.path.dirname(__file__), "node_agent.py")

print("Launching Real Mode agent with admin privileges...")
subprocess.Popen([sys.executable, AGENT_PATH], creationflags=subprocess.CREATE_NEW_CONSOLE)
