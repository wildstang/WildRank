import socketserver
import http.server
import logging

PORT = 80

class ServerHandler(http.server.SimpleHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        logging.error(self.headers)
        http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        logging.info('POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n',
                str(self.path), str(self.headers), post_data.decode('utf-8'))

        self._set_response()
        self.wfile.write('POST request for {}'.format(self.path).encode('utf-8'))
        upload = post_data.decode('utf-8').split('|||')
        with open('uploads/' + upload[0] + '.json', 'w') as f:
            f.write(upload[1])

Handler = ServerHandler

httpd = socketserver.TCPServer(('', PORT), Handler)

print('Serving at port: ', PORT)
httpd.serve_forever()