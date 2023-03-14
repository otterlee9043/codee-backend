import re
from . import main
from .. import db
from ..models import User

import json, os, difflib
from flask import abort, render_template, redirect, url_for, g, request
from flask_login import current_user, login_required
from functools import wraps
from os.path import exists
from flask_dance.contrib.github import github
import base64
from datetime import datetime
from git import Repo



@main.before_request
@login_required
def require_login():
    pass

@main.app_template_filter()
def is_cd(file_path):
    print(os.path.splitext(file_path)[1] == "cd")
    return os.path.splitext(file_path)[1] == ".cd"


def get_content_of_file(owner, repo, ref, path):
    resp = github.get(f'/repos/{owner}/{repo}/contents/{path}?ref={ref}')
    if resp.ok:
        resp_json = resp.json()
        base64_content = resp_json['content']
        bytes_content = base64.b64decode(base64_content)
        content = bytes_content.decode('utf-8')
        return content
    return "error"


def get_tree_of_repository(owner, repo, ref):
    ref = "master"

    tree_sha = None
    commit_resp = github.get(f'/repos/{owner}/{repo}/commits/{ref}')
    if commit_resp.ok:
        commit_json = commit_resp.json()
        tree_sha = commit_json['commit']['tree']['sha']

    tree_json = None
    tree_resp = github.get(
        f'/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1')
    if tree_resp.ok:
        tree_json = tree_resp.json()

    items = []
    if tree_json and tree_sha:
        for file in tree_json['tree']:
            file_info = {}
            file_info['id'] = file['path']
            file_info['text'] = file['path'].rsplit('/', 1)[-1]

            if file['type'] == "blob":
                file_info['type'] = "file"
            elif file['type'] == "tree":
                file_info['type'] = "dir"

            if file['path'].rsplit('/', 1)[0] == file_info['text']:
                file_info['parent'] = "#"
            else:
                file_info['parent'] = file['path'].rsplit('/', 1)[0]

            file_info['a_attr'] = {'path': file['path']}

            if file_info["type"] == "file":
                file_info['a_attr']['href'] = file['path']

            items.append(file_info)

        items = sorted(items, key=lambda x: (
            x.get('type') != 'dir', x.get('text')))

        return json.dumps(items)

    return None


def get_last_commit_sha(owner, repo, ref, filepath):
    last_commit_sha = None

    commit_list_resp = github.get(f'/repos/{owner}/{repo}/commits', json={'sha': ref, 'path': filepath})
    
    if commit_list_resp.ok:
        commit_list_json = commit_list_resp.json()
        last_commit_sha = commit_list_json[0]['sha']
    return last_commit_sha


def set_repo_info(owner, repo):
    g.owner = owner
    g.repo = repo


@main.route('/test', methods=['GET'])
def test():
    g.owner = "otterlee9043"
    g.repo = "blog"
    file_path = "flask-tutorial/flaskr/auth.py"
    old_sha = "5cddc070b4807abe5416fa0f5b9cf5316750e4ce"
    new_sha = "1f87086e0da86a6fbe8faaba858104c4473264a3"
    
    resp = github.get(f'/repos/{g.owner}/{g.repo}/compare/{old_sha}...{new_sha}')
    # resp_json = resp.json()
    # files = resp_json['files']
    # patches = []
    # for file in files:
    #     if file['filename'] == file_path:
    #         patches.append(file['patch'])
    print(resp.text)
    return resp.json()

