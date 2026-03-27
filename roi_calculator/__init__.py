from flask import Blueprint

roi_bp = Blueprint(
    "roi_calculator",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/static",
)

from roi_calculator.routes import *
