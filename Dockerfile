FROM python:3-alpine3.15

RUN apk update && apk add uwsgi uwsgi-python3

WORKDIR /codee

ADD . /codee

RUN pip install -r requirements.txt
ENV FLASK_APP=codee.py
ENV UWSGI_INI=./uwsgi.ini

CMD sleep 5 && uwsgi --ini uwsgi.ini