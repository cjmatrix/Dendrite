import sys
import json
import logging
from docling.document_converter import DocumentConverter

# Disable unnecessary logging for clean stdout
logging.getLogger("docling").setLevel(logging.ERROR)

def run_extraction(file_path):
    try:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        markdown_text = result.document.export_to_markdown()
        
        # Output ONLY the JSON to stdout
        print(json.dumps({"markdown": markdown_text}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
    else:
        run_extraction(sys.argv[1])
