/**
 * Updater
 * User: motorro
 * Date: 30.09.2014
 * Time: 6:06
 */

"use strict";

var Q = require("q");
var Download = require("./commands/DownloadCommand");
var Unzip = require("./commands/UnzipCommand");
var fuse = require("./methodFuse").createFusedFunction;
var readyTrigger = require("./readyTrigger");

/**
 * Built dynamic asset list
 * @type {string}
 */
var ASSET_OVERRIDES = require('assetOverrides');

/**
 * Update package dynamic asset prefix
 * @type {string}
 */
var OVERRIDE_ASSET_URL_PREFIX = "assets/dynamic/";
/**
 * Packaged app dynamic asset prefix
 * @type {string}
 */
var PACKAGE_ASSET_URL_PREFIX = undefined;
readyTrigger(function() {
    PACKAGE_ASSET_URL_PREFIX = cordova.file.applicationDirectory + OVERRIDE_ASSET_URL_PREFIX;
});

/**
 * Update directory name
 * @type {string}
 */
var UPDATE_DIR = "update";

/**
 * Checks for updates, downloads and unpacks new updates
 * Singleton
 * @constructor
 */
function Updater() {

    // Protect update method so it could be run once at a time
    this.getUpdate = fuse(this._getUpdate, this);

    Updater = (function(updater) {
        return function () {
            return updater;
        };
    })(this);
}

/**
 * Resolves dynamic asset filename to packaged or updated file
 * Resolved path is relative to index.html
 * @param {string} asset Asset path relative to 'dynamic' folder
 * @returns {string} Asset URL
 */
Updater.resolveAsset = function(asset) {
    if (undefined === PACKAGE_ASSET_URL_PREFIX) {
        throw (new Error("Package prefix is not defined. Check that cordova device is ready."));
    }
    return (ASSET_OVERRIDES[asset] !== undefined ? OVERRIDE_ASSET_URL_PREFIX : PACKAGE_ASSET_URL_PREFIX) + asset;
};

/**
 * Loads dynamic JavaScript asset
 * @param {string} asset Asset path relative to 'dynamic' folder
 */
Updater.loadJsAsset = function(asset) {
    asset = Updater.resolveAsset(asset);
    var tag = document.createElement("script");
    tag.setAttribute("type", "text/javascript");
    tag.setAttribute("src", asset);
    document.body.appendChild(tag);
};

/**
 * Loads dynamic CSS asset
 * @param {string} asset Asset path relative to 'dynamic' folder
 */
Updater.loadCssAsset = function(asset) {
    asset = Updater.resolveAsset(asset);
    var tag = document.createElement("script");
    tag.setAttribute("rel", "stylesheet");
    tag.setAttribute("type", "text/css");
    tag.setAttribute("href", asset);
    document.body.appendChild(tag);
};

/**
 * Returns the latest installed version
 * @returns {promise}
 */
Updater.prototype.getLatestInstalledVersion = function() {
    //TODO: Implement version storage. Some json with app version will do
    /*
        1. Check update directory and look for version there
        2. If no update available - get version from application root
     */
    return Q("1.0.0");
};

/**
 * Returns the latest update directory URL
 * @returns {promise}
 */
Updater.prototype.getLatestInstallURL = function() {
    return this._getUpdateDirectory(window.LocalFileSystem.PERSISTENT)
    .then(
        function(dir){
            return dir && dir.toURL();
        },
        function(reason) {
            // Directory was not found
            // Consider as non-error
            if (1 === (reason && reason.sourceError && reason.sourceError.code)) {
                return undefined;
            }
            // Otherwise - rethrow
            throw reason;
        }
    );
};

/**
 * Checks if update is available on a web-server
 * @returns {promise}
 */
Updater.prototype.isUpdateAvailable = function() {
    return this._getUpdateDownloadUrl()
        .then(function(url){
            return !!url;
        });
};

/**
 * Cleans up all available updates
 * @returns {promise}
 */
Updater.prototype.reset = function() {
    return this._cleanupUpdateFiles(window.LocalFileSystem.PERSISTENT);
};

/**
 * Downloads and installs the latest update
 * The method is private. A fused instance is created in constructor
 * @returns {promise}
 * @private
 */
