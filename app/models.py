from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_login import UserMixin
from app.exceptions import ValidationError
from . import db, login_manager
from flask_dance.consumer.storage.sqla import OAuthConsumerMixin

class OAuth(OAuthConsumerMixin, db.Model):
    pass

class User(UserMixin, db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, unique=True, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(64), unique=True, index=True)
    member_since = db.Column(db.DateTime(), default=datetime.utcnow)
    last_seen = db.Column(db.DateTime(), default=datetime.utcnow)
    
    
    def ping(self):
        self.last_seen = datetime.utcnow()
        db.session.add(self)

    
    def __repr__(self):
        return '<User %r>' % self.username


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))