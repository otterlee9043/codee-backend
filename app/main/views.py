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
import re
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

def read_json_file(path):
    test_file = open(path, 'r', encoding = 'utf_8')
    json_data = json.load(test_file)
    
    return json_data

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
    # data = read_file(root + username +'/clipboard/script.js')
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
        
    return render_template('main/index.html', dir_tree = dir_tree, username = username)

@main.route('/<path:filepath>', methods = ['GET']) 
#log in required 하기
def showfile(filepath):
    print("FILEPATH!!!!: "+filepath)
    dir_tree = dir_list(root, username)
    filename = os.path.basename(os.path.normpath(filepath))
    tmp, ext = os.path.splitext(filename)
    
    if ext == ".cd":
        # cd 파일 읽어서  
        cd_data = read_json_file( os.path.join(root, username, filepath) )
        data = read_file( os.path.join(root, username, cd_data[0]['filepath']) )
        
        # ref하고있는 파일 읽고 data에 저장하기
        # cd_data에는 cd파일의 데이터 저장하기
        print(cd_data)
        print(data)
        return render_template('main/index.html', dir_tree = dir_tree, username = username, data = None, ref_data = data, filename = filename, path = cd_data[0]['filepath'], ref_filename = cd_data[0]['filepath'])
    
    data = read_file( os.path.join(root, username, filepath) )
    return render_template('main/index.html', dir_tree = dir_tree, username = username, data = data, filename = filename )
    
@main.route('/show_ref_file', methods = ['POST'])
def show_ref_file():
    if request.method == 'POST':
        error = None
        jsonData = request.get_json(force = True)
        print(show_ref_file)
        print(jsonData)
        cd_path = jsonData['cd_filepath']        

        if not cd_path:
            error = f'there is no such a file: {cd_path}'
            return make_response( jsonify({"msg": error }), 200 )
        else:
            cd_data = read_json_file( os.path.join(root, username, cd_path) )
            ref_data = read_file( os.path.join(root, username, cd_data[0]['filepath']) )
            if ref_data is not None:
                data_dict = {
                    # "ref_data": ref_data,
                    "cd_data": cd_data
                }
                return make_response( jsonify(data_dict), 200 )
            else:
                return make_response( jsonify({"msg": "no ref_data" }), 200 )


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

def get_commit_id(path):
    # git rev-parse HEAD
    os.chdir(path)
    data = subprocess.check_output(['git', 'rev-parse', 'HEAD'], encoding = 'utf-8')[0:-1]
    return data
    

@main.route('/create_codee', methods=['POST'])
def create_codee():
    jsonData = request.get_json(force = True)
    print(jsonData)
    codee_path = jsonData['codee_path']
    codee_name = jsonData['codee_name']
    ref_path = jsonData['ref_path']
    print(f"codee_path: {codee_path}")

    commit_id = get_commit_id( os.path.join(root, username, codee_path.split(os.path.sep)[0]) )
    # f = open(f"{root}{username}/{codee_path}/{codee_name}.cd", "w")
    f = open(os.path.join(root, username, codee_path, f"{codee_name}.cd"), "w")
    content = [{ 'commit_id' : commit_id, 'filepath': ref_path, 'data': [] }]
    json_content = json.dumps(content)
    f.write(json_content)
    f.close()
    return make_response("codee file created", 200)
    # return redirect(url_for('main.showfile', filepath=f"{codee_path}/{codee_name}.cd"))

@main.route('/get_codee/<path:filepath>', methods=['GET'])
def get_codee(filepath):
    data = None
    if exists(filepath):
        print("ALREADY EXISTS!")
        f = open(f"{filepath}", "r")
        print(filepath)
        data = f.read()
        print("DATA")
        print(data)
    return make_response(data, 200)

@main.route('/saveCodee', methods=['POST'])
def saveCodee():
    jsonData = request.get_json(force = True)
    codee_path = jsonData['codee_path']
    codee_data = jsonData['codee_data']
    print(codee_data)
    f = open(os.path.join(root, username, codee_path), "wb")
    f.write(codee_data.encode('utf8'))
    f.close()
    return make_response("codee file updated", 200) 

@main.route('/diff/<cmtid1>/<cmtid2>', methods=['GET'])
def diff(cmtid1, cmtid2):
    print(type(cmtid1))
    print("DATA!!")
    # os.system("cd /home/codination/ver1")
    os.chdir("/home/codination/ver1")
    data = subprocess.check_output(['git', 'diff', '--word-diff-regex=.', cmtid1, cmtid2], encoding = 'utf_8') 
    data = data.split("\n")
    print(len(data))
    diff = parse_diff_data(data)
    # print(diff)
    return make_response(jsonify(diff), 200) 

def parse_diff_data(data):
    diff = []
    diff_data = {}
    i = 0
    while(i < 50):
        line = data[i]
        if line[0:11] == "diff --git ":
            print(" | diff --git")
            # if not diff_data:
            #     print("~~~NEW")
            #     diff_data = {}
            #     print("init, ", diff_data)
        elif line[0:5] == "--- a":
            diff_data['old_filepath'] = line.strip("--- a")
            print(line.strip("--- a"))
        elif line[0:5] == "+++ b":
            diff_data['new_filepath'] = line.strip("+++ b")
            
        elif line[0:2] =="@@":
            # 만약 @@이 또 있다면 diff_data['changes']에 append하도록
            # diff_data 접근은 diff[마지막 인덱스]로 하도록
            ranges = re.findall(r'@@ (.*?) @@', line)[0]
            ranges = ranges.split(" ")
            old_range = ranges[0]
            new_range = ranges[1]
            new_range = new_range.lstrip('+')
            # diff_data['new_filepath'] = new_range.split(",")[0]
            start = int(new_range.split(",")[0]) # 바뀌기 전 line nuber
            line_num = int(new_range.split(",")[1]) # line offset
            changes = []
            for j in range(line_num):
                line = data[i+j]
                content = re.findall(r'\[\-(.*?)\-\]', line)
                if content:
                    for string in content: 
                        change = {
                            "line_num": start + j,
                            "type": "delete",
                            "col": re.search(r'\[\-(.*?)\-\]', line).start(),
                            "content": string
                            }
                        changes.append(change)
                    
                content = re.findall(r'\{\+(.*?)\+\}', line)
                if content:
                    for string in content: 
                        change = {
                            "line_num": start + j,
                            "type": "add",
                            "col": re.search(r'\{\+(.*?)\+\}', line).start(),
                            "content": string
                            }
                        changes.append(change)
            diff_data['changes'] = changes
            print("before, ", diff_data)
            diff.append(diff_data)
            diff_data = {}
            print("after, ", diff_data)
            i = i + line_num - 1  
            # print("i: ", i)
        i = i + 1
        print(diff)

    return diff       

    # diff_data = {}

def is_comment(string):
    # line = string.lstrip()
    if "#" in string:
        return True
    elif "//" in string:
        return True
    elif "/*" in string:
        return True
    elif "*/" in string:
        return True
    else: return False
    
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