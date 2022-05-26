from encodings import utf_8
from flask import render_template, redirect, url_for, abort, flash, request,\
    current_app, make_response, jsonify
from flask.wrappers import Response
from . import main
from .. import db
from ..models import User
from flask_login import current_user, login_required
import json, time
from .forms import CommentForm
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
    print("IN read_json_file : " +path)
    test_file = open(path, 'r', encoding = 'utf_8')
    json_data = json.load(test_file)
    
    return json_data

def dir_list(path, filename = None):
    dir_tree = { filename : [] }
    print("DIR_LIST: " + path + ", " + filename)
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

@main.route('/', methods = ['GET','POST']) 
@login_required
def index():
    print("!!!!!!!!!!!!!!", get_repositories())
    if request.method == 'POST':
        url = request.form['repository']
        url_parsed = urlparse(url)
        dir = url_parsed.path.split('/')[-1][0:-4]
        print(current_user.username)
        print(url)
        print(dir)        
        # os.system("cd /home/codination/ver1/app/static/files/user1")
        # os.system(f'sudo git clone {url}')
        # 있으면 삭제하고 만들기
        repo_path = os.path.join(root, current_user.username, dir)
        if os.path.exists(repo_path):
            print(f'there is {dir}')
            # os.chmod(path, 0o777)
            # shutil.rmtree(repo_path)
            # make_dir(repo_path, url)
        else:
            print(f'there is no {dir}')
            os.umask(0)
            make_dir(repo_path, url)
            # dir_tree = dir_list(root, username)
        return redirect(url_for('main.showfile', filepath=f"{current_user.username}/{dir}"))
    return render_template('main/repos.html', repos = get_repositories())


#######################
#######################
# @main.route('/', methods=['GET', 'POST'])
# @login_required
# def index():
#     # data = read_file('/home/codination/ver1/app/main/forms.py')
#     # data = read_file(os.path.join(root, username, '/clipboard/script.js' ))
#     # data = read_file(root + username +'/clipboard/script.js')
#     # data = None
#     # username_ = User.query.filter_by(id = current_user.id).first()
#     dir_tree = dir_list(root, username_.username)
    
#     print(dir_tree)
    
#     # clone 
#     if request.method == 'POST':
#         url = request.form['repository']
#         url_parsed = urlparse(url)
#         dir = url_parsed.path.split('/')[-1][0:-4]
#         print(current_user.username)
#         print(url)
#         print(dir)        
#         # os.system("cd /home/codination/ver1/app/static/files/user1")
#         # os.system(f'sudo git clone {url}')
#         # 있으면 삭제하고 만들기
#         repo_path = os.path.join(root, username_.username, dir)
#         if os.path.exists(repo_path):
#             print(f'there is {dir}')
#             # os.chmod(path, 0o777)
#             # shutil.rmtree(repo_path)
#             # make_dir(repo_path, url)
#         else:
#             print(f'there is no {dir}')
#             os.umask(0)
#             make_dir(repo_path, url)
#             # dir_tree = dir_list(root, username)
        
#     return render_template('main/index.html', dir_tree = dir_tree)

@main.route('/<path:filepath>', methods = ['GET']) 
#log in required 하기
def showfile(filepath):
    print("filepath: " + filepath)
    # username_ = request.args.get('user')
    # paths = filepath.split("/", maxsplit=1)
    paths = filepath.split("/", maxsplit=1)
    username_ = paths[0]
    reponame = paths[1].split("/")[0]
    print("username_: " + username_)
    print("REPONAME!!!!: "+reponame)
    dir_tree = dir_list(os.path.join(root, username_), reponame)
    dir_tree = {username_: [dir_tree]}
    print("DIR TREE IN def showfile")
    print(dir_tree)
    # filename = os.path.basename(os.path.normpath(filepath))
    filename = paths[1].split("/")[-1]
    print("FILENAME: " + filename)
    tmp, ext = os.path.splitext(filename)
    print ("equal?! ", username_, current_user.username)
    if ext == ".cd":
        # cd 파일 읽어서  
        cd_data = read_json_file( os.path.join(root, username_, paths[1]) )
        print(cd_data)
        data = read_file( os.path.join(root, username_, cd_data[0]['filepath']) )
        
        # ref하고있는 파일 읽고 data에 저장하기
        # cd_data에는 cd파일의 데이터 저장하기
        # print(cd_data)
        # print(data)
        return render_template('main/index.html', dir_tree = dir_tree, username = username_,  data = None, ref_data = data, filename = filename, path = cd_data[0]['filepath'], ref_filename = cd_data[0]['filepath'])
    if os.path.isdir(os.path.join(root, username_, paths[1])):
        return render_template('main/index.html', dir_tree = dir_tree, username = username_, filename = None)
    data = read_file(os.path.join(root, username_, paths[1]))
    return render_template('main/index.html', dir_tree = dir_tree, username = username_,  data = data, filename = filename )