@main.route('/test2', methods=['GET'])
def generate_word_diff_data():
    """
    Generates word-level diff data between old_text and new_text
    """

    old_lines = get_content_of_file("otterlee9043", "blog", "5cddc070b4807abe5416fa0f5b9cf5316750e4ce", "flask-tutorial/flaskr/auth.py").splitlines()
    new_lines = get_content_of_file("otterlee9043", "blog", "1f87086e0da86a6fbe8faaba858104c4473264a3", "flask-tutorial/flaskr/auth.py").splitlines()
    # # Create a SequenceMatcher object to compare the old and new text
    # matcher = difflib.SequenceMatcher(None, old_lines, new_lines)
    diff_data = difflib.ndiff(old_lines, new_lines)
    # # Generate a list of tuples representing the diff data
    # # Each tuple represents a diff operation and contains 3 elements:
    # #   - operation: a string indicating the type of diff operation ("equal", "delete", or "insert")
    # #   - old_text: a list of lines from the old text that are involved in this diff operation
    # #   - new_text: a list of lines from the new text that are involved in this diff operation
    # diff_data = []
    # for opcode in matcher.get_opcodes():
    #     tag, i1, i2, j1, j2 = opcode
    #     print(opcode)
    #     if tag == "equal":
    #         # For "equal" operations, just append the lines from both old and new text
    #         diff_data.append(("equal", old_lines[i1:i2], new_lines[j1:j2]))
    #     elif tag == "delete":
    #         # For "delete" operations, only append the lines from the old text
    #         diff_data.append(("delete", old_lines[i1:i2], []))
    #     elif tag == "insert":
    #         # For "insert" operations, only append the lines from the new text
    #         diff_data.append(("insert", [], new_lines[j1:j2]))
    for d in diff_data:
        print(d)
    return diff_data


@main.route('/test3', methods=['GET'])
def test3():
    repo = Repo('blog')

    # Get the commit object for the current HEAD
    head_commit = repo.head.commit

    # Get the diff between the current HEAD and the previous commit
    diff = head_commit.diff(head_commit.parents[2], word_diff_regex='.')

    # Get the diff data for a specific file, with context
    filename = "flask-tutorial/flaskr/auth.py"
    file_diff = diff.diff(filename)

    # Get the diff data as a string
    diff_data = file_diff.diff.decode('utf-8')
    print(diff_data)
    return diff_data




@main.route('/', methods=['GET', 'POST'])
def index():
    repos_name = None
    repos_resp = github.get('/user/repos')
    if repos_resp.ok:
        repos_list = repos_resp.json()
        repos_name = [repo['name'] for repo in repos_list]
    return render_template('main/repos.html', repos=repos_name)


@main.route('/<path:filepath>', methods=['GET'])
def show_file(filepath):
    path_parts = filepath.split('/')
    set_repo_info(path_parts[0], path_parts[1])
    if len(path_parts) >= 4:
        owner, repo, ref, content = filepath.split("/", maxsplit=3)
        if is_cd(content):
            
            return show_codee_file(ref, content)
            
        else:
            file_content = {
                'content': get_content_of_file(owner, repo, ref, content)
            }
            return render_template('main/index.html', tree=get_tree_of_repository(owner, repo, ref),
                           ref=ref, content=content, file_content=json.dumps(file_content))
    elif len(path_parts) == 3:
        owner, repo, ref = filepath.split("/", maxsplit=2)
        return render_template('main/root.html', tree=get_tree_of_repository(owner, repo, ref), ref=ref)
    return "Illegal URL", 400

    
def merge(old_sha, new_sha):
    resp = github.get(f'/repos/{g.owner}/{g.repo}/compare/{old_sha}...{new_sha}')
    return 



def show_codee_file(ref, content):
    codee_content = get_content_of_file(g.owner, g.repo, ref, content)
    codee_content_json = json.loads(codee_content)
    print(type(codee_content_json))
    reference_file_path = codee_content_json['referenced_file']
    reference_file_content = get_content_of_file(g.owner, g.repo, ref, reference_file_path)

    actual_last_sha = get_last_commit_sha(g.owner, g.repo, ref, content)
    written_last_sha = codee_content_json['last_commit_sha']

    if actual_last_sha != written_last_sha:            
        pass
    
    return render_template('main/cd.html', tree=get_tree_of_repository(g.owner, g.repo, ref),
                           ref=ref, content=content, ref_path=reference_file_path,
                           ref_content=reference_file_content, codee_content=codee_content)


