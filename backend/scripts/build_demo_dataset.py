"""
Deterministic Demo Dataset Builder (SIH26166).
Validates and coordinates the four primary real pairs assets,
ensures directory structures, and generates authoritative metadata.
"""

import os
import sys
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)

from scripts.build_demo_data_files import main as build_data_files

def mirror_assets():
    """Ensures all pair images and JSON files are present in both data/demo and backend/data/demo."""
    src_pairs = os.path.join(BASE_DIR, "data", "demo", "pairs")
    dst_pairs = os.path.join(BASE_DIR, "backend", "data", "demo", "pairs")
    os.makedirs(dst_pairs, exist_ok=True)

    if os.path.exists(src_pairs):
        for item in os.listdir(src_pairs):
            s_item = os.path.join(src_pairs, item)
            d_item = os.path.join(dst_pairs, item)
            if os.path.isdir(s_item):
                os.makedirs(d_item, exist_ok=True)
                for f in os.listdir(s_item):
                    shutil.copy2(os.path.join(s_item, f), os.path.join(d_item, f))
            else:
                shutil.copy2(s_item, d_item)
    print("Asset directories synchronized.")

def main():
    print("--- Building SIH26166 Authoritative Demo Dataset ---")
    build_data_files()
    mirror_assets()
    print("Demo dataset build completed successfully.")

if __name__ == "__main__":
    main()
