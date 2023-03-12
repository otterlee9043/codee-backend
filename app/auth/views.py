from flask import render_template, redirect, request, url_for, flash, session
from flask_login import login_user, logout_user, login_required, \
    current_user
from . import auth
from .. import db
from ..models import User
from .forms import LoginForm, RegistrationForm
from flask_dance.contrib.github import github
from flask_login import logout_user

import os, json
root = './app/static/files/'


@auth.before_app_request
def before_request():
    if current_user.is_authenticated:
        current_user.ping()

@auth.route('/login', methods=['GET', 'POST'])
def login():
    # form = LoginForm()
    # if form.validate_on_submit():
    #     user = User.query.filter_by(username=form.username.data).first()
    #     if user is not None and user.verify_password(form.password.data):
    #         login_user(user, form.remember_me.data)
    #         next = request.args.get('next')
    #         # if not is_safe_url(next):
    #         #     return flask.abort(400)
    #         if next is None or not next.startswith('/'):
    #             next = url_for('main.index')
    #         return redirect(next)
    #     flash('Invalid username or password.')
    # return render_template('auth/login.html', form=form)
    account_resp = github.get('/user')
    if account_resp.ok:
        account_info= account_resp.json()
        user = save_or_update(account_info)
        login_user(user)
    return redirect(url_for('main.index'))


@auth.route('/github/login')
def github_login():
    return redirect(url_for('github.login'))
    if not github.authorized:
        print("not authorized")
        return redirect(url_for('github.login'))
    else:
        account_resp = github.get('/user')
        if account_resp.ok:
            account_info= account_resp.json()
            user = save_or_update(account_info)
            login_user(user)
            return redirect(url_for('main.index'))

    return '<h1>Request failed!</h1>'

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
    print(current_user)
    logout_user()
    print(current_user)
    print(session)
    session.clear()
    print(session)
    flash('You have been logged out.')
    return redirect(url_for('main.index'))



@auth.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(email=form.email.data.lower(),
                    username=form.username.data)
        db.session.add(user)
        db.session.commit()
        token = user.generate_confirmation_token()
        gmail_send_message(user.email, 'Confirm Your Account', 'auth/email/confirm', user=user, token=token)
        flash('A confirmation email has been sent to you by email.')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html', form=form)


@auth.route('/confirm/<token>')
@login_required
def confirm(token):
    print("current_user.confirmed: ", current_user.confirmed)

    if current_user.confirmed:
        return redirect(url_for('main.index'))
    if current_user.confirm(token):
        db.session.commit()
        os.umask(0)
        print("new dir path: " + os.path.join(root, current_user.username))
        os.makedirs(os.path.join(root, current_user.username), exist_ok = True)
        flash('You have confirmed your account. Thanks!')
    else:
        flash('The confirmation link is invalid or has expired.')
    return redirect(url_for('main.index'))

@auth.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    gmail_send_message(current_user.email, 'Confirm Your Account', 
                    'auth/email/confirm', user=current_user, token=token)
        
    flash('A new confirmation email has been sent to you by email.')
    return redirect(url_for('main.index'))

@auth.route('/unconfirmed')
def unconfirmed():
    print("this is unconfirmed in auth/view.py")
    if current_user.is_anonymous or current_user.confirmed:
        return redirect(url_for('main.index'))
    return render_template('auth/unconfirmed.html')

