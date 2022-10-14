from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from starlette.exceptions import HTTPException
from pydantic import BaseModel

import re, requests, sys
from os import listdir, remove, getenv
from os.path import getmtime, exists, isfile, join
from datetime import datetime as dt
from zipfile import ZipFile, ZIP_DEFLATED
from base64 import b64decode, b64encode

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
PASSWORD = getenv('WILDRANK_PASSWORD')


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
    try:
        requests.get(url='https://wildrank.app/report', params={'host': host, 'port': port})
    except:
        pass


# create an instance of FastAPI
app = FastAPI()


# Object representing what is returned in response to a POST request
class POSTResponse(BaseModel):
    success: bool
    count: int

# Object representing what is returned in response to a photo POST request
class PhotoPOSTResponse(BaseModel):
    success: bool
    name: str


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

@app.get('/scripts/misc/{file}.js', response_class=FileResponse)
async def misc_javascript(file):
    return f'scripts/misc/{file}.js'

@app.get('/scripts/libs/{file}.js', response_class=FileResponse)
async def lib_javascript(file):
    return f'scripts/libs/{file}.js'

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
    return 'config/manifest.webmanifest'

@app.get('/pwa.js', response_class=FileResponse)
async def manifest():
    return 'scripts/pwa.js'

@app.get('/favicon.ico', response_class=FileResponse)
async def favicon():
    return 'assets/favicon.ico'

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

    if exists('scripts/pwa.js'):
        with open('scripts/pwa.js', 'r') as f:
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
                server.py Python3 FastAPI POST server<br>\
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


# build a zip archive tmp.zip containing the contents of UPLOAD_PATH
def build_zip(event_id='', event_data=True, results=True, scout_configs=True, smart_stats=True, coach_config=True, settings=True, picklists=True, whiteboard=True, avatars=True, pictures=True):
    # determine year from event id
    year = ''
    if len(event_id) > 4:
        year = year[:4]

    # zip up uploads directory
    file = 'tmp.zip'
    count = 0
    with ZipFile(file, 'w', ZIP_DEFLATED) as zip:
        for f in listdir(UPLOAD_PATH):
            # NOTE: we intentionally ignore directories here
            #   we don't want to pass around other servers' images for them
            if isfile(join(UPLOAD_PATH, f)) and \
                ((pictures and (f.endswith('.png') or f.endswith('.jpg'))) or \
                    (f.endswith('.json') and ( \
                        (event_data and event_id in f and (f.startswith('teams-') or f.startswith('matches-') or f.startswith('rankings-'))) or \
                        (results and event_id in f and (f.startswith('match-') or f.startswith('pit-'))) or \
                        (scout_configs and (f.startswith(f'config-{year}') and (f.endswith('-pit') or f.endswith('-match')))) or \
                        (smart_stats and (f.startswith(f'config-{year}') and f.endswith('-smart_stats'))) or \
                        (coach_config and (f.startswith(f'config-{year}') and f.endswith('-coach'))) or \
                        (settings and f.startswith('config-') and not f.startswith(f'config-{year}')) or \
                        (avatars and f.startswith(f'avatar-{year}')) or \
                        (picklists and event_id in f and f.startswith(f'picklists-')) or \
                        (whiteboard and (f.startswith(f'config-{year}') and f.endswith('-whiteboard'))) \
                    )) \
                ):
                zip.write(join(UPLOAD_PATH, f), f)
                count += 1
    
    return file, count


# build request of data in /uploads
@app.get('/getZip', response_class=FileResponse)
async def zip():
    return build_zip()[0]


# build request of data in /uploads
@app.get('/listPics', response_class=JSONResponse)
async def pics():
    pics = {}

    for f in listdir(UPLOAD_PATH):
        # look at all png files with a "-"
        if isfile(join(UPLOAD_PATH, f)) and f.endswith('.png') and '-' in f:
            team = f.split('-')[0]

            # add team to dict
            if team not in pics:
                pics[team] = []
            
            pics[team].append(f)
    
    return pics


# build request of data in /uploads
@app.get('/export', response_class=JSONResponse)
async def export(to='', password='', event_id='', event_data:bool=True, results:bool=True, scout_configs:bool=True, smart_stats:bool=True, coach_config:bool=True, settings:bool=True, picklists:bool=True, whiteboard:bool=True, avatars:bool=True, pictures:bool=True):
    file, count = build_zip(event_id, event_data, results, scout_configs, smart_stats, coach_config, settings, picklists, whiteboard, avatars, pictures)

    b64file = ''
    with open(file, 'rb') as f:
        b64file = b64encode(f.read())

    result = 0
    try:
        response = requests.post(url=f'{to}?password={password}', data=b64file)
        remove(file)
        if not response.json()['success'] or count == response.json()['count']:
            return response.json()
    except:
        result = -3

    # delete zip
    if exists(file):
        remove(file)
    return {
        'success': False,
        'count': result
    }


# response to POST requests containing base64 encoded zip data
@app.post('/', response_model=POSTResponse)
async def post(upload: UploadFile = File(...), password=''):
    # check server password if there is one
    if PASSWORD is not None and password != PASSWORD:
        return {
            'success': False,
            'count': -1
        }

    # save result
    file = 'tmp.zip'
    with open(file, 'wb') as f:
        f.write(upload.file.read())

    # extract zip
    files = 0
    success = True
    try:
        with ZipFile(file, 'r') as zip:
            zip.extractall(UPLOAD_PATH)
            files = len([f for f in zip.namelist() if not f.endswith('/')])
    except:
        success = False
        files = -2
    
    # delete zip
    if exists(file):
        remove(file)
    
    # send response
    return {
        'success': success,
        'count': files
    }

# response to POST requests containing base64 encoded zip data
@app.post('/photo/{team_num}', response_model=PhotoPOSTResponse)
async def post(team_num, upload: UploadFile = File(...), password=''):
    # check server password if there is one
    if PASSWORD is not None and password != PASSWORD:
        return {
            'success': False,
            'name': 'Invalid password'
        }

    # determine file name
    num = 0
    file = f'{UPLOAD_PATH}{team_num}-{num}.png'
    while exists(file):
        num += 1
        file = f'{UPLOAD_PATH}{team_num}-{num}.png'

    # save image
    with open(file, 'wb') as f:
        f.write(upload.file.read())
    
    # send response
    return {
        'success': True,
        'name': file
    }


# respond to exceptions (non-matching requests)
@app.exception_handler(HTTPException)
@app.exception_handler(RuntimeError)
async def custom_http_exception_handler(request, exc):
    if request.url.path.endswith('.json'):
        return JSONResponse(content={}, status_code=404)
    else:
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