from flask import redirect, request, url_for, flash, session
from flask_login import login_user, logout_user, login_required, \
    current_user
from . import auth
from .. import db
from ..models import User
from flask_login import logout_user
import os, requests, json



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
        print(f"resp_data: {resp_data}")
        session['access_token'] = resp_data['access_token']
        print(session)
        headers['Authorization'] = f"Bearer {session['access_token']}"
        user_resp = requests.get("https://api.github.com/user", headers=headers)
        if user_resp.ok:
            account_info = user_resp.json()
            user = save_or_update(account_info)
            login_user(user, remember=False)
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
    revoke_access_token()
    flash('You have been logged out.')
    return redirect(url_for('main.index'))

def revoke_access_token():
    client_id = os.environ.get('GITHUB_OAUTH_CLIENT_ID')
    access_token = session['access_token']
    session.pop('access_token', None)
    headers = {"Authorization": f"Bearer {access_token}",
    "Accept": "application/vnd.github+json"}

    response = requests.delete(f"https://api.github.com/applications/{client_id}/token", 
                        headers=headers,
                        data=json.dumps({"access_token": access_token}))
    if response.ok:
        print("Access token revoked successfully.")
    else:
        print(f"Failed to revoke access token: {response.status_code} - {response.json()['message']}")