# @main.route('/showfile/<path:filepath>', methods = ['GET']) 
# #log in required 하기
# def showfile(filepath):
#     print("filepath: " + filepath)
#     username_ = request.args.get('user')
#     print("username_: " + username_)
#     print("FILEPATH!!!!: "+filepath)
#     dir_tree = dir_list(root, username_)
#     filename = os.path.basename(os.path.normpath(filepath))
#     tmp, ext = os.path.splitext(filename)
    
#     if ext == ".cd":
#         # cd 파일 읽어서  
#         cd_data = read_json_file( os.path.join(root, username_, filepath) )
#         print(cd_data)
#         data = read_file( os.path.join(root, username_, cd_data[0]['filepath']) )
        
#         # ref하고있는 파일 읽고 data에 저장하기
#         # cd_data에는 cd파일의 데이터 저장하기
#         # print(cd_data)
#         # print(data)
#         return render_template('main/index.html', dir_tree = dir_tree, username = username_, data = None, ref_data = data, filename = filename, path = cd_data[0]['filepath'], ref_filename = cd_data[0]['filepath'])
    
#     data = read_file( os.path.join(root, username_, filepath) )
#     return render_template('main/index.html', dir_tree = dir_tree, username = username_, data = data, filename = filename )


# 안 쓰이는 것 같다
@main.route('/showcode', methods=['GET', 'POST'])
# log in required 하기:
def show_code():
    print("I AM USED!!!!!")
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
@login_required
def pull():
    args = request.args
    user = args.get('username')
    repoName = args.get('repo')
    
    print(repoName)
    proj_path = os.path.join(root, user, repoName)
    print(proj_path)
    repo = Repo(proj_path)
    print(repo.remotes.origin)
    # repo.config_writer().set_value("user", "name", "codee").release()
    # repo.config_writer().set_value("user", "email", "codee@gmail.com").release()
    origin = repo.remotes.origin
    origin.pull()
    
    # commit_id = get_commit_id( os.path.join(root, user, repoName) )

    return make_response(jsonify({"msg":"done pull"}), 200)

@main.route('/push', methods=['GET'])
@login_required
def push():
    args = request.args
    user = args.get('username')
    repoName = args.get('repo')
    
    print(repoName)
    proj_path = os.path.join(root, user, repoName) #/.../OSS_0420_test 
    print(proj_path)
    repo = Repo(proj_path)
    repo.config_writer().set_value("user", "name", "codee").release()
    repo.config_writer().set_value("user", "email", "codee@gmail.com").release()
    repo.index.add(["*.cd"])
    repo.index.commit("Updated codee")
    
    origin = repo.remotes.origin
    branch = repo.active_branch
    # token = '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' # otterlee9043
    token = User.query.filter_by(id = current_user.id).first().git_token
    # token = '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' # neobomoon
    git_name = User.query.filter_by(id = current_user.id).first().git_name
    # git_name = 'neobomoon'
    
    print(origin)
    print(repo.active_branch)
    
    if os.path.exists(proj_path):
        print(proj_path)
        print("exist")
        os.chdir(proj_path)
        proj_name = os.path.join(user, repoName)
        print("GIT PUSH INFO")
        print(git_name)
        print(proj_name)
        print(token)
        os.system(f'git remote set-url {origin} https://{git_name}@github.com/{git_name}/{repoName}.git') #"https://github-username@github.com/github-username/github-repository-name.git"
        os.system(f'/home/codination/ver1/app/static/files/push.exp {proj_name} neobomoon {token} {origin} {branch}')
        #/home/codination/ver1/app/static/files/push.exp OSSLab_0420_test neobomoon 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 origin master
        print('complete')
        
    print("done")

    return make_response("done push request", 200)

