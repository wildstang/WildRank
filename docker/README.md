# WildRank Docker

This provided Dockerfile allows the application to easily be run in a continer. Configuration and uploads can be accessed though Docker volumes `config` and `uploads`, TBA API key can be passed in with the `TBA_KEY` environment variable.

### Build Image
```
docker build . -t wildrank
```

This builds with the latest release on Github. To build with a specfic release or master add the release name to the end of line 8 of the Dockerfile.


### Launch App
```
docker run -d --rm              # background, don't save
           --name wildrank      # name container
           -p 8080:80           # expose port
           -e "TBA_KEY=[KEY]"   # TBA API key
           -v config:/config    # volumes
           -v uploads:/uploads
           wildrank             # image name
```