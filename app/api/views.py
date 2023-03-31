from . import api
from .. import main
from flask import abort, render_template, redirect, url_for, make_response, g, request

import json

@api.route('/v1/repo/<owner>/<repo>/tree/<ref>', methods=['GET'])
def get_tree(owner, repo, ref):
    if not ref:
        ref = "master"
    response = make_response(main.get_tree_of_repository(owner, repo, ref))
    response.headers['Cache-Control'] = 'max-age=60'
    return response


@api.route('/v1/repo/<owner>/<repo>/contents/<path:path>', methods=['GET'])
def get_file_content(owner, repo, path):
    print(path)
    response = make_response(json.dumps({'content': main.get_content_of_file(owner, repo, "master", path)}))
    # response.headers['Cache-Control'] = 'max-age=60'
    print(response)
    return response

