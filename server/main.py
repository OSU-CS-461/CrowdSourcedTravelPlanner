from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)


@app.route("/api/hello")
def api_hello():
    return jsonify({"message": "Hello from the API!"})


@app.route("/")
def index():
    # TODO: redirect when in local environment (to client server)
    return send_from_directory(app.static_folder, "index.html")


# Serve static files (e.g. JS, CSS, images)
@app.route("/<path:path>")
def serve_static(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    else:
        # Fall back to index/SPA (for routes that were not matched)
        return send_from_directory(app.static_folder, "index.html")