Updater.prototype._getUpdate = function() {
    var that = this;
    var PERSISTENT_ROOT = window.LocalFileSystem.PERSISTENT;
    var TEMPORARY_ROOT = window.LocalFileSystem.TEMPORARY;


    // Progress will be reported as
    var progress = [
        // 75% of total - download phase
        {
            name: "download",
            volume: 0.75,
            value: 0
        },
        // 25% of total - unzip phase
        {
            name: "unzip",
            volume: 0.25,
            value: 0
        }
    ];


    var result = Q.defer();

    that._cleanupUpdateFiles(TEMPORARY_ROOT)
        .then(function(){
            // 1. Get update URL
            return that._getUpdateDownloadUrl()
        })
        .then(function(url) {
            // 2. Check URL
            if (!url) {
                throw new Error("No update available");
            }

            // 3. Get temporary directory
            // TODO: Do we need quota here?
            return that._getUpdateDirectory(TEMPORARY_ROOT, true)
                .then(function(temp) {
                    // 4. Download update
                    return downloadUpdate(temp, url)
                        .then(function (updateFile) {
                            // 5. Unzip files
                            return unzipUpdate(temp, updateFile);
                        });
                });
        })
        // 6. Move update to persistent storage
        .then(moveUpdateToPersistentStorage)
        .then(function(){
            // 7. Cleanup temporary files
            return that._cleanupUpdateFiles(TEMPORARY_ROOT)
        })
        .then(result.resolve, result.reject);

    return result.promise;

    /**
     * Sends progress event based on
     * @param percent
     * @param stage
     */
    function sendProgress(percent, stage) {
        result.notify(progress.reduce(
            function (total, processedStage) {
                if (stage === processedStage.name) {
                    processedStage.value = percent;
                }
                return total + processedStage.value * processedStage.volume;
            },
            0
        ));
    }

    /**
     * Downloads update and handles progress that is being redispatch through master result
     * @param tmpDir Temp directory entry
     * @param url Update file URL
     */
    function downloadUpdate(tmpDir, url) {
        var file = [tmpDir.toURL(), "update.zip"].join("/");
        var downloadPercent = 0;
        return new Download(url, file).run()
            .progress (function(progress) {
                if (progress.lengthComputable) {
                    downloadPercent = Math.round((progress.loaded / progress.total) * 100);
                } else {
                    downloadPercent += 10;
                }
                sendProgress(Math.min(downloadPercent, 100), "download");
            });
    }

    /**
     * Unzips update and handles progress that is being redispatch through master result
     * @param tmpDir Temp directory entry
     * @param file File entry to unzip
     */
    function unzipUpdate(tmpDir, file) {
        return (function() {
            // 1. Create directory to unzip files to
            var result = Q.defer();
            tmpDir.getDirectory(
                "unzipped",
                {create: true},
                result.resolve,
                rejectWithFileError.bind(undefined, result)
            );
            return result.promise;
        })()
        .then(function(unzipTo) {
            // 2. Unzip files to temporary directory
            return new Unzip(file.toURL(), unzipTo.toURL()).run()
                .progress (function(progress) {
                    sendProgress(Math.round((progress.loaded / progress.total) * 100), "unzip");
                })
                .thenResolve(unzipTo);
        });
    }

    /**
     * Moves temporary update directory to persistent location
     * @param tempUpdateDir
     * @returns {*}
     */
    function moveUpdateToPersistentStorage(tempUpdateDir) {
        // TODO: Do we need quota here?
        // 1. Cleanup previously installed update
        return that._cleanupUpdateFiles(PERSISTENT_ROOT)
            .then(function(){
                // 2. Get storage root
                return that._getStorageRoot(PERSISTENT_ROOT)
            })
            .then(function(persistentDir) {
                // 3. Move files there
                var result = Q.defer();
                tempUpdateDir.moveTo(
                    persistentDir,
                    UPDATE_DIR,
                    result.resolve,
                    rejectWithFileError.bind(undefined, result)
                );
                return result.promise;
            });
    }
};

/**
 * Checks if update is available on a web-server and returns update zip URL
 * @returns {promise}
 * @private
 */
Updater.prototype._getUpdateDownloadUrl = function() {
    // TODO: Make an AJAX request
    /*
     1. Get latest installed version with getLatestInstalledVersion
     2. Send it to server
     3. Get the result
     */

    /*
     This is hardcoded update URL
     Should be set from outside (I guess)
     For this demo it is being injected here with a hook when building an app
     */

    return Q(["#{updateURL}", "/", cordova.platformId, ".zip"].join(""));
};


/**
 * Returns update directory in either persistent or temporary storage
 * @param root Root type: temporary or persistent
 * @param [create] Optional creation flag
 * @param [quota] Optional quota size
 * @default false
 * @returns {promise}
 */
Updater.prototype._getUpdateDirectory = function(root, create, quota) {
    if (null == create) create = false;
    if (null == quota) quota = 0;
    if (!create) quota = 0;

    // TODO: Use private directory
    // window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(entry){console.log(entry);}, function(error){console.log(error);})

    return this._getStorageRoot(root, quota).then(function(root) {
        var result = Q.defer();
        root.getDirectory(
            UPDATE_DIR,
            {create: create},
            result.resolve,
            rejectWithFileError.bind(undefined, result)
        );
        return result.promise;
    });
};

/**
 * Cleans up storage folders of update files - either in temporary or persistent folder
 * @param root Root type: temporary or persistent
 * @returns {promise}
 */
Updater.prototype._cleanupUpdateFiles = function(root) {
    return this._getUpdateDirectory(root)
        .then(
            function(dirEntry){
                var result = Q.defer();
                dirEntry.removeRecursively(
                    result.resolve,
                    result.reject
                );
                return result.promise;
            },
            function(reason){
                // Directory was not found
                // Consider as non-error
                if (1 === (reason && reason.sourceError && reason.sourceError.code)) {
                    return undefined;
                }
                // Otherwise - rethrow
                throw reason;
            }
        );
};

/**
 * Requests storage root
 * @param root Root type
 * @param [quota] Storage quota
 * @default 0
 * @returns {promise}
 * @private
 */
Updater.prototype._getStorageRoot = function(root, quota) {
    quota = quota || 0;
    var result = Q.defer();
    window.requestFileSystem(
        root,
        quota,
        function(filesystem) {
            result.resolve(filesystem.root);
        },
        rejectWithFileError.bind(undefined, result)
    );
    return result.promise;
};

module.exports = Updater;

/**
 * Helper function to make file errors human-readable
 * @param error
 * @returns {Error}
 */
function createFileError(error) {
    var code = error && error.code;
    var result = new Error(["File system error:", code].join(" "));
    result.sourceError = error;
    return result;
}

/**
 * Helper function to reject a deferred with file error
 * @param deferred
 * @param error
 */
function rejectWithFileError(deferred, error) {
    deferred.reject(createFileError(error));
}

