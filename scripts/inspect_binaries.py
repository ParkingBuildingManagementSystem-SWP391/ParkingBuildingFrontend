import zipfile
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        bin_files_json = z.read("make_binary_files.json").decode('utf-8')
        print("=== make_binary_files.json ===")
        print(bin_files_json)
        
        # Let's inspect the files in make_binary_files/
        for info in z.infolist():
            if info.filename.startswith("make_binary_files/"):
                content = z.read(info.filename)
                print(f"\n=== File: {info.filename} (Size: {info.file_size} bytes) ===")
                try:
                    text = content.decode('utf-8')
                    print(text[:800])
                except Exception as e:
                    print(f"Error decoding as text: {str(e)}")
                    print("First 100 bytes:", content[:100])
except Exception as e:
    print(f"Error: {str(e)}")
