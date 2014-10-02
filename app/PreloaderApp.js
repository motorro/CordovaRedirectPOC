/**
 * PreloaderApp
 * This one is distributed with application and evaluates the latest version
 * User: motorro
 * Date: 27.09.2014
 * Time: 9:28
 */
Q = require("q");
Updater = require("lib/Updater");
Button = require("lib/Button");
readyTrigger = require("lib/readyTrigger");


/**
 * Entry point
 */
readyTrigger(function(){
    console.log("Preloader start...");
    var startButton = new Button("start", function() {
        startButton.setEnabled(false);
        resetButton.setEnabled(false);
        startWorkflow();
    });

    var resetButton = new Button("reset", function() {
        startButton.setEnabled(false);
        resetButton.setEnabled(false);
        resetApplication().fin(function(){
            startButton.setEnabled(true);
            resetButton.setEnabled(true);
        });
    });

});

/**
 * Starts POC workflow
 * 1) Check storage folder for update
 * 2) If update found - redirect there
 * 3) If not - redirect to package.html
 */
function startWorkflow() {

}

/**
 * Deletes update package if present
 */
function resetApplication() {

}
