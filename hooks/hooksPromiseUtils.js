/**
 * Hooks utils that use Q promises
 * User: motorro
 * Date: 10.10.2014
 * Time: 6:05
 */

var Q = require("q");
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var archiver = require("archiver");
var hooksUtils = require("./hooksUtils");

/**
 * Copies file
 * @param src
 * @param dst
 * @returns {Promise}
 */
function copyFile(src, dst) {
    var result = Q.defer();

    var rd = fs.createReadStream(src);
    rd.on("error", function(err) {
        result.reject(err);
    });

    var wr = fs.createWriteStream(dst);
    wr.on("error", function(err) {
        result.reject(err);
    });

    wr.on("close", function(ex) {
        result.resolve();
    });
    rd.pipe(wr);

    return result.promise;
}
module.exports.copyFile = copyFile;

/**
 * Copies given file list from 'src' to 'dst' recreating folder structure
 * @param src Source dir
 * @param dst Destination dir
 * @param files File list relative to source dir
 * @returns {Promise}
 */
function copyFiles(src, dst, files) {
    return files.reduce(
        function(soFar, file) {
            var dstFile = path.join(dst, file);
            return soFar
                .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, path.dirname(dstFile))})
                .then(function(){return copyFile(path.join(src, file), dstFile)})
        },
        Q()
    ).then(function(){
        return files.length;
    });
}
module.exports.copyFiles = copyFiles;

/**
 * Browserifies each .js file in source directory
 * @param src Source dir
 * @param dst Destination dir
 * @param files File list relative to source dir
 * @returns {Promise}
 */
function browserifyFiles(src, dst, files) {
    return files.reduce(
        function(soFar, file) {
            return Q.nfcall(
                exec,
                ["browserify", path.join(src, file), ">", path.join(dst, file)].join(" ")
            ).then(function(result) {
                var stdout = result && result[0];
                if (stdout) console.log(stdout);
                return true;
            })
        },
        Q()
    ).then(function(){
            return files.length;
        });
}
module.exports.browserifyFiles = browserifyFiles;

/**
 * Zips 'src' folder to 'dst' file
 * @param src Source dir
 * @param dst Destination archive file
 * @returns {Promise}
 */
function zipFolder(src, dst) {
    var result = Q.defer();

    var output = fs.createWriteStream(dst);
    output.on("error", function(err) {
        result.reject(err);
    });
    output.on('close', function() {
        result.resolve(zip.pointer());
    });

    var zip = archiver("zip");
    output.on("error", function(err) {
        result.reject(err);
    });

    zip.pipe(output);

    zip.bulk([
        { src: ['**/*'], cwd: src, expand: true }
    ]).finalize();

    return result.promise;
}
module.exports.zipFolder = zipFolder;
