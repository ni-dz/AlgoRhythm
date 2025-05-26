import csv
import sqlite3
import json
import os

# Pfad zur .db
db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'algorhythm-frontend', 'songs.db')
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# Verbindung zur Datenbank
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
print("Connected to database at:", db_path)

# Tabelle neu erstellen mit allen gewünschten Features
cursor.execute("DROP TABLE IF EXISTS song_search")
cursor.execute("DROP TABLE IF EXISTS songs")
cursor.execute("""
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  name TEXT,
  artist TEXT,
  danceability REAL,
  energy REAL,
  loudness REAL,
  speechiness REAL,
  acousticness REAL,
  instrumentalness REAL,
  liveness REAL,
  valence REAL,
  tempo REAL,
  url TEXT
)
""")

# CSV laden
csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'all_data.csv')
with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        artists = row['artists'].replace("'", '"')
        try:
            artist = ', '.join(json.loads(artists))
        except:
            artist = artists

        cursor.execute("""
            INSERT INTO songs (
              id, name, artist, danceability, energy, loudness,
              speechiness, acousticness, instrumentalness,
              liveness, valence, tempo, url
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row['id'],
            row['name'],
            artist,
            float(row['danceability']) if row['danceability'] else None,
            float(row['energy']) if row['energy'] else None,
            float(row['loudness']) if row['loudness'] else None,
            float(row['speechiness']) if row['speechiness'] else None,
            float(row['acousticness']) if row['acousticness'] else None,
            float(row['instrumentalness']) if row['instrumentalness'] else None,
            float(row['liveness']) if row['liveness'] else None,
            float(row['valence']) if row['valence'] else None,
            float(row['tempo']) if row['tempo'] else None,
            row['embed_urls']
        ))

conn.commit()
conn.close()
print("Database initialized successfully.")
