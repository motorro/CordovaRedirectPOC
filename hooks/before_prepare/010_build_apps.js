#!/usr/bin/env node

/**
 * Builds applications using 'release' or 'update' scheme
 * Use 'cordova prepare' to make release build
 * Use 'BUILD_TYPE="update" cordova prepare' to build updates
 * User: motorro
 * Date: 18.10.2014
 * Time: 17:50
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
var PRELOADER_DIR  = path.join(ROOT_DIR, "app", "preloader");
var DESTINATION_DIR  = path.join(ROOT_DIR, "www");

console.log ("========> HOOK: BUILD APPS");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}

/*
 1. Cleanup destination dir
 2. Copy all HTML files
 3. Browserify all JS files in source dir
 4. If building a release build - do the same with pre-loader
*/
var result = Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR);})
    .then(function(){build(SOURCE_DIR, DESTINATION_DIR);});

if ("update" !== process.env.BUILD_TYPE) {
    result = result.then(function(){
        return build(PRELOADER_DIR, DESTINATION_DIR);
    })
}

result.done();

/**
 * 1. Copy each .html in source directory
 * 2. Browserify...
 */
function build(srcDir, dstDir) {
    return Q.nfcall(glob, "*.html", {cwd:srcDir, nocase:true})
        .then(function(files){return hooksPromiseUtils.copyFiles(srcDir, dstDir, files);})
        .then(function(numCopied){
            console.log(numCopied + " HTMLs copied.")
        })
        .then(function(){
            // Asset overrides are built using build_assets hook
            return browserify(srcDir, dstDir, ["assetOverrides"]);
        });
}

/**
 * Browserify each .js in source directory
 */
function browserify(srcDir, dstDir, externals) {
    return Q.nfcall(hooksUtils.ensureDirExists, dstDir)
        .then(function(){return Q.nfcall(glob, "*.js", {cwd:srcDir, nocase:true})})
        .then(function(files){return hooksPromiseUtils.browserifyFiles(srcDir, dstDir, files, externals);})
        .then(function(numBuilt){
            console.log(numBuilt + " applications built.")
        });
}
