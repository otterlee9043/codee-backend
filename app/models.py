from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_login import UserMixin
from app.exceptions import ValidationError
from sqlalchemy import event, Table, MetaData
from . import db, login_manager


class MySession(db.Model):
    __table__ = db.Model.metadata.tables['codee.sessions']

@db.event.listens_for(MySession, 'before_insert')
def validate_record_before_insert(mapper, connection, target):
    print(">>>>>> EVENT HANDLER WORKING!")
    if 'certain_string' in target.column_name:
        return

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

class Token(db.Model):
    __tablename__ = 'token'
    id = db.Column(db.Integer, primary_key=True)
    access_token = db.Column(db.String(100), unique=True)
    user_id = db.Column(db.Integer, db.ForeignKey(User.id))


class Test(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))