def get_commit_id(path, filename):
    # git rev-parse HEAD
    os.chdir(path)
    data = subprocess.check_output(['git', 'log', 'main.c'], encoding = 'utf-8').split("\n")[0]
    data = data.split(" ")[1]
    return data
    

@main.route('/read_codee', methods = ['POST'])
def read_codee():
    if request.method == 'POST':
        error = None
        jsonData = request.get_json(force = True)
        # print(show_ref_file)
        print(jsonData)
        cd_path = jsonData['cd_filepath'].split("/", maxsplit=1)[1]
        username_ = jsonData['username']
        print("USERNAME_: "+ username_)
        print("CD_PATH: "+ cd_path)   
        if not cd_path:
            error = f'there is no such a file: {cd_path}'
            return make_response( jsonify({"msg": error }), 200 )
        else:
            cd_data = read_json_file( os.path.join(root, username_,  os.path.normpath(cd_path)) )
            ref_data = read_file( os.path.join(root, username_, os.path.normpath(cd_data[0]['filepath'])) )
            if ref_data is not None:
                # if jsonData['header']:
                #     return make_response(jsonify({"commit_id": cd_data[0]['commit_id']}), 200 )
                repository = cd_data[0]['filepath'].split("/")[0]
                filepath = cd_data[0]['filepath'].split("/", maxsplit=1)[1]
                codee_comit_id = cd_data[0]['commit_id']
                last_commit_id = get_commit_id(os.path.join(root, username_, repository), os.path.join(".", filepath[0]))
                print(codee_comit_id)
                print(last_commit_id)
                if codee_comit_id != last_commit_id:
                    print("need AUTO-MERGE")
                    diff_data = diff(codee_comit_id, last_commit_id, username_, repository, filepath)
                    print(cd_path)
                    cd_data = merge(cd_path, diff_data, username_)
                    cd_data[0]['commit_id'] = last_commit_id
                    print("THIS IS MERGED DATA")
                    print(cd_data)
                    save_merged_codee(cd_data, cd_path, username_)
                data_dict = {
                    # "ref_data": ref_data,
                    "cd_data": cd_data
                }
                return make_response( jsonify(data_dict), 200 )
            else:
                return make_response( jsonify({"msg": "no ref_data" }), 200 )



@main.route('/create_codee', methods=['POST'])
def create_codee():
    jsonData = request.get_json(force = True)
    print(f"@@@@@: {jsonData}")
    codee_path = jsonData['codee_path']
    codee_name = jsonData['codee_name']
    ref_path = jsonData['ref_path']
    username_ = jsonData['username']
    print(f"codee_path: {codee_path}")

    commit_id = get_commit_id( os.path.join(root, username_, codee_path.split(os.path.sep)[0]),  ref_path.split(os.path.sep)[-1])
    print(f"@@@@@commit_id: {commit_id}")
    print("PASS1")
    # f = open(f"{root}{username}/{codee_path}/{codee_name}.cd", "w")
    f = open(os.path.join(root, username_, codee_path, f"{codee_name}.cd"), "w")
    print("PASS1")
    content = [{ 'commit_id' : commit_id, 'filepath': ref_path, 'data': [] }]
    json_content = json.dumps(content)
    f.write(json_content)
    f.close()
    return "codee file created", 200
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
        # print(data)
    return make_response(data, 200)

