/**
 * Button
 * User: motorro
 * Date: 01.10.2014
 * Time: 22:13
 */

/**
 * Button constructor
 * @param elementId
 * @param action
 * @constructor
 */
function Button(elementId, action) {
    var element = this.element = document.getElementById(elementId);
    if (null == element) {
        throw new Error(["Button element", elementId, "not found!"].join(""));
    }
    element.addEventListener("click", action, false);
}

/**
 * Availability
 * @param value
 */
Button.prototype.setEnabled = function(value) {
    this.element.disabled = !value;
};

module.exports = Button;