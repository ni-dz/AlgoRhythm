import csv
import sqlite3
import json
import os

# normalize function to scale values between 0 and 1
def normalize(value, min_val, max_val):
    return (float(value) - min_val) / (max_val - min_val)

# path to the database file
db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'algorhythm-frontend', 'songs.db')
os.makedirs(os.path.dirname(db_path), exist_ok=True)

# connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
print("Connected to database at:", db_path)

# create tables
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

# load csv file and insert data into the database
csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'all_data.csv')
with open(csv_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        artists = row['artists'].replace("'", '"')
        try:
            artist = ', '.join(json.loads(artists))
        except:
            artist = artists

        # get raw values and convert to float
        danceability = float(row['danceability']) if row['danceability'] else None
        energy = float(row['energy']) if row['energy'] else None
        loudness_raw = float(row['loudness']) if row['loudness'] else None
        speechiness = float(row['speechiness']) if row['speechiness'] else None
        acousticness = float(row['acousticness']) if row['acousticness'] else None
        instrumentalness = float(row['instrumentalness']) if row['instrumentalness'] else None
        liveness = float(row['liveness']) if row['liveness'] else None
        valence = float(row['valence']) if row['valence'] else None
        tempo_raw = float(row['tempo']) if row['tempo'] else None

        # Nnormalize raw values
        loudness_norm = normalize(loudness_raw, -60, 7.234) if loudness_raw is not None else None
        tempo_norm = normalize(tempo_raw, 0, 250) if tempo_raw is not None else None

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
            danceability,
            energy,
            loudness_norm,       # normalized
            speechiness,
            acousticness,
            instrumentalness,
            liveness,
            valence,
            tempo_norm,          # normalized
            row['embed_urls']
        ))

conn.commit()
conn.close()
print("Database initialized successfully with normalized loudness and tempo.")
