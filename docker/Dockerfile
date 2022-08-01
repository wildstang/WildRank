FROM python:3

# set default build variables
ARG GIT_TAG

# install app and prereqs in /usr/src/app
WORKDIR /usr/src/app
COPY download-latest-tar.py .
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /tmp/requirements.txt
RUN python download-latest-tar.py wildstang wildrank $GIT_TAG
RUN ln -s /usr/src/app/wildrank/config /config
RUN ln -s /usr/src/app/wildrank/uploads /uploads

# set default environment variables
ENV WR_WORKERS=1

# prepare container for app
WORKDIR wildrank
EXPOSE 80
VOLUME /config /uploads

# run python server
CMD uvicorn --host 0.0.0.0 --port 80 --workers $WR_WORKERS --app-dir python server:app