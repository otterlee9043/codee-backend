from encodings import utf_8
from flask import render_template, redirect, url_for, abort, flash, request,\
    current_app, make_response, jsonify
from flask.wrappers import Response
from . import main
from .. import db
from ..models import State, Room, User, Regist, Comment
from flask_login import current_user, login_required
import json, time
from .forms import CodeForm, CommentForm
import os, stat
from git import Repo
import shutil
from urllib.parse import urlparse
import sys
import subprocess
from os.path import exists

username = 'user2'
root = '/home/codination/ver1/app/static/files/'

def make_dir(path, url):
    os.makedirs(path, exist_ok = True, mode = 0o777)
    Repo.clone_from(url, path)# git clone https:// username @github.com/username/reponame.git
    
def read_file(path):
    # file이 없는 경우 error handler처리하기!!
    test_file = open(path, 'r', encoding = 'utf_8')
    data = test_file.read()
    per_line = data.split('\n')
    
    return data

def dir_list(path, filename = None):
    dir_tree = { filename : [] }
    
    files = os.listdir( os.path.join( path, filename ) )

    for file in files:
        if file == ".git":
            continue
        
        if os.path.isdir( os.path.join( path, filename, file ) ):
            dir_tree[filename].append( dir_list( os.path.join( path, filename ), file ) )
                        
        if os.path.isfile(os.path.join( path, filename, file ) ):
            dir_tree[filename].append( file )

    return dir_tree


 


def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir(path)]
    else:
        d['type'] = "file"
    return d

# @main.route('/<filepath>', methods=['GET', 'POST'])
# def code():


########################
########################  
@main.route('/', methods=['GET', 'POST'])
# log in required 하기
def index():
    # data = read_file('/home/codination/ver1/app/main/forms.py')
    # data = read_file(os.path.join(root, username, '/clipboard/script.js' ))
    data = read_file(root + username +'/clipboard/script.js')
    # data = None
    
    dir_tree = dir_list(root, username)
    
    print(dir_tree)
    
    # clone 
    if request.method == 'POST':
        url = request.form['repository']
        url_parsed = urlparse(url)
        dir = url_parsed.path.split('/')[-1][0:-4]
        print(url)
        print(dir)        
        # os.system("cd /home/codination/ver1/app/static/files/user1")
        # os.system(f'sudo git clone {url}')
        # 있으면 삭제하고 만들기
        repo_path = os.path.join(root, username, dir)
        if os.path.exists(repo_path):
            print(f'there is {dir}')
            # os.chmod(path, 0o777)
            shutil.rmtree(repo_path)
            make_dir(repo_path, url)
        else:
            print(f'there is no {dir}')
            os.umask(0)
            make_dir(repo_path, url)
            dir_tree = dir_list(root, username)
        
    return render_template('main/index.html', dir_tree = dir_tree, username = username, data = data)

@main.route('/<path:filepath>', methods = ['GET']) 
#log in required 하기
def showfile(filepath):
    print("FILEPATH!!!!: "+filepath)
    dir_tree = dir_list(root, username)
    data = read_file(root + username + '/' + filepath)
    filename = os.path.basename(os.path.normpath(filepath))
    return render_template('main/index.html', dir_tree = dir_tree, username = username, data = data, filename = filename )
    



@main.route('/showcode', methods=['GET', 'POST'])
# log in required 하기:
def show_code():
    if request.method == 'POST':
        error = None
        jsonData = request.get_json(force = True)
        name = jsonData['name']
        path = jsonData['path']
        if not name or not path:
            error = f'there is no such a file: {name}'
        if error is not None:
            flash(error)
        else:
            data = read_file( os.path.join(root, username, path) )
            # if로 file 없으면 data = None으로 하기  
            # print(data) ;  
            if data is not None:
                print('not none') 
                data_dict = {
                    "path" : path,
                    "filedata" : data
                }
                return make_response(jsonify( data_dict ), 200)
    
@main.route('/pull', methods=['GET'])
# log in required 하기
def pull():
    args = request.args
    proj = args.get('proj')
    print(proj)
    proj_path = os.path.join(root, username, proj)
    print(proj_path)
    repo = Repo(proj_path)
    print(repo.remotes.origin)
    repo.config_writer().set_value("user", "name", "otterlee9043").release()
    repo.config_writer().set_value("user", "email", "otterlee99@gmail.com").release()
    origin = repo.remotes.origin
    origin.pull()

    return make_response("done pull request", 200)

@main.route('/push', methods=['GET'])
# log in required 하기
def push():
    args = request.args
    proj = args.get('proj')
    print(proj)
    proj_path = os.path.join(root, username, proj)
    print(proj_path)
    repo = Repo(proj_path)
    repo.config_writer().set_value("user", "name", "otterlee9043").release()
    repo.config_writer().set_value("user", "email", "otterlee9043@gmail.com").release()
    repo.index.add(["README.md"])
    repo.index.commit("Updated codee")
    
    origin = repo.remotes.origin
    branch = repo.active_branch
    token = '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' # otterlee9043
    # token = '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' # neobomoon
    git_name = 'otterlee9043'
    
    print(origin)
    print(repo.active_branch)
    
    
    
    if os.path.exists(proj_path):
        print("exist")
        os.chdir(proj_path)
        proj_name = os.path.join(username, proj)
        os.system(f'git remote set-url {origin} https://{git_name}@github.com/{git_name}/{proj}.git') #"https://github-username@github.com/github-username/github-repository-name.git"
        os.system(f'/home/codination/ver1/app/static/files/push.exp {proj_name} neobomoon {token} {origin} {branch}')
        print('complete')
        
    print("done")

    return make_response("done push request", 200)


@main.route('/createCodee', methods=['POST'])
def create_codee():
    jsonData = request.get_json(force = True)
    path = jsonData['path']
    fileName = jsonData['fileName']
    if exists(f"{path}/{fileName}.cd"):
        print("ALREADY EXISTS!")
        f = open(f"{path}/{fileName}.cd", "w")
    return make_response("codee file created", 200)
# @main.route('/upload', methods = ['GET', 'POST'])
# def upload():
#     if request.method == 'POST':
         
# @main.route('/', methods=['GET', 'POST'])
# @login_required
# def index():
#     #rooms = Room.query.order_by(Room.timestamp.desc()).with_entities(Room.room_name, Room.host_id, Room.timestamp).all()
#     #user = User.query.order_by(User.id.desc()).all()
#     rooms = Regist.query.filter_by(user_id = current_user.id).all()
#     room_dict = []
#     for room in rooms:
#         host_id = Room.query.filter_by(id = room.room_id).first().host_id
#         room_dict.append(
#             {   
#                 "id": room.room_id,
#                 "room_name" : Room.query.filter_by(id = room.room_id).first().room_name,
#                 "host_name" : User.query.filter_by(id = host_id).first().username,
#                 "timestamp" : Room.query.filter_by(id = room.room_id).first().timestamp,
#                 "host_id" : host_id
#             }
#         )

#     return render_template('main/waitingroom.html', rooms = room_dict, user_name=current_user.username)