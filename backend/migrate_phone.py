import sqlite3
import os

db_file = os.path.join("backend", "smart_grid_cyber.db")
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
cols = [col[1] for col in cursor.fetchall()]
if "phone_number" not in cols:
    cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30)")
    cursor.execute("UPDATE users SET phone_number = '+91 9876543210' WHERE username = 'operator'")
    conn.commit()
    print("Migration SUCCESS: Added phone_number column to users table.")
else:
    print("phone_number column already exists.")

conn.close()
