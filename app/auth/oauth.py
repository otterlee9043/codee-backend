import os
from flask_dance.contrib.github import make_github_blueprint
from flask_dance.consumer.storage.sqla import SQLAlchemyStorage
from ..models import OAuth
from . import auth
from .. import db


github_blueprint = make_github_blueprint(
    scope="repo,user",
    storage=SQLAlchemyStorage(OAuth, db.session),
    redirect_url="/auth/login"
)

