#!/usr/bin/env node

/**
 * Browserifies update directory and builds update.zip
 * TODO: Use gulp - this is just a Q exercise :)
 * User: motorro
 * Date: 28.09.2014
 * Time: 7:50
 */
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var exec = require('child_process').exec;
var rimraf = require('rimraf');
var Q = require("q");

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksutils = require([HOOKS_DIR, "hooksutils"].join("/"));

var SOURCE_DIR = path.join(ROOT_DIR, "update");
var TEMP_DIR = path.join(SOURCE_DIR, "temp");
var DESTINATION_DIR  = path.join(SOURCE_DIR, "build");

console.log ("========> HOOK: BUILD UPDATE");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}

/*
    1. Cleanup temp directory
    2. Check temp exists
    3. Copy all .html files
    4. Browserify each .js in source directory
*/
Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){return Q.nfcall(rimraf, TEMP_DIR);})
    .then(function(){return Q.nfcall(hooksutils.ensureDirExists, TEMP_DIR);})
    .then(function(){return Q.nfcall(glob, "**/*.!(js)", {cwd:SOURCE_DIR, nocase:true})})
    .then(function(files){return copyFiles(SOURCE_DIR, TEMP_DIR, files);})
    .then(function(numCopied){
        console.log(numCopied + " app files copied.");
    })
    .then(function(){return Q.nfcall(glob, "*.js", {cwd:SOURCE_DIR, nocase:true})})
    .then(function(files){return browserifyFiles(SOURCE_DIR, TEMP_DIR, files);})
    .then(function(numBuilt){
        console.log(numBuilt + " app sources built.")
    })
    .done();

/**
 * Filters out files with given extensions
 * Directories are skipped
 * @param folder Base path
 * @param filter Extensions to include
 * @returns {Promise}
 */
function createFileExtensionFilter(folder, filter) {
    if (!filter) filter = [".*"];
    if (!Array.isArray(filter)) filter = [filter];
    return function(files) {
        if (".*" !== filter[0]) {
            files = files.filter(function(file) {
                return filter.indexOf(path.extname(file)) >= 0;
            });
        }
        return Q.all(files.map(
            function(file) {
                return Q.nfcall(fs.stat, path.join(folder, file));
            }
        )).then(function(stats){
            return files.filter(function(file, index){
                return !stats[index].isDirectory();
            })
        });
    }
}

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

/**
 * Copies given file list from cwd to dst recreating folder structure
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
                .then(function(){return Q.nfcall(hooksutils.ensureDirExists, path.dirname(dstFile))})
                .then(function(){return copyFile(path.join(src, file), dstFile)})
        },
        Q()
    ).then(function(){
        return files.length;
    });
}

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
