from flask import render_template, redirect, request, url_for, flash, session
from flask_login import login_user, logout_user, login_required, \
    current_user
from . import auth
from .. import db
from ..models import User
from ..email import gmail_send_message
from .forms import LoginForm, RegistrationForm
from flask_dance.contrib.github import github
from flask_login import logout_user

import os, json
root = './app/static/files/'


@auth.before_app_request
def before_request():
    if current_user is None:
        pass
    if current_user.is_authenticated:

        if not current_user.is_anonymous:
            if not current_user.confirmed \
                    and request.endpoint \
                    and request.blueprint != 'auth' \
                    and request.endpoint != 'static':
                return redirect(url_for('auth.unconfirmed'))
    # print("(in auth/views.py: before_resquest())Not authenticated!!!!!")

@auth.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is not None and user.verify_password(form.password.data):
            login_user(user, form.remember_me.data)
            next = request.args.get('next')
            # if not is_safe_url(next):
            #     return flask.abort(400)
            if next is None or not next.startswith('/'):
                next = url_for('main.index')
            return redirect(next)
        flash('Invalid username or password.')
    return render_template('auth/login.html', form=form)


@auth.route('/github/login')
def github_login():
    if not github.authorized:
        print("not authorized")
        return redirect(url_for('github.login'))
    else:
        account_info = github.get('/user')
        
        if account_info.ok:
            account_info_json = account_info.json()
            owner = account_info_json['login']
            repo = "codee"
            repo_info = github.get(f'/repos/{owner}/{repo}')
            if repo_info.ok:
                repo_info_json = repo_info.json()
                return json.dumps(repo_info_json)

    return '<h1>Request failed!</h1>'




@auth.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    flash('You have been logged out.')
    return redirect(url_for('auth.login'))



@auth.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(email=form.email.data.lower(),
                    username=form.username.data,
                    password=form.password.data,
                    git_token = form.git_token.data,
                    git_name = form.git_name.data)
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