@main.route('/saveCodee', methods=['POST'])
def saveCodee():
    jsonData = request.get_json(force = True)
    codee_path = jsonData['codee_path']
    codee_data = jsonData['codee_data']
    username_ = jsonData['username']
    print(codee_path)
    print("SAVECODEE: " + os.path.join(root, username_, codee_path.split("/", maxsplit=1)[1]))
    f = open(os.path.join(root, username_, codee_path.split("/", maxsplit=1)[1]), "wb")
    f.write(codee_data.encode('utf8'))
    f.close()
    return make_response("codee file updated", 200) 

def save_merged_codee(codee_data, codee_path, username_):
    print("save_merged_codee!")
    f = open(os.path.join(root, username_, codee_path), "wb")
    f.write(json.dumps(codee_data).encode('utf8'))
    f.close()



def diff(cmtid1, cmtid2, username_, repository, filepath):
    print(type(cmtid1))
    print("DATA!!")
    # os.system("cd /home/codination/ver1")
    os.chdir(os.path.join("/home/codination/ver1/app/static/files/", username_, repository))
    data = subprocess.check_output(['git', 'diff', '--word-diff-regex=.', cmtid1+":"+filepath, cmtid2+":"+filepath], encoding = 'utf_8') 
    print("unparsed data!")
    print(data)
    data = data.split("\n")
    # print(data)
    diff = parse_diff_data(data)
    # diff = parse_diff_line(data, diff)
    
    print("DIFFS!!")
    print(diff)
    return diff



@main.route('/diff/<cmtid1>/<cmtid2>', methods=['GET'])
def diff2(cmtid1, cmtid2):
    print(type(cmtid1))
    print("DATA!!")
    # os.system("cd /home/codination/ver1")
    os.chdir("/home/codination/ver1/app/static/files/user2/OSSLab_0420_test")
    data = subprocess.check_output(['git', 'diff', '--word-diff-regex=.', cmtid1, cmtid2], encoding = 'utf_8') 
    print(data)
    data = data.split("\n")
    print(len(data))
    diff = parse_diff_data(data)
    print(diff)
    return make_response(jsonify(diff), 200)

def parse_diff_line(data, diff_data):
    i = 0
    while(i < len(data)):
        line = data[i]
        if line[0:11] == "diff --git ":
            # if changes:
            #     diff_data['changes'] = changes
            #     diff.append(diff_data)
            diff_data = {}
            # changes = []
        # elif line[0:13] == "--- /dev/null":
        elif line[0:5] == "--- a":
            diff_data['old_filepath'] = line.strip("--- a")
            print(line.strip("--- a"))
        elif line[0:5] == "+++ b":
            diff_data['new_filepath'] = line.strip("+++ b")
            diff_data['changes'] = []
        elif line[0:2] =="@@":
            if not "old_filepath" in diff_data:
                diff_data = {}
                i = i + 1 
                continue
            if not "new_filepath" in diff_data:
                diff_data = {}
                i = i + 1 
                continue
            # if ".cd" in diff[-1]['new_filepath']:
            #     diff.pop()
            #     i = i + 1 
            #     continue
            changes = diff_data['changes']
            ranges = re.findall(r'@@ (.*?) @@', line)[0]
            ranges = ranges.split(" ")
            old_range = ranges[0]
            new_range = ranges[1]
            print("range ", ranges)
            print(line)
            new_range = new_range.lstrip('+')
            # diff_data['new_filepath'] = new_range.split(",")[0]
            start = int(new_range.split(",")[0]) # 바뀌기 전 line nuber
            line_num = int(new_range.split(",")[1]) if "," in new_range else 1 # line offset
            i = i + 1
            if re.sub(r'@@ (.*?) @@', "", line, count=1): 
                print("THERE IS ANOTHER LINE BEHIND THIS LINE")
                print(line.strip().split("@@"))
                line_num = line_num - 1
            # @@ 뒤에 코드가 나오는 경우 한 줄 덜 읽도록
            for j in range(line_num):
                # print("start: ", start, " j: ", j)
                line = data[i+j]
                if len(line) == 1:
                    if line[0] == "+":
                        change = {
                                "line": True,
                                "line_num": start + j,
                                "type": "add",
                            }
                        diff_data['changes'].append(change)
                    elif line[0] == "-":
                        change = {
                            "line": True,
                            "line_num": start + j,
                            "type": "delete",
                        }
                        diff_data['changes'].append(change)
            i = i + line_num - 1  
        i = i + 1
    print("Print data!!")
    return diff_data

