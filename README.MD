# Redirect PoC

The concept of redirecting cordova app to storage directory if update is present there.

## Workflow

### Preloader

Loaded as a first page to cordova

1. Check the storage folder for update package
2. If update is found - redirect there
3. If update isn't found - redirect to packaged index.html

### Package

Default packaged index file  (the packaged app). For this demo includes the file download script.

## Building and running

1. `npm install`
2. Use Cordova 3.6 to restore used plugin list: `cordova restore plugins --experimental`.
3. Place an "update package" (zip with just an index.html will do) to some HTTP server. Sample "update package" is located in `update` folder. 
This sample is built the same time cordova app is prepared. So to get a zip file run `cordova prepare`.
You may also want to create a web-server upload hook to put it on webserver of your choice. See the hooks directory...
4. Set the `updateURL` environment variable in `common_environment.json` to URL to the above update package.
5. `cordova run your_platform`