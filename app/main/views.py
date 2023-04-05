from . import main
from .. import db
from ..models import User, Test

import json
import os
import difflib
import re
import time
import requests
from collections import deque, defaultdict
from flask import abort, render_template, redirect, url_for, make_response, g, request, session
from flask_login import current_user, login_required
from functools import wraps
from os.path import exists
from flask_dance.contrib.github import github
import base64
from datetime import datetime
from diff_match_patch import diff_match_patch


def request_header(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }


# @main.before_request
def check_access_token():
    if 'access_token' not in session and request.endpoint not in ['login', 'logout']:
        return redirect(url_for('login'))


@main.app_template_filter()
def is_cd(file_path):
    print(os.path.splitext(file_path)[1] == "cd")
    return os.path.splitext(file_path)[1] == ".cd"


def get_content_of_file(owner, repo, ref, path):
    resp = requests.get(f'https://api.github.com/repos/{owner}/{repo}/contents/{path}',
                        params={"ref": ref},
                        headers=request_header(session['access_token']))
    if resp.ok:
        resp_json = resp.json()
        base64_content = resp_json['content']
        bytes_content = base64.b64decode(base64_content)
        content = bytes_content.decode('utf-8')
        return content
    return "error"


def get_tree_of_repository(owner, repo, ref="master"):
    tree_sha = None
    commit_resp = requests.get(f'https://api.github.com/repos/{owner}/{repo}/commits/{ref}',
                               headers=request_header(session['access_token']))
    if commit_resp.ok:
        commit_json = commit_resp.json()
        tree_sha = commit_json['commit']['tree']['sha']

    tree_json = None
    tree_resp = requests.get(f'https://api.github.com/repos/{owner}/{repo}/git/trees/{tree_sha}',
                             params={'recursive': 1}, headers=request_header(session['access_token']))
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


def init_diff_match_patch():
    dmp = diff_match_patch()
    dmp.Diff_Timeout = 0
    dmp.Diff_EditCost = 4
    return dmp


def get_last_commit_sha(owner, repo, ref, filepath):
    last_commit_sha = None

    commit_list_resp = github.get(
        f'/repos/{owner}/{repo}/commits', json={'sha': ref, 'path': filepath})

    if commit_list_resp.ok:
        commit_list_json = commit_list_resp.json()
        last_commit_sha = commit_list_json[0]['sha']
    return last_commit_sha


def escape(string):
    escape_dict = {'{+': '\\{\\+', '+}': '\\+\\}',
                   '[-': '\\[\\-', '-]': '\\-\\]'}
    pattern = re.compile('|'.join(re.escape(key)
                         for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], string)


def unescape(escaped_string):
    escape_dict = {'\\{\\+': '{+', '\\+\\}': '+}',
                   '\\[\\-': '[-', '\\-\\]': '-]'}
    pattern = re.compile('|'.join(re.escape(key)
                         for key in escape_dict.keys()))
    return pattern.sub(lambda match: escape_dict[match.group(0)], escaped_string)


@main.route('/', methods=['GET', 'POST'])
def index():
    repos_name = None
    headers = {
        "Authorization": f"Bearer {session['access_token']}",
        "Accept": "application/vnd.github+json"
    }

    repos_resp = requests.get(
        "https://api.github.com/user/repos", headers=headers)

    if repos_resp.ok:
        repos_list = repos_resp.json()
        repos_name = [repo['name'] for repo in repos_list]
    return render_template('main/repos.html', repos=repos_name)


@main.route('/<path:filepath>', methods=['GET'])
def show_file(filepath):
    start = time.time()
    path_parts = filepath.split('/')
    if len(path_parts) >= 4:
        owner, repo, ref, content = filepath.split("/", maxsplit=3)
        tree = get_tree_of_repository(owner, repo, ref)
        if is_cd(content):
            ref_path, ref_content, codee_content = show_codee_file(
                owner, repo, ref, content)
            return render_template('main/cd.html', ref_path=ref_path, ref_content=ref_content,
                                   codee_content=codee_content, tree=tree)
        else:
            end = time.time()
            print(f"{end - start:.5f} sec")
            return render_template('main/index.html',
                                   file_content=get_content_of_file(
                                       owner, repo, ref, content),
                                   tree=tree)
    elif len(path_parts) == 3:
        owner, repo, ref = filepath.split("/", maxsplit=2)
        return render_template('main/root.html', tree=get_tree_of_repository(owner, repo, ref), ref=ref)
    return "Illegal URL", 400


