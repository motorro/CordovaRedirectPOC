#!/usr/bin/env node

/**
 * Zips update folder
 * User: motorro
 * Date: 07.10.2014
 * Time: 20:31
 */

var fs = require('fs');
var path = require('path');
var archiver = require("archiver");
var Q = require("q");
var rimraf = require('rimraf');

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksutils = require([HOOKS_DIR, "hooksutils"].join("/"));

var TEMP_DIR  = path.join(ROOT_DIR, "update", "temp");
var DESTINATION_DIR  = path.join(ROOT_DIR, "update", "build");
var DESTINATION_FILE  = path.join(DESTINATION_DIR, "update.zip");

console.log ("========> HOOK: ZIP UPDATE");

if (false === fs.existsSync(TEMP_DIR)) {
    console.log ("Update directory not found");
    return;
}

/*
 1. Zip all files to update.zip
 2. Remove temp directory
 */
Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){return Q.nfcall(hooksutils.ensureDirExists, DESTINATION_DIR);})
    .then(function(){return zipFolder(TEMP_DIR, DESTINATION_FILE);})
    .then(function(bytes){
        console.log(["Done:", bytes, "written to", DESTINATION_FILE].join(" "));
    })
    .then(function(){return Q.nfcall(rimraf, TEMP_DIR);})
    .done();

function zipFolder(source, file) {
    var result = Q.defer();

    var output = fs.createWriteStream(file);
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
        { src: ['**/*'], cwd: source, expand: true }
    ]).finalize();

    return result.promise;
}