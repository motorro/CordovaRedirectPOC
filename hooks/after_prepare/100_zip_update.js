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

var PLATFORMS = hooksUtils.getPlatformsWww(ROOT_DIR);

var TEMP_DIR  = path.join(ROOT_DIR, "update", "temp");
var DESTINATION_DIR  = path.join(ROOT_DIR, "update");

console.log ("========> HOOK: ZIP UPDATE");

if ("update" !== process.env.BUILD_TYPE) {
    console.log ("Release build. Skipped...");
    return
}

Q.nfcall(rimraf, DESTINATION_DIR)
    .then(function(){ return Q.nfcall(hooksUtils.ensureDirExists, DESTINATION_DIR); })
    .then(function() {
        var result = Q();
        PLATFORMS.forEach(function(platform){
            result.then(function(){ return hooksPromiseUtils.zipFolder(platform.path, path.join(DESTINATION_DIR, platform.name + ".zip")); })
                .then(
                    function(bytes){ console.log("Platform '" + platform.name + "' built. " + bytes + " written."); },
                    undefined,
                    function(reason) {
                        if (34 === (reason && reason.errno)) {
                            console.log("Platform '" + platform.name + "' skipped...");
                            return;
                        }
                        throw(reason);
                    }
                );
        });
        return result;
    })
    .done();

