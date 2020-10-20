# LiamRank Docker

This provided Dockerfile allows the application to easily be run in a continer. Configuration and uploads can be accessed though Docker volumes `config` and `uploads`, TBA API key can be passed in with the `TBA_KEY` environment variable.

### Build Image
```
docker build . -t liamrank
```

### Launch App
```
docker run -d --rm              # background, don't save
           --name liamrank      # name container
           -p 8080:80           # expose port
           -e "TBA_KEY=[KEY]"   # TBA API key
           -v config:/config    # volumes
           -v uploads:/uploads
           liamrank             # image name
```