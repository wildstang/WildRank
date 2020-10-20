import socketserver, http.server, logging, base64
from os import listdir, environ
from os.path import isfile, join

PORT = 80
UPLOAD_PATH = 'uploads/'
VALID_PATHS = ['/config', '/scripts', '/styles', '/uploads', '/favicon.ico', '/index.html', '/selection.html', '/?']

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

        # request for results
        if self.path == '/getPitResultNames':
            files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f)) and f.startswith('pit-') and f.endswith('.json')]
        elif self.path == '/getImageNames':
            files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f)) and f.startswith('image-') and f.endswith('.png')]
        elif self.path == '/getMatchResultNames':
            files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f)) and f.startswith('match-') and f.endswith('.json')]
        elif self.path == '/getNoteNames':
            files = [f for f in listdir(UPLOAD_PATH) if isfile(join(UPLOAD_PATH, f)) and f.startswith('note-') and f.endswith('.json')]
        
        # about page, used to check server version
        elif self.path == '/about':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(str.encode('<!DOCTYPE html><html lang="en"><html><head><meta charset="utf-8"/><title>LiamRank</title></head><body><h1>Liam Rank</h1>post-server.py Python3 POST server<br>2020 Liam Fruzyna<br><a href="https://github.com/mail929/LiamRank">MPL Licensed on GitHub</a></body></html>'))
            return

        elif self.path.startswith('/scripts/keys.js') and TBA_KEY is not None:
            self.send_response(200)
            self.send_header('Content-type', 'text/js')
            self.end_headers()
            self.wfile.write(str.encode('API_KEY="{0}"'.format(TBA_KEY)))
            return

        else:
            # check if its a known file
            for path in VALID_PATHS:
                if self.path.startswith(path) or self.path == '/':
                    return http.server.SimpleHTTPRequestHandler.do_GET(self)
            
            # send 404 otherwise
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(str.encode('<!DOCTYPE html><html lang="en"><html><head><meta charset="utf-8"/><title>LiamRank</title></head><body><h1>Liam Rank - 404</h1>{0} not found!</body></html>'.format(self.path)))
            return

        # send joined results
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(str.encode(','.join(files)))

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
        upload = post_data.decode('utf-8').split('|||')
        if len(upload) > 1:
            file = upload[0]
            content = upload[1]

            if 'data:image/png;base64,' in content:
                file += '.png'
                content = content.replace('data:image/png;base64,', '')
                with open(UPLOAD_PATH + file, 'wb') as f:
                    f.write(base64.b64decode(content))
                return
            elif '.' not in file:
                file += '.json'

            with open(UPLOAD_PATH + file, 'w') as f:
                f.write(content)

# start HTTP server
Handler = ServerHandler
httpd = socketserver.TCPServer(('', PORT), Handler)
print('Serving at port: ', PORT)
httpd.serve_forever()