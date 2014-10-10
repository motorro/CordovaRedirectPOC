#!/usr/bin/env node

/**
 * Zips update folder
 * User: motorro
 * Date: 07.10.2014
 * Time: 20:31
 */

var fs = require('fs');
var path = require('path');
var Q = require("q");
var rimraf = require('rimraf');

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksUtils = require([HOOKS_DIR, "hooksUtils"].join("/"));
var hooksPromiseUtils = require([HOOKS_DIR, "hooksPromiseUtils"].join("/"));

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
    .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR);})
    .then(function(){return hooksPromiseUtils.zipFolder(TEMP_DIR, DESTINATION_FILE);})
    .then(function(bytes){
        console.log(["Done:", bytes, "written to", DESTINATION_FILE].join(" "));
    })
    .then(function(){return Q.nfcall(rimraf, TEMP_DIR);})
    .done();

