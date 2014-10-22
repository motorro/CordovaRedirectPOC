/**
 * Hooks utils
 * User: motorro
 * Date: 05.06.2014
 * Time: 9:22
 */
"use strict";

var path = require('path');
var fs = require('fs');
var stream = require('stream');
var util = require('util');
var glob = require('glob');

/**
 * Reads dir recursively returning a file list to a callback
 * @param dir Dir to read
 * @param callback func(err, fileList)
 */
function readDirRecursive(dir, callback) {
    var result = [];
    fs.exists(dir, function(exists){
        if (false === exists) {
            callback(new Error("Directory does not exist!"));
            return;
        }
        readAndProcess(dir, function(err) {
            callback(err, result);
        });
    });

    function readAndProcess(dir, callback) {
        fs.readdir(dir, function(err, files) {
            if (err) {
                callback(err);
                return;
            }
            var filesLeft = files.length;
            var hasErrors = false;
            if (0 === filesLeft) {
                callback();
                return;
            }

            files.forEach(function(file) {
                file = path.join(dir, file);
                fs.stat(file, function(err, stat) {
                    if (hasErrors) {
                        return;
                    }
                    if (err) {
                        callback(err);
                        hasErrors = true;
                        return;
                    }
                    if (false === stat.isDirectory()) {
                        result.push(file);
                        if (0 === --filesLeft) {
                            callback();
                        }
                        return;
                    }
                    readAndProcess(file, function(err) {
                        if (err) {
                            callback(err);
                            hasErrors = true;
                        }
                        if (0 === --filesLeft) {
                            callback();
                        }
                    })
                });
            });
        });
    }
}
module.exports.readDirRecursive = readDirRecursive;

/**
 * Creates directory recursively
 * @param dir Directory
 * @param callback Callback
 * @param [mode] Directory creation mode
 */
function createDirRecursive(dir, callback, mode) {
    dir = path.normalize(dir);
    mode = mode || 511;
    var currentDir = null;
    var toCreate = [];

    (function check(dir, callback) {
        fs.exists(dir, function(exists){
            if (exists) {
                currentDir = dir;
                callback();
                return;
            }
            var lastSep = dir.lastIndexOf(path.sep);
            toCreate.push(dir.substring(lastSep + 1));
            check(dir.substring(0, lastSep), callback);
        });
    })(dir, function createStep(err) {
        if (err) {
            callback(err);
            return;
        }
        if (0 === toCreate.length) {
            callback();
            return;
        }
        currentDir = path.join(currentDir, toCreate.pop());
        fs.mkdir(currentDir, mode, createStep);
    });
}
module.exports.createDirRecursive = createDirRecursive;

/**
 * Ensures that given directory exists
 * @param dir Directory
 * @param callback Callback
 * @param [mode] Directory creation mode
 */
function ensureDirExists (dir, callback, mode) {
    fs.exists(dir, function(exists){
        if (exists) {
            callback();
            return;
        }
        createDirRecursive(dir, callback, mode);
    });
}
module.exports.ensureDirExists = ensureDirExists;

/**
 * Returns an array of platform www dirs
 * @param projectRoot Project root dir
 */
function getPlatformsWww(projectRoot) {
    var platforms = process.env.CORDOVA_PLATFORMS.split(",");
    return platforms.map(function(platform){
        var platformRoot = path.join(projectRoot, "platforms", platform);
        return {
            name: platform,
            path: (function () {
                switch (platform.toLowerCase()) {
                    case "android":
                        return path.join(platformRoot, 'assets', 'www');
                    case "ios":
                        return path.join(platformRoot, 'www');
                    case "browser":
                        return path.join(platformRoot, 'www');
                    default:
                        throw new Error("Unknown platform " + platform + ". Add it to hooksUtils.js if you need it...");
                }
            })()
        };
    });
}
module.exports.getPlatformsWww = getPlatformsWww;

/**
 * Performs a glob in installed platform www dirs
 * @param projectRoot
 * @param pattern
 * @param callback
 */
function globInPlatformsWww(projectRoot, pattern, callback) {
    var platforms;
    try {
        platforms = getPlatformsWww(projectRoot);
    } catch(e) {
        callback(e);
        return;
    }
    var result = [];
    (function globPlatform(){
        var platform = platforms.pop();
        if (undefined === platform) {
            callback(null, result);
            return;
        }
        glob(pattern, {cwd:platform.path}, function(err, files) {
            if (err) {
                callback(err);
                return;
            }
            result = result.concat(files.map(function(file){
                return path.join(platform.path, file);
            }));
            globPlatform();
        });
    })();
}
module.exports.globInPlatformsWww = globInPlatformsWww;

module.exports.streams = (function(){

    /**
     * Transforms object stream to non-object
     * Needed to use as an output to file streams
     * @constructor
     */
    function ObjTransformStream() {
        stream.Transform.call(this);

        this._readableState.objectMode = false;
        this._writableState.objectMode = true;
    }
    util.inherits(ObjTransformStream, stream.Transform);

    ObjTransformStream.prototype._transform = function(obj, encoding, callback){
        this.push(obj, encoding);
        callback();
    };

    /**
     * Transforms a string to a stream
     * @param str
     * @returns {*}
     */
    function createStringStream(str) {
        var result = new stream.Readable({objectMode:true});
        result.push(str);
        result.push(null);
        return result.pipe(new ObjTransformStream());
    }

    /**
     * Transforms an object to stream using stringify
     * @param obj
     * @returns {*}
     */
    function createStringifyStream(obj) {
        return createStringStream(JSON.stringify(obj));
    }

    return {
        createStringStream: createStringStream,
        createStringifyStream: createStringifyStream
    }
})();
