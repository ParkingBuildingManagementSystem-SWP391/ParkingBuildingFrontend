import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

try:
    with open("ui/Management Dashboard Design 10.make", "rb") as f_make:
        # Since it's a zip, let's extract canvas.fig in memory
        import zipfile
        with zipfile.ZipFile(f_make) as z:
            canvas_data = z.read("canvas.fig")
            print(f"canvas.fig size: {len(canvas_data)} bytes")
            
            # Search for hex color codes in binary
            # Hex codes are usually stored as text or bytes, e.g. #xxxxxx or in float values (r, g, b, a).
            # Let's search for float color patterns or hex-like ASCII strings
            ascii_text = canvas_data.decode('utf-8', errors='ignore')
            
            # Let's find hex patterns
            hex_pattern = re.compile(r'#[0-9a-fA-F]{6}')
            hex_found = set(hex_pattern.findall(ascii_text))
            print("Hex codes in canvas.fig text:", sorted(list(hex_found)))
            
            # Let's search for some text labels
            labels = ["Color", "palette", "Theme", "Primary", "Secondary", "Background", "Grid"]
            for label in labels:
                matches = [m.start() for m in re.finditer(label, ascii_text, re.IGNORECASE)]
                print(f"Mention of '{label}': {len(matches)} times")
                if matches:
                    print(f"  First mention context: {ascii_text[max(0, matches[0]-50):min(len(ascii_text), matches[0]+150)]}")
except Exception as e:
    print(f"Error: {str(e)}")
