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
            print(f"Total messages: {len(messages)}")
            if messages:
                last_msg = messages[-1]
                print("Last message keys:", last_msg.keys())
                print("Role:", last_msg.get("role"))
                
                # Check for content and sub-fields
                content = last_msg.get("content")
                print("Content type:", type(content))
                if isinstance(content, dict):
                    print("Content keys:", content.keys())
                elif isinstance(content, list):
                    print("Content items length:", len(content))
                    for i, item in enumerate(content[:5]):
                        print(f"Item {i} type:", type(item))
                        if isinstance(item, dict):
                            print(f"Item {i} keys:", item.keys())
                            if "text" in item:
                                print(f"Item {i} text (first 200 chars):", item["text"][:200])
                else:
                    print("Content string value (first 500 chars):", str(content)[:500])
except Exception as e:
    print(f"Error: {str(e)}")
