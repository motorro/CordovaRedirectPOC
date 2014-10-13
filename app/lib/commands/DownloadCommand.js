/**
 * Downloads a zip file
 * User: motorro
 * Date: 11.10.2014
 * Time: 7:30
 */
"use strict";
var Q = require("q");

/**
 * Download command.
 * @param from URL to download
 * @param to FS URL to save a file
 * @param [options] Download options
 * @constructor
 */
function DownloadCommand(from, to, options) {
    this._from = from;
    this._to = to;
    this._options = options;

    this._ft = null;
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
    var from = encodeURI(this._from);
    var ft = new FileTransfer();

    var promise = this._result = result.promise;
    var that = this;
    promise.fin(function(){
       that._ft = null;
       that._result = null;
    });

    ft.onprogress = function(e) {
        result.notify(
            {
                lengthComputable: e.lengthComputable,
                loaded: e.loaded,
                total: e.total
            }
        );
    };

    ft.download(
        from,
        this._to,
        function(entry) {
            result.resolve(entry);
        },
        function(error) {
            result.reject(error);
        },
        false,
        this._options
    );

    return promise;
};

/**
 * Aborts download
 */
DownloadCommand.abort = function() {
    if (null !== this._ft) {
        this._ft.abort();
    }
};