@main.route('/update_codee', methods=['POST'])
def update_codee():
    json_data = request.get_json(force=True)
    codee_path = json_data['codee_path']
    codee_content = json_data['codee_content']
    repo = json_data['repo']
    owner = current_user.username
    print(">> codee_content")
    print(codee_content)

    get_resp = github.get(f'/repos/{owner}/{repo}/contents/{codee_path}')
    get_resp_json = get_resp.json()

    if not get_resp.ok:
        return 'Failed to get previous file content', 500

    current_sha = get_resp_json['sha']
    current_content = base64.b64decode(get_resp_json['content']).decode('utf-8')

    blob_request_body = {
        'content': codee_content, # JSON str
        'encoding': "utf-8"
    }
    blob_resp = github.post(f'/repos/{owner}/{repo}/git/blobs', json=blob_request_body)
    if blob_resp.ok:
        request_body = {
            'message': "Codee 파일 수정",
            'content': base64.b64encode(codee_content.encode('utf-8')).decode('utf-8'),
            'sha': current_sha 
        }
        resp = github.put(f'/repos/{owner}/{repo}/contents/{codee_path}',
                            json=request_body)
        if resp.ok:
            return 'Codee file updated successfully', 200
    print(resp)
    print(resp.json())

    
    return "codee file updated", 200


@main.route('/create_codee', methods=['POST'])
def create_codee():
    json_data = request.get_json(force=True)
    repo = json_data['repo']
    save_location = json_data['save_location']
    codee_name = json_data['codee_name']
    ref_path = json_data['ref_path']
    owner = current_user.username

    last_commit_sha = None
    commit_list_resp = github.get(f'/repos/{owner}/{repo}/commits')
    if commit_list_resp.ok:
        commit_list_json = commit_list_resp.json()
        last_commit_sha = commit_list_json[0]['sha']
    
        codee_content = json.dumps({
            'referenced_file': ref_path,
            'last_commit_sha': last_commit_sha,
            'data': json.dumps({})
        })
        
        request_body = {
            'message': "Codee 파일 생성",
            'content': base64.b64encode(codee_content.encode('utf-8')).decode('utf-8')
        }
        resp = github.put(f'/repos/{owner}/{repo}/contents/{save_location}/{codee_name}.cd',
                            json=request_body)
        print(resp)
        print(resp.json())
        return "created codee file", 200

    return "Failed to create codee file", 500




# def diff(cmtid1, cmtid2, username_, repository, filepath):
#     print(type(cmtid1))
#     print("DATA!!")
#     # os.system("cd /home/codination/ver1")
#     os.chdir(os.path.join(
#         "/home/codination/ver1/app/static/files/", username_, repository))
#     data = subprocess.check_output(
#         ['git', 'diff', '--word-diff-regex=.', cmtid1+":"+filepath, cmtid2+":"+filepath], encoding='utf_8')
#     print("unparsed data!")
#     print(data)
#     data = data.split("\n")
#     # print(data)
#     diff = parse_diff_data(data)
#     # diff = parse_diff_line(data, diff)

#     print("DIFFS!!")
#     print(diff)
#     return diff


# @main.route('/diff/<cmtid1>/<cmtid2>', methods=['GET'])
# def diff2(cmtid1, cmtid2):
#     print(type(cmtid1))
#     print("DATA!!")
#     # os.system("cd /home/codination/ver1")
#     os.chdir("/home/codination/ver1/app/static/files/user2/OSSLab_0420_test")
#     data = subprocess.check_output(
#         ['git', 'diff', '--word-diff-regex=.', cmtid1, cmtid2], encoding='utf_8')
#     print(data)
#     data = data.split("\n")
#     print(len(data))
#     diff = parse_diff_data(data)
#     print(diff)
#     return make_response(jsonify(diff), 200)


def parse_diff_line(data, diff_data):
    i = 0
    while (i < len(data)):
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
        elif line[0:2] == "@@":
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
            start = int(new_range.split(",")[0])  # 바뀌기 전 line nuber
            line_num = int(new_range.split(",")[1]) if "," in new_range else 1  # line offset
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


