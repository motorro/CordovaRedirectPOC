/**
 * Logger
 * Outputs to console and DOM element
 * User: motorro
 * Date: 04.10.2014
 * Time: 8:10
 */

module.exports = {
    /**
     * Initializes logger
     * @param output DOM element to append outputs to
     * @returns Log function bound to 'output' element
     */
    init: function(output) {
        return module.exports.log.bind(undefined, output);
    },
    /**
     * Logs a message
     * @param output DOM element to append outputs to
     * @param message Message
     * @param [node] If passed that object's nodeValue will be changed instead of inserting new line
     * @returns {Node} The message node
     */
    log: function log(output, message, node) {
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
