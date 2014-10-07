#!/usr/bin/env node

/**
 * Browserifies app directory
 * User: motorro
 * Date: 28.09.2014
 * Time: 7:50
 */
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var JSZip = require("jszip");
var Q = require("q");

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksutils = require([HOOKS_DIR, "hooksutils"].join("/"));

var SOURCE_DIR  = path.join(ROOT_DIR, "update");
var DESTINATION_DIR  = path.join(ROOT_DIR, "update", "build");

console.log ("========> HOOK: BUILD UPDATE");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}

Q.nfcall(hooksutils.ensureDirExists, DESTINATION_DIR)
    .then(function(){return copyHTML(SOURCE_DIR, DESTINATION_DIR);})
    .then(function(numCopied){
        console.log(numCopied + " app files copied.");
    })
    .then(function(){return browserifySource(SOURCE_DIR, DESTINATION_DIR);})
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
 * Copies HTML files to output directory
 * @param src Source dir
 * @param dst Destination dir
 */
function copyHTML(src, dst) {
    return Q.nfcall(fs.readdir, src)
        .then(createFileExtensionFilter(src, ".html"))
        .then(function(files) {
            return Q.all(files.map(
                function(file) {
                    return copyFile(path.join(src, file), path.join(dst, file));
                }
            ));
        })
        .then(function(copied){
            return copied.length;
        });
}

/**
 * Browserifies each file in source directory
 * @param src Source dir
 * @param dst Destination dir
 * @param callback Result callback
 */
function browserifySource(src, dst, callback) {
    return Q.nfcall(fs.readdir, src)
        .then(createFileExtensionFilter(src, ".js"))
        .then(function(files) {
            return Q.all(files.map(
                function(file) {
                    return Q.nfcall(
                        exec,
                        ["browserify", path.join(src, file), ">", path.join(dst, file)].join(" ")
                    ).then(function(result) {
                        var stdout = result && result[0];
                        if (stdout) console.log(stdout);
                        return true;
                    })
                }
            ));
        })
        .then(function(built){
            return built.length;
        });
}