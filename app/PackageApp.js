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
        resetButton.setEnabled(false);
        command().fin(function(){
            startButton.setEnabled(true);
            resetButton.setEnabled(true);
        });
    }

    var startButton = new Button("start", function() {
        runCommand(startWorkflow);
    });
});
