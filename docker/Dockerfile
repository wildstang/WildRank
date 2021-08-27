FROM python:3

# install app and prereqs in /usr/src/app
WORKDIR /usr/src/app
COPY docker/download-latest-tar.py .
RUN pip install requests
RUN python download-latest-tar.py mail929 wildrank
RUN ln -s /usr/src/app/wildrank/config /config
RUN ln -s /usr/src/app/wildrank/uploads /uploads

# prepare container for app
WORKDIR wildrank
EXPOSE 80
VOLUME /config /uploads

# run python server
CMD [ "python", "python/post-server.py" ]