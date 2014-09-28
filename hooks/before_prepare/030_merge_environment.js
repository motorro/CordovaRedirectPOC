#!/usr/bin/env node

/**
 * Merges config file
 * User: motorro
 * Date: 01.08.2014
 * Time: 6:16
 */

var fs = require('fs');
var path = require('path');

var ROOT_DIR    = process.argv[2];
var ENVIRONMENT_REPLACE_IN_FILE = path.join(ROOT_DIR, "environment_replace_in.json");
var ENVIRONMENT_FILE = path.join(ROOT_DIR, "environment.json");
var COMMON_ENVIRONMENT_FILE = path.join(ROOT_DIR, "common_environment.json");

console.log ("========> HOOK: MERGING ENVIRONMENT");

if (false === fs.existsSync(ENVIRONMENT_REPLACE_IN_FILE)) {
    throw new Error("Skipped: no replacement needed...");
}

var REPLACE_IN = JSON.parse(fs.readFileSync(ENVIRONMENT_REPLACE_IN_FILE, 'utf8'));

var target = "development";
if (process.env.TARGET) {
    target = process.env.TARGET;
}

if (false === fs.existsSync(ENVIRONMENT_FILE)) {
    throw new Error("Environment file missing!");
}
if (false === fs.existsSync(COMMON_ENVIRONMENT_FILE)) {
    throw new Error("Common environment file missing!");
}
var config = JSON.parse(fs.readFileSync(ENVIRONMENT_FILE, 'utf8'));
var common_config = JSON.parse(fs.readFileSync(COMMON_ENVIRONMENT_FILE, 'utf8'));

var private_environment = config[target];
var common_environment = common_config[target];

if (undefined === private_environment) {
    throw new Error(["Environment", target, "was not found in environment file!"].join(" "));
}
if (undefined === common_environment) {
    throw new Error(["Environment", target, "was not found in common environment file!"].join(" "));
}

var environment = (function(){
    var result = {};
    for (var i = 0, l = arguments.length; i < l; ++i) {
        var e = arguments[i] || {};
        Object.getOwnPropertyNames(e).forEach(function(prop){
           result[prop] = e[prop];
        });
    }
    return result;
})(common_environment, private_environment);

var moreFilesToGo = REPLACE_IN.length;
var replaceCallback = function() {
    if (0 === --moreFilesToGo) {
        console.log ("Environment merged...");
    }
};

REPLACE_IN.forEach(function(file) {
    replaceStringsInFile (
        path.join(ROOT_DIR, file),
        environment,
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

