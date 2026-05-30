import zipfile
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        print("=== Files inside ZIP ===")
        for info in z.infolist():
            print(f"{info.filename} - Size: {info.file_size} bytes")
except Exception as e:
    print(f"Error: {str(e)}")
