/**
 * PackageApp
 * This one is distributed with application and loads update package
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:51
 */
var Q = require("q");
var log = undefined;

var Updater = require("./lib/Updater");
var Button = require("./lib/Button");
var readyTrigger = require("./lib/readyTrigger");

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
    log ("Starting update...");
    var updateString = log ("Progress: 0%");
    var updater = new Updater();
    return updater.getUpdate()
        .then(
            function() {
                log ("Update complete!");
            },
            function(reason) {
                log ("Error getting update: " + reason.message);
                console.log(reason);
                throw reason;
            },
            function(progress) {
                updateString = log(["Progress: ", progress, "%"].join(""), updateString);
            }
        );
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
