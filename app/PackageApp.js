/**
 * PackageApp
 * This one is distributed with application and loads update package
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:51
 */
var Q = require("q");
var log = undefined;

Updater = require("./lib/Updater");
Button = require("./lib/Button");
readyTrigger = require("./lib/readyTrigger");

/**
 * Entry point
 */
readyTrigger(function(){
    log = require("./lib/Logger").init(document.getElementById("log"));
    log("Preloader initialized...");

    function runCommand(command) {
        startButton.setEnabled(false);
        preloaderButton.setEnabled(false);
        command().fin(function(){
            startButton.setEnabled(true);
            preloaderButton.setEnabled(true);
        });
    }

    var startButton = new Button("start", function() {
        runCommand(startWorkflow);
    });
    var preloaderButton = new Button("preloader", function() {
        runCommand(toPreloader);
    });
});

/**
 * Starts POC workflow
 * 1) Check storage folder for update
 * 2) If update found - redirect there
 * 3) If not - redirect to package.html
 */
function startWorkflow() {
    var d = Q.defer();
    d.resolve();
    return d.promise;
}

/**
 * Returns to preloader
 */
function toPreloader() {
    var d = Q.defer();
    log ("Going back to preloader...");
    window.setTimeout(
        function() {
            window.location.href = "preloader.html";
        },
        500
    );
    d.resolve();
    return d.promise;
}
