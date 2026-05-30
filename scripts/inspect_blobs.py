import zipfile
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        print("=== Files in blob_store ===")
        for info in z.infolist():
            if "blob_store" in info.filename:
                content = z.read(info.filename)
                print(f"\nFile: {info.filename} ({info.file_size} bytes)")
                try:
                    text = content.decode('utf-8')
                    print(text[:1000])
                except Exception as e:
                    print("Error decoding:", str(e))
except Exception as e:
    print(f"Error: {str(e)}")
