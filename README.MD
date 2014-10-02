# Redirect PoC

The concept of redirecting cordova app to storage directory if update is present there.

## Workflow

### Preloader

Loaded as a first page to cordova

1. Check the storage folder for update package
2. If update is found - redirect there
3. If update isn't found - redirect to packaged index.html

### Package

Default packaged index file. For this demo includes the file download script.
As soon as browser gets redirected to package when device is ready you may use a standard startup sequence (say window.onload())

## Building and running

1. Use Cordova 3.6 to restore used plugin list: `cordova restore plugins --experimental`.
2. Place an "update package" (zip with just an index.html will do) to some HTTP server.
2. Set the `updateURL` environment variable in `common_environment.json` to URL to the above update package.
3. `cordova run your_platform`