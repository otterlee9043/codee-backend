# Use the Python3.9-slim-buster container image
FROM python:3.9

# Set the working directory to /codee
WORKDIR /codee

# Copy the current directory contents into the container at /codee
COPY . /codee

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# run the command to start uWSGI
CMD ["uwsgi", "uwsgi.ini"]
