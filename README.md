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

1. Download SQLite: https://www.sqlite.org/download.html
3. Download all datasets (df_1 to df_4) from kaggle and insert them into: ```/algorhythm-backend/data/```
4. Run ```data_transformation.ipynb```
5. Run ```initialize_db.py```

### 2. Setup Next.js App:

In console:

1. ```cd algorhythm-frontend```
2. ```npm install --legacy-peer-deps``` OR ```npm install --force```
3. ```npm run dev```
4. Open: ```http://localhost:3000```
