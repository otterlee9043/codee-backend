from . import main
from .. import db
from ..models import User

import json, os, difflib, re
from collections import deque, defaultdict
from flask import abort, render_template, redirect, url_for, g, request
from flask_login import current_user, login_required
from functools import wraps
from os.path import exists
from flask_dance.contrib.github import github
import base64
from datetime import datetime
from git import Repo
from diff_match_patch import diff_match_patch




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


def init_diff_match_patch():
    dmp = diff_match_patch()
    dmp.Diff_Timeout = 0
    dmp.Diff_EditCost = 4
    return dmp


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


def escape(string):
    escape_dict = {'{+': '\\{\\+', '+}': '\\+\\}', '[-': '\\[\\-', '-]': '\\-\\]'}
    pattern = re.compile('|'.join(re.escape(key) for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], string)


def unescape(escaped_string):
    escape_dict = {'\\{\\+': '{+', '\\+\\}': '+}', '\\[\\-': '[-', '\\-\\]': '-]'}
    pattern = re.compile('|'.join(re.escape(key) for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], escaped_string)



def set_repo_info(owner, repo):
    g.owner = owner
    g.repo = repo







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


def show_codee_file(ref, content):
    codee_content = get_content_of_file(g.owner, g.repo, ref, content)
    codee_content_json = json.loads(codee_content)
    decoration = json.loads(codee_content_json['data'])
    ref_file_path = codee_content_json['referenced_file']
    ref_file_content = get_content_of_file(g.owner, g.repo, ref, ref_file_path)

    actual_sha = get_last_commit_sha(g.owner, g.repo, ref, content)
    written_sha = codee_content_json['last_commit_sha']

    if actual_sha != written_sha:            
        codee_content_json['last_commit_sha'] = actual_sha
        print(f"actual_sha: {actual_sha}, written_sha: {written_sha}")
        codee_content_json['data'] = json.dumps(
            merge(written_sha, actual_sha, ref_file_path, decoration)
        )
        codee_content = json.dumps(codee_content_json)
    return render_template('main/cd.html', tree=get_tree_of_repository(g.owner, g.repo, ref),
                           ref=ref, content=content, ref_path=ref_file_path,
                           ref_content=ref_file_content, codee_content=codee_content)


def wrap_word(change_type, line):
    start = 1 if line.startswith("\n") else 0
    end = len(line) - 1 if line.endswith("\n") else len(line)    
    inner = line[start:end].replace('\n', ('+}\n{+' if change_type == '+' else '-]\n[-'))
    inner = '{+' + inner + '+}' if change_type == '+' else '[-' + inner + '-]'
    return (("\n" if line.startswith("\n") else "") + inner + ("" if line.endswith("\n") else ""))


def find_added_word(line):
    matches = re.finditer(r'\{\+(.*?)\+\}', line)
    return [(match.start(), match.group(1), '+') for match in matches]


def find_deleted_word(line):
    matches = re.finditer(r'\[\-(.*?)\-\]', line)
    return [(match.start(), match.group(1), '-') for match in matches]


def detect_changes(diff_string):
    changes = {}
    diff_lines = diff_string.split("\n")
    type_key = {'+': 'add', '-': 'delete'}
    for line_num, diff_line in enumerate(diff_lines):
        detected_words = find_added_word(diff_line) + find_deleted_word(diff_line)
        if not detected_words:
            continue
        if len(detected_words) == 1 and len(detected_words[0][1]) == len(diff_line) - 4:
            changes[line_num+1] = {
                'line': True,
                'type': type_key[detected_words[0][2]]
            }
        else:
            detected_words.sort(key=lambda x: x[0])
            words = [(word[0] - 4 * i, word[1], word[2]) for i, word in enumerate(detected_words)]
            word_changes = []
            change = {'line': False}
            for word in words:
                word_changes.append({
                    'type': type_key[word[2]],
                    'col': word[0],
                    'length': len(word[1])
                })
            change['info'] = word_changes
            changes[line_num+1] = change
    return changes


# def update_deco(changes_dict, deco):
#     print("changes_dict")
#     print(changes_dict)
#     print("deco")
#     print(deco)
#     new_deco = {}

#     changes_keys = list(changes_dict.keys())
#     deco_keys = list(deco.keys())
#     change_i, deco_i = 0, 0
#     change_line = changes_keys[change_i]
#     deco_line = deco_keys[deco_i]

