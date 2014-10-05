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
        return readyState === window.document.readyState;
    };

    var waitForDevice = function() {
        var handler = function() {
            if (isDeviceReady()) {
                window.document.removeEventListener("deviceready", handler, false);
                onReady();
            }
        };
        window.document.addEventListener("deviceready", handler, false);
    };

    if (isDocumentReady()) {
        if (isDeviceReady()) {
            onReady();
        } else {
            waitForDevice();
        }
    } else {
        (function(){
            var handler = function() {
                if (readyState === document.readyState) {
                    window.document.removeEventListener("readystatechange", handler, false);
                    if (isDeviceReady()) {
                        onReady();
                    } else {
                        waitForDevice();
                    }
                }
            };
            window.document.addEventListener("readystatechange", handler, false);
        })();
    }
};