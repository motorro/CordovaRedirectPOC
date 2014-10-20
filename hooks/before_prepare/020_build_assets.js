#!/usr/bin/env node

/**
 * Builds asset list based on 'release' or 'update' scheme
 * Use 'cordova prepare' to make release build
 * Use 'BUILD_TYPE="update" cordova prepare' to build updates
 * User: motorro
 * Date: 18.10.2014
 * Time: 17:56
 */
var fs = require('fs');
var path = require('path');
var Q = require("q");
var glob = require('glob');
var rimraf = require('rimraf');
var browserify = require('browserify');

var ROOT_DIR    = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksUtils = require([HOOKS_DIR, "hooksUtils"].join("/"));
var hooksPromiseUtils = require([HOOKS_DIR, "hooksPromiseUtils"].join("/"));

/**
 * Assets folder and marker
 */
var ASSETS_NAME = "assets";
var SOURCE_DIR  = path.join(ROOT_DIR, "app", ASSETS_NAME);
var DESTINATION_DIR  = path.join(ROOT_DIR, "www", ASSETS_NAME);

console.log ("========> HOOK: BUILD ASSETS");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}


var b = browserify();
b.require(hooksUtils.streams.createStringStream("module.exports=[1,2,3]"));
b.bundle().pipe(process.stdout);
// TODO: Отэта нужно использовать для экспорта оверрайдов
// Сформировать объект
require('./vendor/angular/angular.js', {expose: 'assetOverrides'});

/*
 1. Cleanup destination dir
 2. Copy all HTML files
 3. Browserify all JS files in source dir
 4. If building a release build - do the same with pre-loader
 */
Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR);})
    .then(function(){return buildFileList(SOURCE_DIR)})
    .then(function(list){
        return Q.all([
            (function() {
                return hooksPromiseUtils.copyFiles(SOURCE_DIR, DESTINATION_DIR, list)
                    .then(function(numCopied){
                        console.log(numCopied + " assets copied.")
                    })
            })()
        ]);
    })
    .done();

function buildFileList(srcDir) {
    if ("update" === process.env.BUILD_TYPE) {
        return Q.all([
            buildReleaseFileList(path.join(SOURCE_DIR, "static")),
            buildUpdateFileList(path.join(SOURCE_DIR, "dynamic"))
        ]).then(function(lists){
            return lists.reduce(
                function(soFar, list){
                    return soFar.concat(list);
                },
                []
            );
        });
    } else {
        return buildReleaseFileList(SOURCE_DIR);
    }
}

/**
 * If in 'release' mode - copy all assets
 */
function buildReleaseFileList(srcDir) {
    return Q.nfcall(glob, "**/*.*", {cwd:srcDir});
}

/**
 * If in 'update' mode - copy all assets
 * that has been changed since the last release tag
 */
function buildUpdateFileList(srcDir) {
    return Q.nfcall(glob, "**/*.*", {cwd:srcDir});
}
