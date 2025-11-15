import subprocess

def enable_bluetooth_hardware():
    print("Ensuring hardware Bluetooth device is enabled...")
    cmd = r"Get-PnpDevice -Class Bluetooth | Enable-PnpDevice -Confirm:$false"
    subprocess.run(["powershell", "-Command", cmd], shell=True)

def enable_bluetooth_radio():
    print("Turning ON Bluetooth radio (actual usable Bluetooth)...")
    cmd = r"""
    $namespace = "root\Microsoft\Windows\HardwareManagement"
    $class = Get-CimClass -Namespace $namespace -ClassName MSFT_BluetoothRadio
    if ($class) {
        Get-CimInstance -Namespace $namespace -ClassName MSFT_BluetoothRadio |
        ForEach-Object {
            $_ | Invoke-CimMethod -MethodName Enable
        }
    } else {
        Write-Host "MSFT_BluetoothRadio API not available."
    }
    """
    subprocess.run(["powershell", "-Command", cmd], shell=True)

def start_bluetooth_service():
    print("Starting Bluetooth Support Service...")
    cmd = r"""
    Set-Service bthserv -StartupType Automatic
    Start-Service bthserv
    """
    subprocess.run(["powershell", "-Command", cmd], shell=True)

print("Enabling Bluetooth...")

# Order matters!
start_bluetooth_service()
enable_bluetooth_hardware()
enable_bluetooth_radio()

print("\nDone. Bluetooth should be ON now.")
