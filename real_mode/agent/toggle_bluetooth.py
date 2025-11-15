import subprocess
import sys

def bluetooth_enable():
    cmd = r"Get-PnpDevice -Class Bluetooth | Enable-PnpDevice -Confirm:$false"
    subprocess.run(["powershell", "-Command", cmd], shell=True)
    print("Bluetooth Enabled.")

def bluetooth_disable():
    cmd = r"Get-PnpDevice -Class Bluetooth | Disable-PnpDevice -Confirm:$false"
    subprocess.run(["powershell", "-Command", cmd], shell=True)
    print("Bluetooth Disabled.")

def bluetooth_status():
    cmd = r"Get-PnpDevice -Class Bluetooth | Select-Object Status, FriendlyName"
    result = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
    print("Bluetooth Device Status:\n")
    print(result.stdout)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python toggle_bluetooth.py on")
        print("  python toggle_bluetooth.py off")
        print("  python toggle_bluetooth.py status")
        sys.exit(0)

    action = sys.argv[1].lower()

    if action == "on":
        bluetooth_enable()
    elif action == "off":
        bluetooth_disable()
    elif action == "status":
        bluetooth_status()
    else:
        print("Invalid command.")
