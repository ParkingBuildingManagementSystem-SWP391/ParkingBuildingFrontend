import zipfile
import xml.etree.ElementTree as ET
import glob
import sys

# Force UTF-8 output encoding for Windows command line console
sys.stdout.reconfigure(encoding='utf-8')

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            paragraphs = []
            for elem in root.iter():
                if elem.tag.endswith('t'):
                    if elem.text:
                        paragraphs.append(elem.text)
            return " ".join(paragraphs)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

docx_files = glob.glob("info/*.docx")
for f in docx_files:
    print(f"=== File: {f} ===")
    text = get_docx_text(f)
    print(text[:1500])
    print("\n" + "="*40 + "\n")
