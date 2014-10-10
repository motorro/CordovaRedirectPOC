#!/usr/bin/env node

/**
 * Browserifies app directory
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

var SOURCE_DIR  = path.join(ROOT_DIR, "app");
var DESTINATION_DIR  = path.join(ROOT_DIR, "www", "build");

console.log ("========> HOOK: BROWSERIFY");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}

/*
 1. Cleanup build directory
 2. Check build exists
 3. Browserify each .js in source directory
 */
Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR);})
    .then(function(){return Q.nfcall(glob, "*.js", {cwd:SOURCE_DIR, nocase:true})})
    .then(function(files){return hooksPromiseUtils.browserifyFiles(SOURCE_DIR, DESTINATION_DIR, files);})
    .then(function(numBuilt){
        console.log(numBuilt + " applications built.")
    })
    .done();
