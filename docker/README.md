# WildRank Docker

This provided Dockerfile allows the application to easily be run in a continer. Configuration and uploads can be accessed though Docker volumes `config` and `uploads`. The server POST password can be passed in with the `PASSWORD` environment variable and the number of worker to assign to the server with the `WR_WORKERS` variable.

### Build Image
```
docker build . -t wildrank
```

This builds with the latest release on Github. To build with a specfic release or master add the release name to the end of line 8 of the Dockerfile. If the ` --build-arg GIT_TAG=[TAG]` argument is provided the image will be built using the given tag on the Git server.


### Launch App
```
docker run -d --rm                   # background, don't save
    --name wildrank                  # name container
    -p 8080:80                       # expose port
    -e "WR_WORKERS=[NUM_WORKERS]"    # number of assigned workers
    -e "PASSWORD=[SERVER_PASSWORD]"  # server POST password
    -v config:/config                # volumes
    -v uploads:/uploads
    wildrank                         # image name
```