from flask import render_template, redirect, request, url_for, flash, session, current_app
from flask_login import login_user, logout_user, login_required, \
    current_user
from . import auth
from .. import db
from ..models import User
from flask_login import logout_user
import os, requests



@auth.route('/login', methods=['GET'])
def login():
    print("auth/login")
    return redirect(f"https://github.com/login/oauth/authorize?scope=repo&client_id={os.environ.get('GITHUB_OAUTH_CLIENT_ID')}")


@auth.route('/access-token', methods=['GET'])
def get_access_token():
    code = request.args.get('code')
    query = {
        'client_id': os.environ.get('GITHUB_OAUTH_CLIENT_ID'),
        'client_secret': os.environ.get('GITHUB_OAUTH_CLIENT_SECRET'),
        'code': code
    }
    headers = {'Accept': 'application/json'}
    resp = requests.post(
        "https://github.com/login/oauth/access_token", params=query, headers=headers)
    if resp.ok:
        resp_data = resp.json()
        session['access_token'] = resp_data['access_token']
        headers['Authorization'] = f"Bearer {session['access_token']}"
        user_resp = requests.get("https://api.github.com/user", headers=headers)
        if user_resp.ok:
            account_info= user_resp.json()
            user = save_or_update(account_info)
            login_user(user)
    return redirect(url_for("main.index"))


def save_or_update(user_info):
    username = user_info['login']
    user = User.query.filter_by(username=username).first()
    if user:
        user.email = user_info['email']
    else:
        user = User(username=username, email=user_info['email'])
    db.session.add(user)
    db.session.commit()
    return user


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('main.index'))
