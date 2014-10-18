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
function UnzipCommand(from, to) {
    this._from = from;
    this._to = to;

    this._result = null;
}

/**
 * Runs a command
 * @returns {promise}
 */
UnzipCommand.prototype.run = function() {
    if (null !== this._result) {
        return this._result;
    }

    var result = Q.defer();

    var promise = this._result = result.promise;
    var that = this;
    promise.fin(function(){
        that._result = null;
    });

    var totalToReport = 0;

    var onProgress = function(e) {
        totalToReport = e.total || 0;
        result.notify(
            {
                // Have sub-zero values here...
                loaded: Math.abs(e.loaded),
                total: e.total
            }
        );
    };

    zip.unzip(
        this._from,
        this._to,
        function(unzipResult) {
            if (0 === unzipResult) {
                result.resolve(totalToReport);
            } else {
                result.reject(new Error("Unzip error"));
            }
        },
        onProgress
    );

    return promise;
};

module.exports = UnzipCommand;