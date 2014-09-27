#!/usr/bin/env node

/**
 * Merges update URL
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:50
 */

var fs = require('fs');
var path = require('path');

var ROOT_DIR    = process.argv[2];

var REPLACE_IN  = [
    // Android
    "android/assets/www/js/PreloaderApp.js",
    // iOS
    "ios/www/js/platform/PreloaderApp.js"
];

var updateUrl = process.env.UPDATE_URL;
if (!updateUrl) {
    throw new Error("Update URL is not defined!");
}

console.log ("========> HOOK: MERGING UPDATE URL");

var moreFilesToGo = REPLACE_IN.length;
var replaceCallback = function() {
    if (0 === --moreFilesToGo) {
        console.log ("Update URL merged...");
    }
};

REPLACE_IN.forEach(function(file) {
    replaceStringsInFile (
        path.join(ROOT_DIR, "platforms", file),
        {updateURL: updateUrl},
        replaceCallback
    );
});

/**
 * Replaces placeholders with values in file
 * @param filename File to replace content within
 * @param replacements Key-value pairs of replacements
 * @param callback Ready callback
 */
function replaceStringsInFile(filename, replacements, callback) {
    fs.exists(filename, function(exists) {
        if (false === exists) {
            console.warn(["Skipping:", filename, ": file is missing."].join(" "));
            callback();
            return;
        }
        fs.readFile(filename, {encoding: 'utf8'}, function (err, data) {
            if (err) throw err;
            fs.writeFile(
                filename,
                Object.keys(replacements).reduce(
                    function (data, key) {
                        return data.replace(new RegExp(["#\\{", key, "\\}"].join(""), "g"), replacements[key]);
                    },
                    data
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

