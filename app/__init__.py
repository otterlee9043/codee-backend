from flask import Flask
from flask_mail import Mail
from flask_bootstrap import Bootstrap
from flask_moment import Moment
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_pagedown import PageDown
from config import config
from flask_session import Session, SqlAlchemySessionInterface
import mysql.connector


mail = Mail()
bootstrap = Bootstrap()
moment = Moment()
db = SQLAlchemy()
pagedown = PageDown()

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
sess = Session()

def create_app(config_name):
    app = Flask(__name__)
    
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    mail.init_app(app)
    bootstrap.init_app(app)
    moment.init_app(app)
    db.init_app(app)
    
    login_manager.session_protection = None
    login_manager.init_app(app)
    pagedown.init_app(app)
    sess.init_app(app)

    app.config['SESSION_SQLALCHEMY'] = db
    
    with app.app_context():
        print("db.create_all()")
        db.create_all()
        db.session.commit()
    
    from .api import api as api_blueprint
    app.register_blueprint(api_blueprint, url_prefix='/api/v1')

    from .main import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')

    return app
