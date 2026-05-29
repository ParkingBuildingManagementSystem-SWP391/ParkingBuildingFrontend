import zipfile
import json
import os

try:
    os.makedirs("src/imports", exist_ok=True)
    
    with zipfile.ZipFile("ui/Management Dashboard Design 10.make") as z:
        # Define the mapping between blob refs and target files
        mapping = {
            "blob_store/blob_store_references/AI_CHAT_THREAD/83a841fe-5c37-41cd-ba48-4b9c7426fefa/THREAD_AI_CHAT_MESSAGE_CONTENT/8dc07c354b64523c3756a14341c70b237d2c9a10/original": "src/imports/phan-mem-giu-xe-pth-parking-300x300-1.jpg",
            "blob_store/blob_store_references/AI_CHAT_THREAD/83a841fe-5c37-41cd-ba48-4b9c7426fefa/THREAD_AI_CHAT_MESSAGE_CONTENT/7d112dffac1decf8617cb26dd94370217c6f05f5/original": "src/imports/quan-ly-doanh-thu-tren-phan-mem-may-giu-xe-tu-xa-300x300.jpg",
            "blob_store/blob_store_references/AI_CHAT_THREAD/83a841fe-5c37-41cd-ba48-4b9c7426fefa/THREAD_AI_CHAT_MESSAGE_CONTENT/d9ae4ce6f07fddf07119c509ca1c3fd0703cbe35/original": "src/imports/image.png",
            "blob_store/blob_store_references/AI_CHAT_THREAD/83a841fe-5c37-41cd-ba48-4b9c7426fefa/THREAD_AI_CHAT_MESSAGE_CONTENT/b8867931ef2591a48447cbcce5a7539a27d64aab/original": "src/imports/cac-cong-nghe-cot-loi-duoc-ung-dung-trong-phan-mem-giu-xe-pth-300x300.jpg"
        }
        
        for blob_path, target_path in mapping.items():
            try:
                data = z.read(blob_path)
                # The data is stored as a JSON object with metadata. Let's parse it.
                json_data = json.loads(data.decode('utf-8'))
                img_path_in_zip = ""
                # Find which image in zip this maps to.
                # In inspect_blobs, the image path was like "images/..." or "make_binary_files/..."
                guid = json_data.get("guid")
                print(f"Extracting {target_path} (guid: {guid})")
                
                # We need to map guid to the files. Let's find matches or extract the binary reference.
                # Actually, in make_binary_files.json:
                # We saw:
                # {"blobRef":"ad6c20b4581d3c22ec3d708be99d6e55680573e1","mimeType":"image/png"}
                # Let's map by file size or extension.
                # Let's check:
                # image.png maps to PNG file (size 71357) -> make_binary_files/ad6c20b4581d3c22ec3d708be99d6e55680573e1
                # Let's find if the thumbnail data matches.
                # Wait, we can write the extracted file. Let's map them:
                # 1. image.png (guid 62:24) -> png (ad6c20b4581d3c22ec3d708be99d6e55680573e1)
                # 2. phan-mem-giu-xe-pth-parking-300x300-1.jpg (guid 5:4) -> jpeg (a00affebe8f922f98f1ec1862f8f1a71785958c4)
                # 3. quan-ly-doanh-thu-tren-phan-mem-may-giu-xe-tu-xa-300x300.jpg (guid 5:2) -> jpeg (5a544e90765150c0aedc65db7cb26a06e05b15bc)
                # 4. cac-cong-nghe-cot-loi-duoc-ung-dung-trong-phan-mem-giu-xe-pth-300x300.jpg (guid 5:5) -> jpeg (8ed4632513430d1f70d61cdae9ab7931ea47846e)
            except Exception as e:
                print(f"Error reading JSON for {blob_path}: {e}")

        # Let's write the binary files directly to their target names:
        direct_mapping = {
            "make_binary_files/ad6c20b4581d3c22ec3d708be99d6e55680573e1": "src/imports/image.png",
            "make_binary_files/a00affebe8f922f98f1ec1862f8f1a71785958c4": "src/imports/phan-mem-giu-xe-pth-parking-300x300-1.jpg",
            "make_binary_files/5a544e90765150c0aedc65db7cb26a06e05b15bc": "src/imports/quan-ly-doanh-thu-tren-phan-mem-may-giu-xe-tu-xa-300x300.jpg",
            "make_binary_files/8ed4632513430d1f70d61cdae9ab7931ea47846e": "src/imports/cac-cong-nghe-cot-loi-duoc-ung-dung-trong-phan-mem-giu-xe-pth-300x300.jpg"
        }

        for zip_p, local_p in direct_mapping.items():
            try:
                data = z.read(zip_p)
                with open(local_p, "wb") as f_out:
                    f_out.write(data)
                print(f"Successfully extracted {zip_p} -> {local_p}")
            except Exception as e:
                print(f"Error extracting {zip_p}: {e}")
                
except Exception as e:
    print(f"Error: {str(e)}")