def show_codee_file(owner, repo, ref, content):
    codee_content = get_content_of_file(owner, repo, ref, content)
    codee_content_json = json.loads(codee_content)
    ref_file_path = codee_content_json['referenced_file']
    ref_file_content = get_content_of_file(owner, repo, ref, ref_file_path)

    actual_sha = get_last_commit_sha(owner, repo, ref, content)
    written_sha = codee_content_json['last_commit_sha']

    if actual_sha != written_sha:
        # codee_content_json['last_commit_sha'] = actual_sha
        # print(f"actual_sha: {actual_sha}, written_sha: {written_sha}")
        # codee_content_json['data'] = json.dumps(
        #     merge(written_sha, actual_sha, ref_file_path, decoration)
        # )
        # codee_content = json.dumps(codee_content_json)
        pass
    return ref_file_path, ref_file_content, codee_content


def wrap_word(change_type, line):
    start = 1 if line.startswith("\n") else 0
    end = len(line) - 1 if line.endswith("\n") else len(line)
    inner = line[start:end].replace(
        '\n', ('+}\n{+' if change_type == '+' else '-]\n[-'))
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
        detected_words = find_added_word(
            diff_line) + find_deleted_word(diff_line)
        if not detected_words:
            continue
        if len(detected_words) == 1 and len(detected_words[0][1]) == len(diff_line) - 4:
            changes[line_num+1] = {
                'line': True,
                'type': type_key[detected_words[0][2]]
            }
        else:
            detected_words.sort(key=lambda x: x[0])
            words = [(word[0] - 4 * i, word[1], word[2])
                     for i, word in enumerate(detected_words)]
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


def update_deco(changes, decorations):
    new_deco = defaultdict(list)
    for deco_line_num, deco_list in decorations.items():
        print(f"deco_line_num: {deco_line_num}, deco_list: {deco_list}")
        deco_line_num = int(deco_line_num)
        for deco in deco_list:
            for change_line_num, change in changes.items():
                print(
                    f"    change_line_num: {change_line_num}, change: {change}")
                change_line_num = int(change_line_num)
                if change_line_num < deco_line_num:
                    print(1)
                    if change["line"]:
                        print(2)
                        deco_line_num += 1 if change["type"] == "add" else -1
                        print(f"deco_line_num: {deco_line_num}")
                    continue
                elif change_line_num > deco_line_num:
                    print(3)
                    break
                # change_line_num == deco_line_num
                if change["line"]:  # 줄 단위의 변경 사항
                    if deco["type"] == "line_hide":
                        print(4)
                        # line_hide 하는 범위에 겹치는 변경사항이 있으면 데코 삭제
                        pass
                    else:
                        print(5)
                        if change["info"]["type"] == "add":
                            print(6)
                            new_deco[deco_line_num + 1].append(deco)
                else:  # 단어 단위의 변경 사항
                    print(7)
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
                print("(1)")
                start += change["length"]
                end += change["length"]
            elif change["col"] >= start and change["col"] <= end:
                print("(2)")
                end += change["length"]
        else:
            if change["col"] < start:
                if change_end < start:
                    print("(3)")
                    start -= change["length"]
                    end -= change["length"]
                elif change_end >= start and change_end < end:
                    print("(4)")
                    start = change["col"]
                    end -= change["length"]
                else:  # change_end >= end
                    print(5)
                    return None
            elif change["col"] >= start and change["col"] <= end:
                if change_end >= start and change_end < end:
                    print("(6)")
                    end -= change["length"]
                elif change_end >= end:
                    print("(7)")
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
    print(">> diffs")
    print(diffs)
    print(">> changes")
    print(changes)
    deco = update_deco(changes, deco)

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
    current_content = base64.b64decode(
        get_resp_json['content']).decode('utf-8')

    blob_request_body = {
        'content': codee_content,  # JSON str
        'encoding': "utf-8"
    }
    blob_resp = github.post(
        f'/repos/{owner}/{repo}/git/blobs', json=blob_request_body)
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
    commit_list_resp = github.get(
        f'/repos/{owner}/{repo}/commits?path={ref_path}')
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
