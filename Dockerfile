FROM python:3-alpine3.15

RUN apt-get update && apt-get install -y uwsgi

WORKDIR /codee

COPY . .

RUN pip install -r requirements.txt

ENV FLASK_APP=codee.py
ENV UWSGI_INI=/app/uwsgi.ini

CMD ["uwsgi", "--ini", "uwsgi.ini"]
