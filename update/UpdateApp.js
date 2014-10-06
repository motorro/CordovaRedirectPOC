/**
 * UpdateApp.js
 * User: motorro
 * Date: 06.10.2014
 * Time: 5:59
 */
var Q = require("q");
var log = undefined;

Button = require("../app/lib/Button");
readyTrigger = require("../app/lib/readyTrigger");

/**
 * Entry point
 */
readyTrigger(function(){
    log = require("../app/lib/Logger").init(document.getElementById("log"));
    log("Update initialized...");

    function runCommand(command) {
        preloaderButton.setEnabled(false);
        command().fin(function(){
            preloaderButton.setEnabled(true);
        });
    }

    var preloaderButton = new Button("preloader", function() {
        runCommand(toPreloader);
    });
});

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
