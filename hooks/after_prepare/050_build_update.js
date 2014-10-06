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

// Create output directory
hooksutils.ensureDirExists(DESTINATION_DIR, function(err) {
    if (err) throw err;
    copyHTML(SOURCE_DIR, DESTINATION_DIR, function(err, appNumber) {
        if (err) throw err;
        console.log(appNumber + " app files copied...");
        browserifySource(SOURCE_DIR, DESTINATION_DIR, function(err, appNumber) {
            if (err) throw err;
            console.log(appNumber + " updates built. Done!");
        });
    });
});

/**
 * Copies HTML files to output directory
 * @param src Source dir
 * @param dst Destination dir
 * @param callback Result callback
 */
function copyHTML(src, dst, callback) {
    fs.readdir(src, function(err, files) {
        if (err) {
            callback(err);
            return;
        }

        var moreToGo = files.length;
        if (0 === moreToGo) {
            callback(undefined, 0);
            return;
        }

        var hasErrors = false;
        var processed = 0;

        files.forEach(function (file) {
            if (".html" !== path.extname(file)) {
                decrementToGoAndCheckFinished();
                return;
            }
            var fullPath = path.join(src, file);
            fs.stat(fullPath, function (err, stat) {
                if (hasErrors) {
                    return;
                }
                if (err) {
                    callback(err);
                    return;
                }
                if (stat.isDirectory()) {
                    decrementToGoAndCheckFinished();
                    return;
                }

                copyFile(fullPath, path.join(dst, file), function(err){
                    if (err) {
                        callback(err);
                        return;
                    }
                    ++processed;
                    decrementToGoAndCheckFinished();
                });
            });
        });

        function copyFile(src, dst, callback) {
            var callbackCalled = false;

            var rd = fs.createReadStream(src);
            rd.on("error", function(err) {
                done(err);
            });

            var wr = fs.createWriteStream(dst);
            wr.on("error", function(err) {
                done(err);
            });

            wr.on("close", function(ex) {
                done();
            });
            rd.pipe(wr);

            function done(err) {
                if (!callbackCalled) {
                    callback(err);
                    callbackCalled = true;
                }
            }
        }

        function decrementToGoAndCheckFinished() {
            --moreToGo;
            if (0 === moreToGo) {
                callback(undefined, processed);
            }
        }
    })
}

/**
 * Browserifies each file in source directory
 * @param src Source dir
 * @param dst Destination dir
 * @param callback Result callback
 */
function browserifySource(src, dst, callback) {
    fs.readdir(src, function(err, files) {
        if (err) {
            callback(err);
            return;
        }

        var moreToGo = files.length;
        if (0 === moreToGo) {
            callback(undefined, 0);
            return;
        }

        var hasErrors = false;
        var processed = 0;

        files.forEach(function(file) {
            if (".js" !== path.extname(file)) {
                decrementToGoAndCheckFinished();
                return;
            }
            var fullPath = path.join(src, file);
            fs.stat(fullPath, function(err, stat) {
                if (hasErrors) {
                    return;
                }
                if (err) {
                    callback(err);
                    return;
                }
                if (stat.isDirectory()) {
                    decrementToGoAndCheckFinished();
                    return;
                }
                exec (
                    ["browserify", fullPath, ">", path.join(dst, file)].join(" "),
                    function(error, stdout, stderr){
                        if (error) throw error;
                        ++processed;
                        decrementToGoAndCheckFinished();
                    }
                );
            });
        });

        function decrementToGoAndCheckFinished() {
            --moreToGo;
            if (0 === moreToGo) {
                callback(undefined, processed);
            }
        }
    });

}