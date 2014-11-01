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

    processAssets();
});

/**
 * Demonstrates asset management
 */
function processAssets() {
    // 1. Load dynamic CSS
    Updater.loadCssAsset("css/dynamic_style.css");
    // 2. Load dynamic JavaScript
    Updater.loadJsAsset("js/dynamic_js.js");

    // Use dynamic images
    // 1. Shows updated image - the one that has changed since last release
    setDynamicBg(".dynamic-background", "img/dynamic_img.jpg");
    // 2. Shows image from the packaged app - as soon as it remains the same
    setDynamicBg(".dynamic-background-that-wasnt-updated", "img/dynamic_img_that_wasnt_updated.jpg");

    /**
     * Set dynamic CSS background
     * @param selector
     * @param asset
     */
    function setDynamicBg(selector, asset) {
        // Uses dynamically generated 'assetOverrides'
        // to get images from within 'dynamic' folder
        // Only the files that have changed since the latest release tag get there.
        document.querySelector(selector).style.backgroundImage = [
            "url('",
            Updater.resolveAsset(asset),
            "')"
        ].join("");
    }
}

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
            window.location.href = Updater.PACKAGE_ASSET_URL_PREFIX + "preloader.html";
        },
        500
    );
    d.resolve();
    return d.promise;
}
