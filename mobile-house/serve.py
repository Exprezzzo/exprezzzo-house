#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)

print("🏠 EXPREZZZO Mobile House - Static Server")
print(f"📱 Serving on http://localhost:{PORT}")
print("🌙 Perfect for overnight mobile testing!")
print("Press Ctrl+C to stop")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()