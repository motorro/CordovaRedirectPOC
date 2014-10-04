/**
 * PreloaderApp
 * This one is distributed with application and evaluates the latest version
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:28
 */
Q = require("q");
Logger = require("./lib/Logger");
var log = Logger.log;

Updater = require("./lib/Updater");
Button = require("./lib/Button");
readyTrigger = require("./lib/readyTrigger");

/**
 * Entry point
 */
readyTrigger(function(){
    Logger.init("log");
    log("Preloader initialized...");

    function runCommand(command) {
        startButton.setEnabled(false);
        resetButton.setEnabled(false);
        command().fin(function(){
            startButton.setEnabled(true);
            resetButton.setEnabled(true);
        });
    }

    var startButton = new Button("start", function() {
        runCommand(startWorkflow);
    });

    var resetButton = new Button("reset", function() {
        runCommand(resetApplication);
    });

});

/**
 * Starts POC workflow
 * 1) Check storage folder for update
 * 2) If update found - redirect there
 * 3) If not - redirect to package.html
 */
function startWorkflow() {
    var updater = new Updater();
    return updater.getLatestInstallURL()
    .then(function(url) {
        if (undefined === url) {
            log ("No updates found. Redirecting to packaged index.html");
        } else {
            log ("Found an update! Redirecting to updated index.html");
        }
    })
    .fail(function(reason) {
        log("Error getting update package URL: " + reason.message);
        console.log(reason);
        throw reason;
    });
}

/**
 * Deletes update package if present
 */
function resetApplication() {

}

