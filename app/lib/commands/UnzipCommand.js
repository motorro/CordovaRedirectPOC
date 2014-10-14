/**
 * Unzips a file
 * User: motorro
 * Date: 14.10.2014
 * Time: 5:47
 */
"use strict";
var Q = require("q");

/**
 * Unzip command.
 * @param from File to unzip
 * @param to Folder to put contents
 * @constructor
 */
function DownloadCommand(from, to) {
    this._from = from;
    this._to = to;

    this._result = null;
}

/**
 * Runs a command
 * @returns {promise}
 */
DownloadCommand.prototype.run = function() {
    if (null !== this._result) {
        return this._result;
    }

    var result = Q.defer();

    var promise = this._result = result.promise;
    var that = this;
    promise.fin(function(){
        that._result = null;
    });

    var onProgress = function(e) {
        result.notify(
            {
                loaded: e.loaded,
                total: e.total
            }
        );
    };

    zip.unzip(
        this._from,
        this._to,
        function(result) {
            result[result = 0 ? "resolve" : "reject"](result);
        },
        onProgress
    );

    return promise;
};