# def parse_diff_data(data):
#     # diff = []
#     diff_data = {}
#     changes = []
#     i = 0
#     while (i < len(data)):
#         line = data[i]
#         if line[0:11] == "diff --git ":
#             # if changes:
#             #     diff_data['changes'] = changes
#             #     diff.append(diff_data)
#             diff_data = {}
#             # changes = []
#         # elif line[0:13] == "--- /dev/null":
#         elif line[0:5] == "--- a":
#             diff_data['old_filepath'] = line.strip("--- a")
#             print(line.strip("--- a"))
#         elif line[0:5] == "+++ b":
#             diff_data['new_filepath'] = line.strip("+++ b")
#             diff_data['changes'] = []
#             # diff.append(diff_data)
#         elif line[0:2] == "@@":
#             if not "old_filepath" in diff_data:
#                 diff_data = {}
#                 i = i + 1
#                 continue
#             if not "new_filepath" in diff_data:
#                 diff_data = {}
#                 i = i + 1
#                 continue
#             # if ".cd" in diff[-1]['new_filepath']:
#             #     diff.pop()
#             #     i = i + 1
#             #     continue
#             changes = diff_data['changes']
#             ranges = re.findall(r'@@ (.*?) @@', line)[0]
#             ranges = ranges.split(" ")
#             old_range = ranges[0]
#             new_range = ranges[1]
#             print("range ", ranges)
#             print(line)
#             new_range = new_range.lstrip('+')
#             # diff_data['new_filepath'] = new_range.split(",")[0]
#             start = int(new_range.split(",")[0])  # 바뀌기 전 line nuber
#             line_num = int(new_range.split(
#                 ",")[1]) if "," in new_range else 1  # line offset
#             i = i + 1
#             if re.sub(r'@@ (.*?) @@', "", line, count=1):
#                 print("THERE IS ANOTHER LINE BEHIND THIS LINE")
#                 print(line.strip().split("@@"))
#                 line_num = line_num - 1
#             # @@ 뒤에 코드가 나오는 경우 한 줄 덜 읽도록
#             for j in range(line_num):
#                 # print("start: ", start, " j: ", j)
#                 line = data[i+j]
#                 # print(line)
#                 content = re.findall(r'\[\-(.*?)\-\]', line)
#                 if content:
#                     for string in content:
#                         if len(string) == len(line)-4:
#                             change = {
#                                 "line": True,
#                                 "line_num": start + j,
#                                 "type": "delete",
#                             }
#                             print("line_num: ", start + j)
#                             changes.append(change)
#                             break
#                         change = {
#                             "line": False,
#                             "line_num": start + j,
#                             "type": "delete",
#                             # 한 줄에 여러개가 있다가는 오류 남
#                             "col": re.search(r'\[\-(.*?)\-\]', line).start(),
#                             "length": len(string)
#                         }
#                         print("line_num: ", start + j)
#                         changes.append(change)

#                 content = re.findall(r'\{\+(.*?)\+\}', line)
#                 if content:
#                     for string in content:
#                         if len(string) == len(line)-4:
#                             change = {
#                                 "line": True,
#                                 "line_num": start + j,
#                                 "type": "add",
#                             }
#                             print("line_num: ", start + j)
#                             changes.append(change)
#                             break
#                         change = {
#                             "line": False,
#                             "line_num": start + j,
#                             "type": "add",
#                             "col": re.search(r'\{\+(.*?)\+\}', line).start(),
#                             "length": len(string)
#                         }
#                         print("line_num: ", start + j)
#                         changes.append(change)
#             diff_data['changes'] = changes
#             i = i + line_num - 1
#         i = i + 1
#     print("PRINT DIFF_DATA!!")
#     print(diff_data)
#     # print(data)
#     return diff_data


