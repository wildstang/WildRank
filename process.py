import pandas as pd
from os import listdir
from os.path import isfile, join

UPLOAD_PATH = 'uploads'

def parseJSON():
    pits = []
    matches = []

    files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f))]
    for file in files:
        df = pd.read_json(join(UPLOAD_PATH, file), orient='records')
        fileparts = file.split('.')
        if fileparts[1] == 'json':
            parts = fileparts[0].split('-')
            if parts[0] == 'pit':
                df['event'] = parts[1]
                df['team'] = int(parts[2])
                df['key'] = parts[1] + '-' + parts[2]
                df.set_index(['key'])
                pits.append(df)
            elif parts[0] == 'match':
                df['event'] = parts[1]
                df['match'] = int(parts[2])
                df['team'] = int(parts[3])
                df['key'] = parts[1] + '-' + parts[2] + '-' + parts[3]
                df = df.set_index(['key'])
                matches.append(df)

    return pd.concat(pits), pd.concat(matches)

def getTeamMatches(df, event, team):
    return df[(df['team'] == team) & (df['event'] == event)]

def getMatchRecords(df, event, match):
    return df[(df['match'] == match) & (df['event'] == event)]

def columnStats(df, column):
    return df[column].describe()

def distribution(df, column):
    return df[column].value_counts()

pits, matches = parseJSON()

pits.to_csv('pits.csv')
matches.to_csv('matches.csv')