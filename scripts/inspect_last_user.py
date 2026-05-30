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
            user_messages = [m for m in messages if m.get("role") == "user"]
            print(f"Total user messages: {len(user_messages)}")
            
            # Print the last 4 user messages
            for i, msg in enumerate(user_messages[-4:]):
                print(f"\n================ USER MESSAGE index: {msg.get('index')} ================")
                parts = msg.get("parts", [])
                for p_idx, part in enumerate(parts):
                    content_json = part.get("contentJson")
                    if content_json:
                        if isinstance(content_json, str):
                            data = json.loads(content_json)
                        else:
                            data = content_json
                        if "text" in data:
                            print(f"  [Part {p_idx} TEXT]:\n{data['text']}")
except Exception as e:
    print(f"Error: {str(e)}")
