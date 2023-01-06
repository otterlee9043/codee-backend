from flask import render_template, redirect, request, url_for, flash, current_app, session
from flask_login import login_user, logout_user, login_required, \
    current_user
from . import auth
from .. import db #, client
from ..models import User
from ..email import send_email
from .forms import LoginForm, RegistrationForm
import json, requests
import os
root = '/home/codination/ver1/app/static/files/'


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
        send_email(user.email, 'Confirm Your Account',
                   'auth/email/confirm', user=user, token=token)
        flash('A confirmation email has been sent to you by email.')
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html', form=form)


@auth.route('/confirm/<token>')
@login_required
def confirm(token):
    if current_user.confirmed:
        return redirect(url_for('main.index'))
    if current_user.confirm(token):
        db.session.commit()
        # user이름으로 dir 만들기
        os.umask(0)
        os.makedirs(os.path.join(root, current_user.username), exist_ok = True)
        flash('You have confirmed your account. Thanks!')
    else:
        flash('The confirmation link is invalid or has expired.')
    return redirect(url_for('main.index'))

@auth.route('/confirm')
@login_required
def resend_confirmation():
    token = current_user.generate_confirmation_token()
    send_email(current_user.email, 'Confirm Your Account',
               'auth/email/confirm', user=current_user, token=token)
    flash('A new confirmation email has been sent to you by email.')
    return redirect(url_for('main.index'))

@auth.route('/unconfirmed')
def unconfirmed():
    print("this is unconfirmed in auth/view.py")
    if current_user.is_anonymous or current_user.confirmed:
        return redirect(url_for('main.index'))
    return render_template('auth/unconfirmed.html')
