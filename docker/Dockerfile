FROM python:3

# install app and prereqs in /usr/src/app
WORKDIR /usr/src/app
COPY download-latest-tar.py .
RUN pip install requests
RUN python download-latest-tar.py mail929 liamrank
RUN ln -s /usr/src/app/liamrank/config /config
RUN ln -s /usr/src/app/liamrank/uploads /uploads

# prepare container for app
WORKDIR liamrank
EXPOSE 80
VOLUME /config /uploads

# run python server
CMD [ "python", "python/post-server.py" ]