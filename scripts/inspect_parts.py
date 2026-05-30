import zipfile
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        chat_data = json.loads(z.read("ai_chat.json").decode('utf-8'))
        threads = chat_data.get("threads", [])
        if threads:
            messages = threads[0].get("messages", [])
            if messages:
                # Let's inspect the last few messages that have parts
                for idx, msg in enumerate(messages[-5:]):
                    print(f"\n================ MESSAGE index: {msg.get('index')} (Role: {msg.get('role')}) ================")
                    parts = msg.get("parts", [])
                    print(f"Parts length: {len(parts)}")
                    for p_idx, part in enumerate(parts):
                        print(f"  Part {p_idx} keys: {part.keys()}")
                        # usually contains text, code, or type
                        if "text" in part:
                            print(f"  Text (first 500 chars):\n{part['text'][:500]}")
                        if "code" in part:
                            print(f"  Code language: {part.get('language')}")
                            print(f"  Code (first 500 chars):\n{part['code'][:500]}")
except Exception as e:
    print(f"Error: {str(e)}")
