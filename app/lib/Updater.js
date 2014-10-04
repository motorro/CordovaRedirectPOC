/**
 * Updater
 * User: motorro
 * Date: 30.09.2014
 * Time: 6:06
 */

var Q = require("q");

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
 * Returns the latest update directory URL
 * @returns {promise}
 */
Updater.prototype.getLatestInstallURL = function() {
    return this._getLatestInstallDirectory(false)
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
 * Returns latest update directory
 * @param [create] Optional creation flag
 * @default false
 * @returns {promise}
 */
Updater.prototype._getLatestInstallDirectory = function(create) {
    return this._getStorageRoot(0).then(function(root) {
        var result = Q.defer();
        root.getDirectory(
            UPDATE_DIR,
            {create: create},
            function(entry) {
                result.resolve(entry);
            },
            function(err) {
                result.reject(err);
            }
        );
        return result.promise;
    });
};

/**
 * Requests persistent storage root
 * @param [quota] Storage quota
 * @default 0
 * @returns {promise}
 * @private
 */
Updater.prototype._getStorageRoot = function(quota) {
    quota = quota || 0;
    var result = Q.defer();
    window.requestFileSystem(
        LocalFileSystem.PERSISTENT,
        quota,
        function(filesystem) {
            result.resolve(filesystem.root);
        },
        function(err) {
            result.reject(err);
        }
    );
    return result.promise;
};

module.exports = Updater;