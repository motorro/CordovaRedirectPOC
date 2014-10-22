/**
 * PreloaderApp
 * This one is distributed with application and evaluates the latest version
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:28
 */
var Q = require("q");
var log = undefined;

var Updater = require("../lib/Updater");
var Button = require("../lib/Button");
var readyTrigger = require("../lib/readyTrigger");

/**
 * Entry point
 */
readyTrigger(function(){
    log = require("../lib/Logger").init(document.getElementById("log"));
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
            log ("No updates found.");
            redirect("index.html");
        } else {
            log ("Found an update!");
            redirect([url, "index.html"].join("/"));
        }
    })
    .fail(function(reason) {
        log("Error getting update package URL: " + reason.message);
        console.log(reason);
        throw reason;
    });

    function redirect(url) {
        var secondsLeft = 3;
        var logString = undefined;
        (function countdown(){
            logString = log (["Redirecting to", url, "in", secondsLeft, "seconds"].join(" "), logString);
            if (0 === secondsLeft--) {
                window.location.href = url;
                return;
            }
            window.setTimeout(countdown, 1000);
        })();
    }
}

/**
 * Deletes update package if present
 */
function resetApplication() {

}

