from flask import Blueprint
from flask_dance.contrib.github import make_github_blueprint

auth = Blueprint('auth', __name__)
github_blueprint = make_github_blueprint(scope="repo")
