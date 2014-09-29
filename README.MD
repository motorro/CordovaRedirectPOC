# Redirect PoC

The concept of redirecting cordova app to storage directory if update is present there.

## Workflow

### Preloader

Loaded as a first page to cordova

1. Check the storage folder for update package
2. If update is found - redirect there
3. If update isn't found - redirect to package.html

### Package

Default packaged index file. For this demo includes the file download script.
As soon as browser gets redirected to package when device is ready you may use a standard startup sequence (say window.onload())

## Building and running

1. Use Cordova 3.6 to restore used plugin list:
    cordova restore plugins --experimental
2. To build an app set the 'updateURL' environment variable in 'common_environment.json'.
That is an URL to take update package from.
