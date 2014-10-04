/**
 * Logger
 * Outputs to console and DOM element
 * User: motorro
 * Date: 04.10.2014
 * Time: 8:10
 */

/**
 * DOM element for output
 */
var output = undefined;

module.exports = {
    /**
     * Initializes logger
     * @param outputElementId Id of input element
     */
    init: function(outputElementId) {
        output = window.document.getElementById(outputElementId);
    },
    /**
     * Logs a message
     * @param message Message
     * @param [node] If passed that object's nodeValue will be changed instead of inserting new line
     * @returns {Node} The message node
     */
    log: function log(message, node) {
        console.log(message);
        if (undefined === output) {
            return undefined;
        }

        if (undefined === node) {
            var messageLine = document.createElement("p");
            node = messageLine.appendChild(document.createTextNode());
            output.appendChild(messageLine);
        }
        node.nodeValue = message;
        return node;
    }
};
