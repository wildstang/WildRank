import socketserver, http.server, logging, base64, zipfile
from os import listdir, environ, mkdir, rename, remove
from os.path import isfile, join, exists
from shutil import copyfile
from base64 import b64decode

PORT = 80
UPLOAD_PATH = 'uploads/'
VALID_PATHS = ['/config', '/scripts', '/styles', '/uploads', '/favicon.ico', '/index.html', '/manifest.webmanifest', '/pwa.js', '/selection.html', '/?']

TBA_KEY = environ.get('TBA_KEY')

class ServerHandler(http.server.SimpleHTTPRequestHandler):

    # default response
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        logging.error(self.headers)
        print(self.path)
        files = []
        
        # about page, used to check server version
        if self.path == '/getZip':
            # zip up uploads directory
            file = 'tmp.zip'
            with zipfile.ZipFile(file, 'w', zipfile.ZIP_DEFLATED) as zip:
                for f in listdir(UPLOAD_PATH):
                    if isfile(join(UPLOAD_PATH, f)):
                        zip.write(join(UPLOAD_PATH, f), f)
            
            # read the zip as binary and upload
            with open(file, 'rb') as f:
                self.send_response(200)
                self.send_header('Content-type', 'application/zip')
                self.end_headers()
                self.wfile.write(f.read())
            
            # delete zip
            remove(file)
            
        elif self.path == '/about':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            # add git commit and link if this is a repo
            git = ''
            if exists('.git/FETCH_HEAD'):
                with open('.git/FETCH_HEAD', 'r') as f:
                    commit = f.read()
                    words = commit.split()
                    url = '{0}/commit/{1}'.format(words[-1].replace(':', '/'), words[0])
                    if not url.startswith('http'):
                        url = 'https://{}'.format(url)
                    git = '<br><br>Git: <a href="{0}">{1}</a>'.format(url, commit)
            
            self.wfile.write(str.encode('<!DOCTYPE html><html lang="en"><html><head><meta charset="utf-8"/><title>WildRank</title></head><body><h1>WildRank</h1>post-server.py Python3 POST server<br>2022 WildStang Robotics<br><a href="https://github.com/WildStang/WildRank">MPL Licensed on GitHub</a>{}</body></html>'.format(git)))

        elif self.path.startswith('/scripts/keys.js') and TBA_KEY is not None:
            self.send_response(200)
            self.send_header('Content-type', 'text/js')
            self.end_headers()
            self.wfile.write(str.encode('API_KEY="{0}"'.format(TBA_KEY)))

        else:
            # check if its a known file
            for path in VALID_PATHS:
                if self.path.startswith(path) or self.path == '/':
                    return http.server.SimpleHTTPRequestHandler.do_GET(self)

            # send 404 otherwise
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(str.encode('<!DOCTYPE html><html lang="en"><html><head><meta charset="utf-8"/><title>WildRank</title></head><body><h1>WildRank - 404</h1>{0} not found!</body></html>'.format(self.path)))

    # allow requests without credentials
    def end_headers (self):
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    # receive results uploads
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        logging.info('POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n',
                str(self.path), str(self.headers), post_data.decode('utf-8'))

        # make response
        self._set_response()
        self.wfile.write('POST request for {}'.format(self.path).encode('utf-8'))

        # save result
        file = 'tmp.zip'
        with open(file, 'wb') as f:
            f.write(b64decode(post_data))

        # extract zip
        with zipfile.ZipFile(file, 'r') as zip:
            zip.extractall(UPLOAD_PATH)
        
        # delete zip
        remove(file)

# make config if not exists
if not exists('config'):
    mkdir('config')

# setup config if not
for f in listdir('assets'):
    aFile = join('assets', f)
    cFile = join('config', f)
    if not isfile(cFile):
        copyfile(aFile, cFile)

# start HTTP server
Handler = ServerHandler
httpd = socketserver.TCPServer(('', PORT), Handler)
print('Serving at port: ', PORT)
httpd.serve_forever()