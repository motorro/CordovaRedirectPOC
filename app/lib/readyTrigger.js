/**
 * ReadyTrigger
 * Fires when document and Cordova are ready
 * User: motorro
 * Date: 02.10.2014
 * Time: 5:51
 */

/**
 * Fires callback when document ready-state and cordova device-ready are good to go
 * If the triggers has already fired - execute callback immediately
 * @param onReady Ready callback
 * @param [readyState] Document ready-state when callback fires
 * @default "interactive"
 */
module.exports = function readyTrigger (onReady, readyState) {
    readyState = readyState || "interactive";
    var isDeviceReady = function() {
        return window.device && window.device.available;
    };
    var isDocumentReady = function() {
        return readyState === document.readyState;
    };
    var checkReady = function() {
        var ready = isDocumentReady() && isDeviceReady();
        if (ready) onReady();
        return ready;
    };

    if (checkReady()) return;

    if (false === isDeviceReady()) {
        window.document.addEventListener("deviceready", checkReady, false);
    }

    if (false === isDocumentReady()) {
        window.document.addEventListener("readystatechange", checkReady, false);
    }
};