#     line_offset = 0
#     # 변경사항 다 읽으면 데코에 적용만 해야 함
#     # 데코 다 읽으면 끝내야 함
#     while deco_i < len(deco_keys):
#         # 변경사항 읽기
#         if int(change_line) < int(deco_line) and change_i < len(changes_keys):
#             if changes_dict[change_line]['line']:
#                 if changes_dict[change_line]['type'] == 'add':
#                     line_offset += 1
#                 else:
#                     line_offset -= 1
#             change_i += 1
#         # 데코 뛰어넘어 읽기
#         elif int(change_line) > int(deco_line): 
#             # line_offset 적용
#             # new_deco[int(deco_line) + line_offset] = 
#             deco_i += 1
#         # 데코에 적용
#         else:
#             col_offset = 0
#             word_change_i, word_deco_i = 0, 0
#             word_change_list = changes_dict[change_line]['info']
#             print(deco_line)
#             print(deco[deco_line])
#             word_deco_list = sorted(deco[deco_line], key=lambda x: x['start'])
#             while word_deco_i < len(word_deco_list):
#                 word_change = word_change_list[word_change_i]
#                 word_deco = word_deco_list[word_deco_i]
#                 print(f"word_change: {word_change}, word_deco: {word_deco}")
#                 if word_change_i < len(word_change_list) - 1 and word_change['col'] < word_deco['start']:
#                     if word_change['type'] == 'add':
#                         col_offset += word_change['length']
#                     else:
#                         col_offset -= word_change['length']
#                     word_change_i += 1
#                 else:
#                     word_deco['start'] += col_offset
#                     word_deco['end'] += col_offset
#                     word_deco_list[word_deco_i] = word_deco
#                     word_deco_i += 1
#             new_deco[int(deco_line) + line_offset] = word_deco_list
#             change_i += 1
#             deco_i += 1
#     return new_deco

def update_deco(changes, decorations):
    new_deco = defaultdict(list)
    line_offset = 0
    for deco_line_num, deco_list in decorations.items():
        deco_line_num = int(deco_line_num)
        line_offset = 0
        for deco in deco_list:
            for i, (change_line_num, change) in enumerate(changes.items()):
                change_line_num = int(change_line_num)
                if change_line_num < deco_line_num:
                    if change["line"]:
                        line_offset += 1 if change["info"]["type"] == "add" else -1
                        deco_line_num += 1 if change["info"]["type"] == "add" else -1
                    continue
                elif change_line_num > deco_line_num:
                    break
                # change_line_num == deco_line_num
                if change["line"]:
                    if deco["type"] == "line_hide":
                        pass
                    else:
                        if change["info"]["type"] == "add":
                            new_deco[deco_line_num + 1].append(deco)
                else:
                    deco = update_word_deco(deco, change["info"])
                    if deco:
                        new_deco[deco_line_num].append(deco)

    return new_deco


def update_word_deco(deco, word_changes):
    start = deco["start"]
    end = deco["end"]
    for change in word_changes:
        # line change 분류
        change_end = change["col"] + change["length"] - 1
        if change["type"] == "add":    
            if change["col"] < start:
                start += change["length"]
                end += change["length"]
            elif change["col"] >= start and change["col"] <= end:
                end += change["length"]
        else:
            if change["col"] < start:
                if change_end < start:
                    start -= change["length"]
                    end -= change["length"]
                elif change_end >= start and change_end < end:
                    start = change["col"]
                    end -= change["length"]
                else: # change_end >= end
                    return None
            elif change["col"] >= start and change["col"] <= end:
                if change_end >= start and change_end < end:
                    end -= change["length"]
                elif change_end >= end:
                    end = start + 1
    deco["start"] = start
    deco["end"] = end
    return deco
    

def merge(old_sha, new_sha, ref_file, deco):
    dmp = init_diff_match_patch()
    print("=========deco")
    print(deco)
    print(f"old_sha: {old_sha}, new_sha: {new_sha}")
    # deco = sorted(deco, key=lambda x: x['line'])
    old_code = escape(get_content_of_file(g.owner, g.repo, old_sha, ref_file))
    new_code = escape(get_content_of_file(g.owner, g.repo, new_sha, ref_file))
    diffs = dmp.diff_main(old_code, new_code)
    content = ''.join([
        diff_str if diff_type == 0 else
        wrap_word('+', diff_str) if diff_type == 1 else
        wrap_word('-', diff_str)
        for diff_type, diff_str in diffs
    ])
    changes = detect_changes(content)
    deco = update_deco(changes, deco)
    # print(content)
    print(changes)
    return deco




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
    commit_list_resp = github.get(f'/repos/{owner}/{repo}/commits?path={ref_path}')
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


def parse_diff_data(data):
    # diff = []
    diff_data = {}
    changes = []
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
            # diff.append(diff_data)
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
            line_num = int(new_range.split(
                ",")[1]) if "," in new_range else 1  # line offset
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
                            # 한 줄에 여러개가 있다가는 오류 남
                            "col": re.search(r'\[\-(.*?)\-\]', line).start(),
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


