#!/usr/bin/env node

/**
 * Builds update application
 * User: motorro
 * Date: 28.09.2014
 * Time: 7:50
 */
var fs = require('fs');
var path = require('path');
var Q = require("q");
var glob = require('glob');
var rimraf = require('rimraf');

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksUtils = require([HOOKS_DIR, "hooksUtils"].join("/"));
var hooksPromiseUtils = require([HOOKS_DIR, "hooksPromiseUtils"].join("/"));

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
    .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, TEMP_DIR);})
    .then(function(){return Q.nfcall(glob, "**/*.!(js)", {cwd:SOURCE_DIR, nocase:true})})
    .then(function(files){return hooksPromiseUtils.copyFiles(SOURCE_DIR, TEMP_DIR, files);})
    .then(function(numCopied){
        console.log(numCopied + " app files copied.");
    })
    .then(function(){return Q.nfcall(glob, "*.js", {cwd:SOURCE_DIR, nocase:true})})
    .then(function(files){return hooksPromiseUtils.browserifyFiles(SOURCE_DIR, TEMP_DIR, files);})
    .then(function(numBuilt){
        console.log(numBuilt + " app sources built.")
    })
    .done();

