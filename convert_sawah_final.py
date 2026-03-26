import os
import sys
import psycopg2
from pathlib import Path
from rio_cogeo.cogeo import cog_translate
from rio_cogeo.profiles import cog_profiles
from supabase import create_client
import rasterio
import warnings

warnings.filterwarnings('ignore')

# Fix PROJ on Windows
proj_path = os.path.join(r"E:\Dashboard\backend-capstone-aal\myenv311", "Lib", "site-packages", "pyproj", "proj_dir", "share", "proj")
if os.path.exists(proj_path):
    os.environ['PROJ_LIB'] = proj_path

SUPABASE_URL = "https://upcxonhddesvrvttvjjt.supabase.co"
SUPABASE_KEY = ""
STORAGE_BUCKET = "geotiff-cogs"
DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres.upcxonhddesvrvttvjjt"
DB_PASSWORD = "@Guyengan123"

def get_db():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)

def process_file(src_path: Path):
    dest_name = f"cog_{src_path.name}"
    cog_path = src_path.parent / dest_name
    print(f"\nProcessing {src_path.name}...")

    # 1. Convert directly to COG (since user set CRS manually)
    prof = cog_profiles.get("lzw")
    try:
        with rasterio.open(str(src_path)) as src:
            cog_translate(src, str(cog_path), prof, quiet=True)
        print("  COG translation done.")
    except Exception as e:
        print(f"  [ERROR] COG translation failed: {e}")
        return

    # 2. Upload to Supabase
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        with open(str(cog_path), 'rb') as f:
            supabase.storage.from_(STORAGE_BUCKET).upload(
                path=dest_name, file=f, file_options={"content-type": "image/tiff", "upsert": "true"}
            )
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{dest_name}"
        print(f"  Upload OK -> {public_url}")
    except Exception as e:
        print(f"  [ERROR] Upload failed: {e}")
        return

    # 3. Log to DB
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM raster_metadata WHERE filename = %s OR filename = %s", (src_path.name, f"cog_{src_path.name}"))
        cur.execute(
            "INSERT INTO raster_metadata (filename, storage_path, public_url) VALUES (%s, %s, %s)",
            (src_path.name, dest_name, public_url)
        )
        conn.commit()
        conn.close()
        print("  DB Log OK")
    except Exception as e:
        print(f"  [ERROR] DB log failed: {e}")
        return

    # Cleanup local COG
    if cog_path.exists():
        cog_path.unlink()
        print("  Cleaned up local COG file.")

def main():
    sawah_dir = Path(r"E:\Dashboard\Data\Exposure\sawah")
    files = list(sawah_dir.glob("*.tif"))
    files = [f for f in files if not f.name.startswith("cog_")]
    print(f"Found {len(files)} files: {[f.name for f in files]}")
    for f in files:
        process_file(f)
    print("ALL DONE")

if __name__ == "__main__":
    main()
