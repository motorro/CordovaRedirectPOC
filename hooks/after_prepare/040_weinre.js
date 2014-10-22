#!/usr/bin/env node

/**
 * Installs weinre in debug mode
 * Pass weinre settings in 'prepare' environment variables
 * 'WEINRE="" cordova prepare' - installs weinre on first available external interface and port 8090
 * 'WEINRE=":1010" cordova prepare' installs weinre on first available external interface and port 1010
 * 'WEINRE="10.0.0.1:9090" cordova prepare' - installs weinre on ip 10.0.0.1 and port 1010
 * User: motorro
 * Date: 04.08.2014
 * Time: 20:27
 */
"use strict";

var fs = require('fs');
var path = require('path');
var os=require('os');

var ROOT_DIR = process.argv[2];
var HOOKS_DIR   = process.env["CORDOVA_HOOK"]
    ? path.dirname(path.dirname(process.env["CORDOVA_HOOK"]))
    : path.join(ROOT_DIR, "hooks");

var hooksUtils = require([HOOKS_DIR, "hooksUtils"].join("/"));

var target = "development";
if (process.env.TARGET) {
    target = process.env.TARGET;
}

console.log ("========> HOOK: SETTING UP WEINRE");
// Non-release only
if ("release" === target) {
    console.log ("Skipped - release build...");
    return;
}
// Only if WEINRE environment set
if ("undefined" === typeof process.env.WEINRE) {
    console.log ("Skipped - weinre is not required");
    return;
}

// Passed weinre options (IP and port)
var WEINRE = (process.env.WEINRE || ":8090").split(":");

// Get IP from environment variable or take first external one
var ip = WEINRE[0] || (function() {
    var interfaces = os.networkInterfaces();
    var int, address;
    for (var i in interfaces) {
        if (interfaces.hasOwnProperty(i)) {
            int = interfaces[i];
            for (var j = 0, l = int.length; j < l; ++j) {
                address = int[j];
                if (false === address.internal && "IPv4" === address.family) {
                    return address.address;
                }
            }
        }
    }
})();
var port = WEINRE[1] || 8090;

hooksUtils.globInPlatformsWww(ROOT_DIR, "**/*.html", function (err, files) {
    if (err) throw err;
    (function placeToFile() {
        var file = files.pop();
        if (undefined === file) {
            console.log (["Weinre set to: ", ip, ":", port].join(""));
            return;
        }
        placeWeinre (
            file,
            ip,
            port,
            placeToFile
        );
    })();
});

/**
 * Places Weinre script to a html head section
 * @param filename
 * @param ip
 * @param port
 * @param callback
 */
function placeWeinre(filename, ip, port, callback) {
    fs.exists(filename, function(exists) {
        if (false === exists) {
            console.warn(["Skipping:", filename, ": file is missing."].join(" "));
            callback();
            return;
        }
        fs.readFile(filename, {encoding: 'utf8'}, function (err, data) {
            if (err) throw err;
            if (!data) {
                console.warn(["Skipping:", filename, "is empty"].join(" "));
                callback();
                return;
            }

            fs.writeFile(
                filename,
                data.replace(
                    /<!-- WEINRE -->/g,
                    ['<script type="text/javascript" src="http://', ip, ":", port, '/target/target-script-min.js#anonymous"></script>'].join("")
                ),
                {encoding: 'utf8'},
                function (err) {
                    if (err) throw err;
                    callback();
                }
            );
        });
    });
}
