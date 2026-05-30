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
                # Find the last assistant message and inspect its parts
                # Let's iterate backwards to find the last assistant message
                assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
                if assistant_msgs:
                    last_ast = assistant_msgs[-1]
                    print(f"=== Last Assistant Message Index: {last_ast.get('index')} ===")
                    parts = last_ast.get("parts", [])
                    for p_idx, part in enumerate(parts):
                        print(f"\nPart {p_idx}: partType={part.get('partType')}")
                        content_json = part.get("contentJson")
                        if content_json:
                            # contentJson might be a string containing JSON or a dict directly
                            if isinstance(content_json, str):
                                data = json.loads(content_json)
                            else:
                                data = content_json
                            
                            print("  Keys in contentJson:", data.keys())
                            if "text" in data:
                                print(f"  [TEXT]:\n{data['text'][:800]}")
                            if "code" in data:
                                print(f"  [CODE] (language: {data.get('language')}):\n{data['code'][:800]}")
                            if "command" in data:
                                print(f"  [COMMAND]:\n{data['command']}")
except Exception as e:
    print(f"Error: {str(e)}")
