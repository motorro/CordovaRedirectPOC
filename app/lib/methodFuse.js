/**
 * Helper functions to prevent simultaneous function execution
 * User: motorro
 * Date: 21.10.2014
 * Time: 6:06
 */

var Q = require("q");

/**
 * Creates a handler that is secured by storing
 * a promise reference
 * @param handler
 * @param [scope]
 */
function createFusedFunction (handler, scope) {
    return (function(h){
        var storedPromise = null;
        return function() {
            if (null !== storedPromise) {
                return storedPromise;
            }
            var promise = storedPromise = h.apply(scope, arguments);
            promise.fin(function(){
                storedPromise = null;
            });
            return promise;
        }
    })(handler);
}
module.exports.createFusedFunction = createFusedFunction;