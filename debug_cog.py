"""
Download each sawah COG from Supabase and check actual georaster min/max values.
Run with myenv311 python.
"""
import urllib.request, io, struct
import psycopg2

DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres.upcxonhddesvrvttvjjt"
DB_PASSWORD = "@Guyengan123"

def get_db():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)

conn = get_db()
cur = conn.cursor()
cur.execute("SELECT filename, public_url FROM raster_metadata WHERE filename ILIKE '%sawah%' ORDER BY filename")
rows = cur.fetchall()
conn.close()

import rasterio, numpy as np
for fname, url in rows:
    try:
        data = urllib.request.urlopen(url).read()
        with rasterio.open(io.BytesIO(data)) as src:
            arr = src.read(1)
            uniq = set(arr.flatten())
            print(f"\n{fname}:")
            print(f"  CRS: {src.crs}")
            print(f"  Bounds: {src.bounds}")
            print(f"  NoData: {src.nodata}")
            print(f"  dtype: {src.dtypes[0]}")
            print(f"  min={arr.min()}, max={arr.max()}")
            print(f"  Unique values (first 20): {sorted(list(uniq))[:20]}")
    except Exception as e:
        print(f"\n{fname}: ERROR - {e}")
