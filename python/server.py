from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse
from starlette.exceptions import HTTPException
from pydantic import BaseModel

import re, requests, sys
from os import listdir, remove
from os.path import getmtime, exists, isfile, join
from datetime import datetime as dt
from zipfile import ZipFile, ZIP_DEFLATED
from base64 import b64decode

"""
server.py

This is a FastAPI implementation of the previous post-server.py.
It allows a client (web browser) to access the necessary files and assets for the web app.
It also accepts post requests at / to upload zip files of JSON data.
Like post-server.py this should be executed from the root of the project.
Unlike post-server.py this is now executed with Uvicorn or another ASGI server.

uvicorn --host 0.0.0.0 --app-dir python server:app

Useful params:
--port PORT, default 8000
--workers NUM_WORKERS, default 1
"""

UPLOAD_PATH = 'uploads/'
REPORT = True
REPORT_FILE = 'reports.csv'


# pull out parameters for web server
port = 8000
if '--port' in sys.argv:
    try:
        port = int(sys.argv[sys.argv.index('--port')+1])
    except:
        pass
host = 'localhost'
if '--host' in sys.argv:
    host = sys.argv[sys.argv.index('--host')+1]


# get time of server start and creation
start = dt.now()
try:
    create = getmtime('python/server.py')
except:
    create = 0


# report instance to official instance
if REPORT:
    requests.get(url='https://wildrank.wildstang.dev/report', params={'host': host, 'port': port})


# create an instance of FastAPI
app = FastAPI()


# return requested files
@app.get('/', response_class=FileResponse)
async def index():
    return 'index.html'

@app.get('/{file}.html', response_class=FileResponse)
async def html(file):
    return f'{file}.html'

@app.get('/styles/{file}.css', response_class=FileResponse)
async def styles(file):
    return f'styles/{file}.css'

@app.get('/scripts/{file}.js', response_class=FileResponse)
async def javascript(file):
    return f'scripts/{file}.js'

@app.get('/config/{file}.json', response_class=FileResponse)
async def config(file):
    return f'config/{file}.json'

@app.get('/uploads/{file}.json', response_class=FileResponse)
async def upload(file):
    return f'uploads/{file}.json'

@app.get('/assets/{file}.png', response_class=FileResponse)
async def image(file):
    return f'assets/{file}.png'

@app.get('/assets/{file}.svg', response_class=FileResponse)
async def vector(file):
    return f'assets/{file}.svg'

@app.get('/manifest.webmanifest', response_class=FileResponse)
async def manifest():
    return 'manifest.webmanifest'

@app.get('/pwa.js', response_class=FileResponse)
async def manifest():
    return 'pwa.js'

@app.get('/favicon.ico', response_class=FileResponse)
async def favicon():
    return 'favicon.ico'

@app.get('/uploads/{file}.png', response_class=FileResponse)
async def image(file):
    return f'{UPLOAD_PATH}{file}.png'


# save server reports
@app.get('/report', response_class=HTMLResponse)
async def report(request: Request, host: str = '', port: int = 0):
    if not exists(REPORT_FILE):
        with open(REPORT_FILE, 'w') as f:
            f.write('IP,Datetime,Host,Port\n')

    with open(REPORT_FILE, 'a') as f:
        f.write(f'{request.client.host},{dt.now().strftime("%Y-%m-%d %H:%M:%S")},{host},{port}\n')

    return 'Instance reported!'


# build about page
@app.get('/about', response_class=HTMLResponse)
async def about():
    # add git commit and link if this is a repo
    git = ''
    release = ''

    if exists('.git/FETCH_HEAD'):
        with open('.git/FETCH_HEAD', 'r') as f:
            commit = f.read().strip()
            words = commit.split()
            url = '{0}/commit/{1}'.format(words[-1].replace(':', '/'), words[0])
            if not url.startswith('http'):
                url = 'https://{}'.format(url)
            git = f'Git: <a href="{url}">{words[0]}</a><br>'

    if exists('pwa.js'):
        with open('pwa.js', 'r') as f:
            script = f.read()
            try:
                release = re.search('const CACHE_NAME = \'wildrank-(.+?)\'', script).group(1)
                release = f'Release: {release}<br>'
            except AttributeError:
                pass

    return f'<!DOCTYPE html>\
        <html lang="en">\
            <head>\
                <meta charset="utf-8"/>\
                <title>WildRank</title>\
            </head>\
            <body>\
                <h1>WildRank</h1>\
                post-server.py Python3 POST server<br>\
                2020-{dt.now().year} <a href="https://wildstang.org">WildStang Robotics Program</a><br>\
                <a href="https://github.com/WildStang/WildRank">MPL Licensed on GitHub</a><br>\
                <br>\
                Server Created: {dt.fromtimestamp(create).strftime("%Y-%m-%d %H:%M:%S")}<br>\
                Up Since: {start.strftime("%Y-%m-%d %H:%M:%S")}<br>\
                Reporting: {REPORT}<br>\
                Host: {host}<br>\
                Internal Port: {port}<br>\
                {git}\
                {release}\
                <br>\
                Contributors:<br>\
                Liam Fruzyna (<a href="https://thebluealliance.com/team/111">111</a>, <a href="https://thebluealliance.com/team/112">112</a>)<br>\
            </body>\
        </html>'


# build request of data in /uploads
@app.get('/getZip', response_class=FileResponse)
async def zip():
    # zip up uploads directory
    file = 'tmp.zip'
    with ZipFile(file, 'w', ZIP_DEFLATED) as zip:
        for f in listdir(UPLOAD_PATH):
            if isfile(join(UPLOAD_PATH, f)) and f.endswith('.json'):
                zip.write(join(UPLOAD_PATH, f), f)
    
    return file


# Object representing what is returned in response to a POST request
class POSTResponse(BaseModel):
    success: bool
    count: int

# Object representing what is returned in response to a POST request
class PhotoPOSTResponse(BaseModel):
    success: bool
    name: str


# response to POST requests containing base64 encoded zip data
@app.post('/', response_model=POSTResponse)
async def post(request: Request):
    post_data = await request.body()

    # save result
    file = 'tmp.zip'
    with open(file, 'wb') as f:
        f.write(b64decode(post_data))

    # extract zip
    files = 0
    success = True
    try:
        with ZipFile(file, 'r') as zip:
            zip.extractall(UPLOAD_PATH)
            files = len(zip.infolist())
    except:
        success = False
    
    # delete zip
    remove(file)
    
    # send response
    return {
        'success': success,
        'count': files
    }

# response to POST requests containing base64 encoded zip data
@app.post('/photo/{team_num}', response_model=PhotoPOSTResponse)
async def post(team_num, request: Request):
    post_data = await request.body()

    # determine file name
    num = 0
    file = f'{UPLOAD_PATH}{team_num}-{num}.png'
    while exists(file):
        num += 1
        file = f'{UPLOAD_PATH}{team_num}-{num}.png'

    # save image
    with open(file, 'wb') as f:
        f.write(b64decode(post_data))
    
    # send response
    return {
        'success': True,
        'name': file
    }


# respond to exceptions (non-matching requests)
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return HTMLResponse(f'<!DOCTYPE html>\
        <html lang="en">\
            <head>\
                <meta charset="utf-8"/>\
                <title>WildRank</title>\
            </head>\
            <body>\
                <h1>WildRank</h1>\
                <h2>404 - Page Not Found</h2>\
            </body>\
        </html>', status_code=404)