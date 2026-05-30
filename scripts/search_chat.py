import zipfile
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        chat_data = json.loads(z.read("ai_chat.json").decode('utf-8'))
        threads = chat_data.get("threads", [])
        if not threads:
            print("No threads found")
            sys.exit(0)
            
        messages = threads[0].get("messages", [])
        print(f"Total messages: {len(messages)}")
        
        # Search for color codes, hex codes, and file references
        hex_pattern = re.compile(r'#[0-9a-fA-F]{6}')
        file_references = ["GateController", "ParkingLotMap", "Dashboard", "Sidebar", "Header", "mockData"]
        
        hex_found = set()
        file_mentions = {f: 0 for f in file_references}
        
        for msg in messages:
            role = msg.get("role")
            parts = msg.get("parts", [])
            for part in parts:
                content_json = part.get("contentJson")
                if not content_json:
                    continue
                if isinstance(content_json, str):
                    try:
                        data = json.loads(content_json)
                    except:
                        data = {}
                else:
                    data = content_json
                
                text = data.get("text", "")
                code = data.get("code", "")
                combined = text + "\n" + code
                
                # Find hex codes
                for hex_code in hex_pattern.findall(combined):
                    hex_found.add(hex_code.lower())
                    
                # Find file mentions
                for f in file_references:
                    if f in combined:
                        file_mentions[f] += 1
                        
        print("\n=== Hex Codes Found in Chat ===")
        print(sorted(list(hex_found)))
        
        print("\n=== File Mentions in Chat ===")
        for f, count in file_mentions.items():
            print(f"{f}: {count} times")
            
except Exception as e:
    print(f"Error: {str(e)}")
