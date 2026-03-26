import psycopg2
conn = psycopg2.connect(host='aws-1-ap-southeast-1.pooler.supabase.com', port='5432', dbname='postgres', user='postgres.upcxonhddesvrvttvjjt', password='@Guyengan123')
cur = conn.cursor()
cur.execute("SELECT filename, public_url FROM raster_metadata WHERE filename ILIKE '%sawah%' ORDER BY filename")
rows = cur.fetchall()
print(f"Db has {len(rows)} sawah rows:")
for r in rows: print(r[0])
conn.close()