def parse_diff_data(data):
    # diff = []
    diff_data = {}
    changes = []
    i = 0
    while(i < len(data)):
        line = data[i]
        if line[0:11] == "diff --git ":
            # if changes:
            #     diff_data['changes'] = changes
            #     diff.append(diff_data)
            diff_data = {}
            # changes = []
        # elif line[0:13] == "--- /dev/null":
        elif line[0:5] == "--- a":
            diff_data['old_filepath'] = line.strip("--- a")
            print(line.strip("--- a"))
        elif line[0:5] == "+++ b":
            diff_data['new_filepath'] = line.strip("+++ b")
            diff_data['changes'] = []
            # diff.append(diff_data)
        elif line[0:2] =="@@":
            if not "old_filepath" in diff_data:
                diff_data = {}
                i = i + 1 
                continue
            if not "new_filepath" in diff_data:
                diff_data = {}
                i = i + 1 
                continue
            # if ".cd" in diff[-1]['new_filepath']:
            #     diff.pop()
            #     i = i + 1 
            #     continue
            changes = diff_data['changes']
            ranges = re.findall(r'@@ (.*?) @@', line)[0]
            ranges = ranges.split(" ")
            old_range = ranges[0]
            new_range = ranges[1]
            print("range ", ranges)
            print(line)
            new_range = new_range.lstrip('+')
            # diff_data['new_filepath'] = new_range.split(",")[0]
            start = int(new_range.split(",")[0]) # 바뀌기 전 line nuber
            line_num = int(new_range.split(",")[1]) if "," in new_range else 1 # line offset
            i = i + 1
            if re.sub(r'@@ (.*?) @@', "", line, count=1): 
                print("THERE IS ANOTHER LINE BEHIND THIS LINE")
                print(line.strip().split("@@"))
                line_num = line_num - 1
            # @@ 뒤에 코드가 나오는 경우 한 줄 덜 읽도록
            for j in range(line_num):
                # print("start: ", start, " j: ", j)
                line = data[i+j]
                # print(line)
                content = re.findall(r'\[\-(.*?)\-\]', line)
                if content:
                    for string in content: 
                        if len(string) == len(line)-4:
                            change = {
                                "line": True,
                                "line_num": start + j,
                                "type": "delete",
                            }
                            print("line_num: ", start + j)
                            changes.append(change)
                            break
                        change = {
                            "line": False,
                            "line_num": start + j,
                            "type": "delete",
                            "col": re.search(r'\[\-(.*?)\-\]', line).start(), # 한 줄에 여러개가 있다가는 오류 남
                            "length": len(string)
                        }
                        print("line_num: ", start + j)
                        changes.append(change)
                    
                content = re.findall(r'\{\+(.*?)\+\}', line)
                if content:
                    for string in content: 
                        if len(string) == len(line)-4:
                            change = {
                                "line": True,
                                "line_num": start + j,
                                "type": "add",
                            }
                            print("line_num: ", start + j)
                            changes.append(change)
                            break
                        change = {
                            "line": False,
                            "line_num": start + j,
                            "type": "add",
                            "col": re.search(r'\{\+(.*?)\+\}', line).start(),
                            "length": len(string)
                        }
                        print("line_num: ", start + j)
                        changes.append(change)
            diff_data['changes'] = changes
            i = i + line_num - 1  
        i = i + 1
    print("PRINT DIFF_DATA!!")
    print(diff_data)
    # print(data)
    return diff_data      
   
