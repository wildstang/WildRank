# csv2xls.py
# Liam Fruzyna 2020-05-21
# Convert a LiamRank CSV file export to an Excel Spreadsheet with Sheets

from openpyxl import Workbook
from openpyxl.utils.dataframe import dataframe_to_rows
import pandas as pd
import sys

# read in the given csv file
if len(sys.argv) < 2:
    sys.exit('No CSV file provided, exiting')
df = pd.read_csv(sys.argv[1])

# create workbook and sheets
wb = Workbook()
wb.create_sheet('pit')
wb.create_sheet('match')
wb.create_sheet('notes')

# add each row of csv to workbook
for row in dataframe_to_rows(df, index=False, header=True):
    kind = row[2]
    if kind != 'kind':
        # add each row
        if kind == 'pit':
            ws = wb['pit']
        elif kind == 'match':
            ws = wb['match']
        elif kind == 'notes':
            ws = wb['notes']
        else:
            continue
        ws.append(row)
    else:
        # add header to each sheet
        wb['pit'].append(row)
        wb['match'].append(row)
        wb['notes'].append(row)

# write workbook to file
wb.save('export.xlsx')