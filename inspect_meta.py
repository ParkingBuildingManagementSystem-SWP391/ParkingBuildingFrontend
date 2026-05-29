import zipfile
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        meta_data = z.read("meta.json").decode('utf-8')
        print("=== meta.json ===")
        print(meta_data)
except Exception as e:
    print(f"Error: {str(e)}")
