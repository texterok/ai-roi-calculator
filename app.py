from flask import Flask

app = Flask(__name__)

from roi_calculator import roi_bp
app.register_blueprint(roi_bp, url_prefix="/roi")


@app.route("/")
def index():
    return '<meta http-equiv="refresh" content="0;url=/roi/">'


if __name__ == "__main__":
    app.run(debug=True, port=5001)
