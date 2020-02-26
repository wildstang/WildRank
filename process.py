import pandas as pd
from os import listdir
from os.path import isfile, join

UPLOAD_PATH = 'uploads'

def parseUploads():
    files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f))]

    pits = []
    matches = []

    for file in files:
        df = pd.read_json(join(UPLOAD_PATH, file), orient='records')
        fileparts = file.split('.')
        if fileparts[1] == 'json':
            parts = fileparts[0].split('-')
            if parts[0] == 'pit':
                df['event'] = parts[1]
                df['team'] = parts[2]
                df.set_index(['team'])
                pits.append(df)
            elif parts[0] == 'match':
                df['event'] = parts[1]
                df['match'] = parts[2]
                df['team'] = parts[3]
                df = df.set_index(['match', 'team'])
                matches.append(df)

    return pd.concat(pits), pd.concat(matches)
    
pits, matches = parseUploads()

pits.to_csv('pits.csv')
matches.to_csv('matches.csv')