def merge(cd_path, diff, username_):
    cd_data = read_json_file(os.path.join(root, username_, cd_path))
    print(cd_data)
    print(diff)
    repoName = cd_data[0]['filepath'].split("/")[0]
    print(diff)
    print("repoName", repoName)
    filepath = diff["new_filepath"]
    full_path = repoName + filepath#os.path.join(repoName, filepath)
    print("full_path", full_path)
    cd_data[0]['filepath'] = full_path
    # comit id update하기
    # cd_data[0]['commit_id']
    decos = cd_data[0]['data']
    print("cd_path:", cd_path)
    print(cd_data[0]['filepath'])
    for change in diff['changes']:
        print("    ================== change ", change)
        if change['line']: 
            for deco in decos:
                print("     *********** deco, ", deco)
                start = int(deco['start'])
                end = int(deco['end'])
                # line이 empty라면
                if deco["type"] == "line_hide":
                    if change['type'] == "add":
                        if change["line_num"] <= start :
                            print('if change["line_num"] <= start :')
                            deco["start"] = start + 1
                            deco["end"] = end + 1
                        elif change["line_num"] > start and change["line_num"] <= end :
                            print('elif change["line_num"] > start and change["line_num"] <= end :')
                            deco["end"] = end + 1
                    else:
                        print('if deco["type"] == "line_hide":')
                        if change["line_num"] <= start :
                            print('if change["line_num"] <= start :')
                            deco["start"] = start - 1
                            deco["end"] = end - 1
                        elif change["line_num"] > start and change["line_num"] <= end :
                            print('elif change["line_num"] > start and change["line_num"] <= end :')
                            deco["end"] = end - 1
                else:
                    line = int(deco["line"])	
                    if change['type'] == "add":
                        if change["line_num"] <= line:
                            print('if change["line_num"] <= line:')
                            deco["line"] = line + 1
                    else: 
                        print("else:")
                        if change["line_num"] <= line:
                            deco["line"] = line - 1 
        else: #word단위로 추가된 경우
            for deco in decos:
                start = int(deco['start'])
                end = int(deco['end'])
                print("*@@@* deco", deco)
                if deco["type"] == "line_hide":
                    continue
                line = int(deco["line"])	
                if line == change['line_num']:
                    if change["type"] == "add": # 추가
                        print('if change["type"] == "add":')
                        if change["col"] <= start: # deco 나오기 전에 
                            print('if change["col"] <= start:')
                            deco["start"] += change["length"]
                            deco["end"] += change["length"]
                        elif change["col"] > start and change["col"] < end:  # deco 중간에 
                            print('elif change["col"] > start and change["col"] <= end:')
                            deco["end"] += change["length"]
                    else:
                        print("else:")
                        if change["col"] <= start:
                            print('if change["col"] <= start:')
                            if change["col"] + change["length"] <= start:
                                print(' if change["col"] + change["length"] < start:')
                                deco["start"] -= change["length"]
                                deco["end"] -= change["length"]
                            elif  change["col"] + change["length"] > start and change["col"] + change["length"] < end:
                                print('elif  change["col"] + change["length"] > start and change["col"] + change["length"] <= end:')
                                deco["start"] = change["col"]
                                deco["end"] =  end - change["length"]
                            elif change["col"] + change["length"] >=  end:
                                print('elif change["col"] + change["length"] >=  end:')
                                decos.remove(deco)
                        elif change["col"] > start and change["col"] <= end:
                            print('elif change["col"] > start and change["col"] <= end:')
                            if  change["col"] + change["length"] <= end:
                                print('if  change["col"] + change["length"] <= end:')
                                deco["end"] =  end - change["length"]
                            elif change["col"] + change["length"] >  end:
                                print('elif change["col"] + change["length"] >  end:')
                                deco["end"] =  change["col"]
    cd_data[0]['data'] = decos
    # return cd_data
    print(" >> merge")
    print(cd_data)
    print(" >> merge")
    return cd_data


def get_repositories():
    os.chdir(os.path.join(root, current_user.username))
    return [ name for name in os.listdir(".") if os.path.isdir(os.path.join(".", name)) ]
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