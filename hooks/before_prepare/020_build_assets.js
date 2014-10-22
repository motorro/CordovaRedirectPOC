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
var exec = require('child_process').exec;

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
var RELEASE_TAG_PATTERN = "r*";

console.log ("========> HOOK: BUILD ASSETS");

if (false === fs.existsSync(SOURCE_DIR)) {
    throw new Error("Source directory not found!");
}

var staticSource = path.join(SOURCE_DIR, "static");
var staticDestination = path.join(DESTINATION_DIR, "static");
var dynamicSource = path.join(SOURCE_DIR, "dynamic");
var dynamicDestination = path.join(DESTINATION_DIR, "dynamic");
var assetOverridesPath = path.join(DESTINATION_DIR, "assetOverrides.js");

/*
 1. Cleanup destination dir
 2. Copy all static assets. In case of release it is a whole assets directory
 3. If building update - build a separate dynamic asset list - files loaded with JS that could be resolved on runtime.
 4. Form an assetOverrides module to resolve dynamic assets
 */
var sequence =
    Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){ return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR); })
    // Copy static assets
    .then(function(){ Q.nfcall(hooksUtils.ensureDirExists, staticDestination); })
    .then(function(){ return buildReleaseFileList(staticSource); })
    .then(function(list){ return hooksPromiseUtils.copyFiles(staticSource, staticDestination, list); })
    .then(function(numCopied){
        console.log(numCopied + " static assets copied.")
    })
    // Copy dynamic files
    .then(function(){ Q.nfcall(hooksUtils.ensureDirExists, dynamicDestination); });

    if ("update" === process.env.BUILD_TYPE) {
        sequence = sequence.then(function() {
            return buildUpdateFileList(dynamicSource)
        })
        .then(function(list) {
            // Build a list of overrides
            return buildAssetOverrideList(list, assetOverridesPath).thenResolve(list);
        });
    } else {
        sequence = sequence.then(function() {
            return buildReleaseFileList(dynamicSource)
        })
        .then(function(list) {
            // Build an empty list to speedup resolve
            return buildAssetOverrideList([], assetOverridesPath).thenResolve(list);
        });
    }

    sequence = sequence.then(function(list){ return hooksPromiseUtils.copyFiles(dynamicSource, dynamicDestination, list); })
    .then(function(numCopied){
        console.log(numCopied + " dynamic assets copied.")
    })
    .done();

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
    /*
     1. Describe the current commit since the last tag matching the RELEASE_TAG_PATTERN
     If release tag was not found - the function will reject. That is considered Ok since why do you need an update then?
     2. Get files changed since that commit srcDir folder
     3. Build file list using this files
     */
    var commitsRe = /-(\d+)-g[0-9a-f]+$/im;

    return Q.nfcall(exec, "git describe --match " + RELEASE_TAG_PATTERN)
        .spread(function(stdout) {
            // Find number of commits since the last tag
            var test = commitsRe.exec(stdout.trim());
            var commitsSince = (null !== test && parseInt(test[1], 10)) || 0;
            console.log(["You are", commitsSince, "commits since last release tag."].join(" "));
            return commitsSince;
        })
        .then(function(commits){
            if (0 === commits) {
                return [];
            }
            return Q.nfcall(exec, ["git diff HEAD~", commits, " --name-only --diff-filter=ACMR ", srcDir].join(""))
                .spread(function(stdout){
                    return stdout.trim().split(/[\n]/).filter(function(name){ return "" !== name.trim(); });
                })
        })
        .then(function(files) {
            console.log(files.length + " files changed since last release tag.");
            return files;
        });
}

/**
 * Creates a browserify module to resolve resources
 * @param files File list
 * @param module Output module file
 */
function buildAssetOverrideList(files, module) {
    var result = Q.defer();

    // Make an object from file array to speed-up asset resolving
    var fileMap = {};
    var i = files.length;
    while (--i >= 0) {
        fileMap[files[i]] = true;
    }

    var output = fs.createWriteStream(module);
    output.on("error", function (err) {
        result.reject(err);
    });
    output.on('close', function () {
        result.resolve();
    });

    var b = browserify();
    b.require(
        hooksUtils.streams.createStringStream("module.exports=" + JSON.stringify(fileMap)),
        {expose: 'assetOverrides'}
    );
    var bundle = b.bundle();
    bundle.pipe(output);
    bundle.on("error", function (err) {
        result.reject(err);
    });

    return result.promise;
}
