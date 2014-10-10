/**
 * Hooks utils
 * User: motorro
 * Date: 05.06.2014
 * Time: 9:22
 */

var path = require('path');
var fs = require('fs');

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
exports.readDirRecursive = readDirRecursive;

    /**
 * Creates directory recursively
 * @param dir Directory
 * @param callback Callback
 * @param [mode] Directory creation mode
 */
function createDirRecursive(dir, callback, mode) {
    dir = path.normalize(dir);
    mode = mode || 0777;
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
exports.createDirRecursive = createDirRecursive;

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
exports.ensureDirExists = ensureDirExists;