# def merge(cd_path, diff, username_):
#     cd_data = read_json_file(os.path.join(root, username_, cd_path))
#     print(cd_data)
#     print(diff)
#     repoName = cd_data[0]['filepath'].split("/")[0]
#     print(diff)
#     print("repoName", repoName)
#     filepath = diff["new_filepath"]
#     full_path = repoName + filepath  # os.path.join(repoName, filepath)
#     print("full_path", full_path)
#     cd_data[0]['filepath'] = full_path
#     # comit id update하기
#     # cd_data[0]['commit_id']
#     decos = cd_data[0]['data']
#     print("cd_path:", cd_path)
#     print(cd_data[0]['filepath'])
#     for change in diff['changes']:
#         print("    ================== change ", change)
#         if change['line']:
#             for deco in decos:
#                 print("     *********** deco, ", deco)
#                 start = int(deco['start'])
#                 end = int(deco['end'])
#                 # line이 empty라면
#                 if deco["type"] == "line_hide":
#                     if change['type'] == "add":
#                         if change["line_num"] <= start:
#                             print('if change["line_num"] <= start :')
#                             deco["start"] = start + 1
#                             deco["end"] = end + 1
#                         elif change["line_num"] > start and change["line_num"] <= end:
#                             print(
#                                 'elif change["line_num"] > start and change["line_num"] <= end :')
#                             deco["end"] = end + 1
#                     else:
#                         print('if deco["type"] == "line_hide":')
#                         if change["line_num"] <= start:
#                             print('if change["line_num"] <= start :')
#                             deco["start"] = start - 1
#                             deco["end"] = end - 1
#                         elif change["line_num"] > start and change["line_num"] <= end:
#                             print(
#                                 'elif change["line_num"] > start and change["line_num"] <= end :')
#                             deco["end"] = end - 1
#                 else:
#                     line = int(deco["line"])
#                     if change['type'] == "add":
#                         if change["line_num"] <= line:
#                             print('if change["line_num"] <= line:')
#                             deco["line"] = line + 1
#                     else:
#                         print("else:")
#                         if change["line_num"] <= line:
#                             deco["line"] = line - 1
#         else:  # word단위로 추가된 경우
#             for deco in decos:
#                 start = int(deco['start'])
#                 end = int(deco['end'])
#                 print("*@@@* deco", deco)
#                 if deco["type"] == "line_hide":
#                     continue
#                 line = int(deco["line"])
#                 if line == change['line_num']:
#                     if change["type"] == "add":  # 추가
#                         print('if change["type"] == "add":')
#                         if change["col"] <= start:  # deco 나오기 전에
#                             print('if change["col"] <= start:')
#                             deco["start"] += change["length"]
#                             deco["end"] += change["length"]
#                         elif change["col"] > start and change["col"] < end:  # deco 중간에
#                             print(
#                                 'elif change["col"] > start and change["col"] <= end:')
#                             deco["end"] += change["length"]
#                     else:
#                         print("else:")
#                         if change["col"] <= start:
#                             print('if change["col"] <= start:')
#                             if change["col"] + change["length"] <= start:
#                                 print(
#                                     ' if change["col"] + change["length"] < start:')
#                                 deco["start"] -= change["length"]
#                                 deco["end"] -= change["length"]
#                             elif change["col"] + change["length"] > start and change["col"] + change["length"] < end:
#                                 print(
#                                     'elif  change["col"] + change["length"] > start and change["col"] + change["length"] <= end:')
#                                 deco["start"] = change["col"]
#                                 deco["end"] = end - change["length"]
#                             elif change["col"] + change["length"] >= end:
#                                 print(
#                                     'elif change["col"] + change["length"] >=  end:')
#                                 decos.remove(deco)
#                         elif change["col"] > start and change["col"] <= end:
#                             print(
#                                 'elif change["col"] > start and change["col"] <= end:')
#                             if change["col"] + change["length"] <= end:
#                                 print(
#                                     'if  change["col"] + change["length"] <= end:')
#                                 deco["end"] = end - change["length"]
#                             elif change["col"] + change["length"] > end:
#                                 print(
#                                     'elif change["col"] + change["length"] >  end:')
#                                 deco["end"] = change["col"]
#     cd_data[0]['data'] = decos
#     # return cd_data
#     print(" >> merge")
#     print(cd_data)
#     print(" >> merge")
#     return cd_data


