# AlgoRhythm
 DHBW - Projektrealisierung

## Member

Louis Hackstein (louis.hackstein@sap.com)

Maitreyi Hundekari (maitreyi.hundekari@sap.com)

Jan Waldmann (waldmjn@schaeffler.com)

Lukas Weißschädel (lukas.weissschaedel@sap.com)

Niklas Dziwisch (niklas.dziwisch@sap.com)

## Setup

### 1. Create Database

1. Download SQLite: https://www.sqlite.org/download.html OR ```brew install sqlite```
3. Download all datasets (df_1 to df_4) from kaggle and insert them into: ```/algorhythm-backend/data/```
   
   Dataset 1: https://www.kaggle.com/datasets/rodolfofigueroa/spotify-12m-songs
   
   Dataset 2: https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
   
   Dataset 3: https://www.kaggle.com/datasets/solomonameh/spotify-music-dataset
   
   Dataset 4: https://www.kaggle.com/datasets/ektanegi/spotifydata-19212020
   
5. Run ```data_transformation.ipynb```
6. Run ```initialize_db.py```

### 2. Setup Next.js App:

In console:

1. ```cd algorhythm-frontend```
2. ```npm install --legacy-peer-deps``` OR ```npm install --force```
3. ```npm run dev```
4. Open: ```http://localhost:3000```
