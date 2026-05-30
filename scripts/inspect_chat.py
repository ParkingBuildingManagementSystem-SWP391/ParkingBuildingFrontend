import zipfile
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        chat_data = json.loads(z.read("ai_chat.json").decode('utf-8'))
        threads = chat_data.get("threads", [])
        print(f"Number of threads: {len(threads)}")
        for t_idx, thread in enumerate(threads):
            print(f"\nThread {t_idx} keys: {thread.keys()}")
            messages = thread.get("messages", [])
            print(f"Number of messages: {len(messages)}")
            
            # Print the last few messages to see the instructions
            for i, msg in enumerate(messages[-4:]):
                role = msg.get("role", "unknown")
                print(f"\n--- Thread {t_idx} - Message {i} ({role}) ---")
                
                # Content can be a string or structured
                content = msg.get("content", "")
                if isinstance(content, str):
                    print(content[:1500])
                elif isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and "text" in c:
                            print(c["text"][:1500])
except Exception as e:
    print(f"Error: {str(e)}")
