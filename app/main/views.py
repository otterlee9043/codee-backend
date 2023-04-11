from . import main
from .. import db 
from sqlalchemy import event

import json, os, re, time, requests, base64
from collections import defaultdict
from flask import abort, render_template, redirect, url_for, make_response, g, request, session, current_app
from flask_login import current_user, login_required
from datetime import datetime
from diff_match_patch import diff_match_patch


def request_header(token, additional_header = None):
    header = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }
    if additional_header:
        header.update(additional_header)
    return header


@main.before_request
@login_required
def check_access_token():    
    if not session and request.endpoint not in ['auth.login', 'auth.logout']:
        return redirect(url_for('auth.login')) 
    

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
        try:
            content = bytes_content.decode('utf-8')
        except:
            content = "non-decodeable content"
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

    commit_list_resp = requests.get(
        f'https://api.github.com/repos/{owner}/{repo}/commits', 
        params={'sha': ref, 'path': filepath},
        headers=request_header(session['access_token'])
    )

    if commit_list_resp.ok:
        commit_list_json = commit_list_resp.json()
        last_commit_sha = commit_list_json[0]['sha']
    return last_commit_sha





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


def merge(old_sha, new_sha, ref_file, deco):
    dmp = init_diff_match_patch()
    print(deco)
    print(f"old_sha: {old_sha}, new_sha: {new_sha}")
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

    get_resp = requests.get(f'https://api.github.com/repos/{owner}/{repo}/contents/{codee_path}',
                            headers=request_header(session['access_token']))
    get_resp_json = get_resp.json()

    if not get_resp.ok:
        return 'Failed to get previous file content', 500

    current_sha = get_resp_json['sha']

    blob_request_body = {
        'content': codee_content,  # JSON str
        'encoding': "utf-8"
    }
    blob_resp = requests.post(
        f'https://api.github.com/repos/{owner}/{repo}/git/blobs', data=blob_request_body,
        headers=request_header(session['access_token']))
    if blob_resp.ok:
        request_body = {
            'message': "Codee 파일 수정",
            'content': base64.b64encode(codee_content.encode('utf-8')).decode('utf-8'),
            'sha': current_sha
        }
        resp = requests.put(f'https://api.github.com/repos/{owner}/{repo}/contents/{codee_path}',
                          data=request_body, 
                          headers=request_header(session['access_token']))
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
    commit_list_resp = requests.get(
        f'https://api.github.com/repos/{owner}/{repo}/commits?path={ref_path}',
        headers=request_header(session['access_token']))
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
        resp = requests.put(f'https://api.github.com/repos/{owner}/{repo}/contents/{save_location}/{codee_name}.cd',
                          data=request_body,
                          headers=request_header(session['access_token']))
        print(resp)
        print(resp.json())
        return "created codee file", 200

    return "Failed to create codee file", 500


@main.route('/delete_codee', methods=['POST'])
def delete_codee():
    json_data = request.get_json()
    repo = json_data['repo']
    codee_path = json_data['codee_path']
    owner = current_user.username

    blob_resp = requests.get(f'https://api.github.com/repos/{owner}/{repo}/contents/{codee_path}',
                headers=request_header(session['access_token']))
    if blob_resp.ok:
        blob_resp_json = blob_resp.json()
        blob_sha = blob_resp_json['sha']

        request_body = {
            'message': "Codee 파일 삭제",
            'sha': blob_sha
        }
        resp = requests.delete(f'https://api.github.com/repos/{owner}/{repo}/contents/{codee_path}',
                            data=json.dumps(request_body),
                            headers=request_header(session['access_token']))
        if resp.ok:
            return "deleted codee file", 200
        else:
            return "fail to delete", 500
    else:
        return "wrong codee path", 500