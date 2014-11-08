# Cordova updates. Redirect PoC

This is a concept of building OTA-update packages for [Cordova](http://cordova.apache.org/) application.
You can use the updates in two ways:
1.  Build an updated app. The update is being downloaded and put to a storage folder on a device.
The `preloader` script checks if an update is available and redirects to udated version if found.
2.  You can use [Updater](./app/lib/Updater.js) static methods to dynamically resolve a path to an image, CSS or
JavaSscript. This gives you an advantage to pack only assets that has changed since the last release. See the
[PackageApp](./app/PackageApp.js#L44) for example. Unfortunately the path to app installation dir is unknown at the
build time (like iOS has an appId in www path) so we need to resolve assets on runtime with JavaScript. That introduce
some limitations on reusing originally-packed assets in static CSS (like referencing images for example).

## How application is built

A bit on application structure...

### Basics

[Browserify](https://github.com/substack/node-browserify) is used to build an application. Application files are
in the `app` subdirectory. During a build process they get built and copied (by cordova hooks) to the `www` folder.
So the `www` is an auto-generated folder for this project and is rebuilt during every `prepare`.

### Assets

The browserify build of JavaScript within `app` folder is performed every build - regardless of release or update.
Also the `static` dir of asset folder gets copied to every update package. Using `static` assets you can have a relative
paths to images in your CSS or HTML files, but thus you increase the update package size.

The `dynamic` folder is used to store assets that are resolved on a runtime by JavaScript. Building hooks use the Git
infrastructure to guess which of the files inside the `dynamic` folder has changed since the last `release` tag.
See [020_build_assets.js](./hooks/before/prepare/020_build_assets.js#L34) hook for details. When building the update
only the changed assets get packaged and the app resolves their paths dynamically on runtime. Putting assets within
`dynamic` folder saves the update package size but also makes it impossible to use them in static HTML. This is due to
we do not know the original application URL at the build time.

That approach streamlines the production process - all the changes are carried within the main app folder and you decide
which point will be the release or an update. See the workflow details below on how to build an application and
an update.

## Building and running the example

1.  `npm install`
2.  Use at least Cordova 3.6 to restore used plugin list: `cordova restore plugins --experimental`.
3.  Checkout a release tag:
3.  Checkout a "release" application: `git checkout r1`
    See [020_build_assets.js](./hooks/before/prepare/020_build_assets.js#L34)
4.  Set the `updateURL` environment variable in `common_environment.json`. The URL should point to web-accessible
    directory where the update packages will be placed. In my case the update URL is `http://motorro.com/redirect`.
    The updater app will request `http://motorro.com/redirect/android.zip`, `http://motorro.com/redirect/ios.zip` for
    each corresponding cordova platform.
5.  Use `cordova emulate android` or any other way to launch the release application on emulator or device. That is a
    "release" point - say your app has gone to market.
6.  Now you need to change something in your app to build an update. Use `git checkout master` to have assets in
    dynamic folder changed.
7.  Build update files with `BUILD_TYPE=update cordova prepare` (use `set` command to set environment vars if you use
    git in Windows prompt)
8.  Copy update files from `update` folder to the web location you have configured above.
9.  Proceed to your mobile app...

## How the app works

Here is how the app works on a mobile...

### Preloader

Loaded as a first page to cordova and redirects to either packaged or updated application.

Redirect workflow:
1.  Check the storage folder for update package
2.  If update is found - redirect there
3.  If update wasn't found - redirect to packaged index.html

### Packaged app

This is a main application that demonstrates the use of static and dynamic assets.
The update loader may be also triggered from here.

Update workflow:
1. Check for update (just a stub for this demo)
2. Download a zip file from the `updateURL` configured above
3. Unzip files to application storage directory. For this demo a non-protected dir is used!
4. When the `preloader` is run again it will find an update and use it as a main application.

## License

MIT: http://rem.mit-license.org


