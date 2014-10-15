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

/*
  These are hardcoded update URL and update directory
  Should be set from outside (I guess)
  For this demo it is being injected herewith a hook when building an app
 */

/**
 * URL to check updates
 * (Merged with environment hook)
 * @type {string}
 */
var UPDATE_URL = "#{updateURL}";

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
    Updater = (function(updater) {
        return function () {
            return updater;
        };
    })(this);
}

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
    return this._getUpdateDirectory(LocalFileSystem.PERSISTENT)
    .then(
        function(dir){
            return dir && dir.toURL;
        },
        function(reason) {
            // Directory was not found
            // Consider as non-error
            if (1 === (reason && reason.code)) {
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
 * Downloads and installs the latest update
 * @returns {promise}
 */
Updater.prototype.getUpdate = function() {
    var that = this;

    // Progress will be reported as
    // 75% of total - download phase
    // 25% of total - unzip phase

    var result = Q.defer();

    this._cleanupTemporaryFiles()
        .then(function(){
            return that._getUpdateDownloadUrl()
        })
        .then(function(url){
            if (!url) {
                throw new Error("No update available");
            }

            // TODO: Do we need quota here?
            that._getUpdateDirectory(LocalFileSystem.TEMPORARY, true)
                .then(function(temp) {
                    return new Download(url, [temp, "update.zip"].join("/")).run();
                })
                .fail(function(reason) {
                    result.reject(reason);
                })

        })
        .then(function(){
            return that._getTempDirectory()
        })
        .then((function(){console.log("----->"); console.log(this)}).bind(this))
        .done();

    return result.promise;
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
     TODO: Download diff only
     Sending a hash of existing files and downloading a diff with a latest version will help to save traffic
     */
    return Q(UPDATE_URL);
};

/**
 * Returns update directory in either persistent or temporary storage
 * @param root Root type: temporary or persistent
 * @param [create] Optional creation flag
 * @default false
 * @returns {promise}
 */
Updater.prototype._getUpdateDirectory = function(root, create, quota) {
    if (null == create) create = false;
    if (null == quota) quota = 0;
    if (!create) quota = 0;
    return this._getStorageRoot(root, quota).then(function(root) {
        var result = Q.defer();
        root.getDirectory(
            UPDATE_DIR,
            {create: create},
            result.resolve,
            result.reject
        );
        return result.promise;
    });
};

/**
 * Cleans up storage folders of temporary update files - download and extracted zip (if found)
 * @returns {promise}
 */
Updater.prototype._cleanupTemporaryFiles = function() {
    return this._getUpdateDirectory(LocalFileSystem.TEMPORARY)
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
                if (1 === (reason && reason.code)) {
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
        function(reason) {
            result.reject(reason);
        }
    );
    return result.promise;
};

module.exports = Updater;