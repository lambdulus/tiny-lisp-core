"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDArray = exports.PrintedState = void 0;
const SECDValue_1 = require("./SECDValue");
const ColourType_1 = require("./ColourType");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
const InterpreterErrors_1 = require("..//interpreter/InterpreterErrors");
var PrintedState;
(function (PrintedState) {
    PrintedState[PrintedState["Not"] = 0] = "Not";
    PrintedState[PrintedState["Once"] = 1] = "Once";
    PrintedState[PrintedState["More"] = 2] = "More";
})(PrintedState = exports.PrintedState || (exports.PrintedState = {}));
/**
 * Repressents list in the SECD
 */
class SECDArray extends SECDElement_1.SECDElement {
    constructor(arr) {
        super(SECDElementType_1.SECDElementType.Array);
        this.arr = Array();
        this._printedState = PrintedState.Not;
        this._name = "";
        if (arr) {
            arr.forEach(val => this.arr.push(val));
            this.node = arr.node;
        }
        else
            this.arr = [];
    }
    get name() {
        return this._name;
    }
    set name(value) {
        this._name = value;
    }
    get printedState() {
        return this._printedState;
    }
    set printedState(value) {
        this._printedState = value;
    }
    /**
     * Remove the first element. If an array is empty InterpreterError is thrown
     */
    shift() {
        let res = this.arr.shift();
        if (typeof (res) == "undefined")
            throw new InterpreterErrors_1.InterpreterError("Empty array");
        return res;
    }
    /**
     * Remove the last element. If an array is empty InterpreterError is thrown
     */
    pop() {
        let res = this.arr.pop();
        if (typeof (res) == "undefined")
            throw new InterpreterErrors_1.InterpreterError("Empty array");
        return res;
    }
    /**
     * Appends val to the array
     * @param val
     */
    push(val) {
        return this.arr.push(val);
    }
    /**
     * Prepends val to the array
     * @param val
     */
    unshift(val) {
        return this.arr.unshift(val);
    }
    /**
     * Combines two arrays.
     * @param other
     */
    concat(other) {
        if (this.node == null)
            this.node = other._node;
        this.arr = this.arr.concat(other.arr);
        return this;
    }
    /**
     * Reverse positions of elements in the array
     */
    reverse() {
        let res = new SECDArray();
        this.arr.forEach(element => {
            if (element instanceof SECDArray)
                element = element.reverse();
            res.unshift(element);
        });
        res.node = this.node;
        return res;
    }
    /**
     * Get length of the array
     */
    length() {
        return this.arr.length;
    }
    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn
     * @param thisArg
     */
    forEach(callbackfn, thisArg) {
        this.arr.forEach(callbackfn);
    }
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn
     * @param thisArg
     */
    map(callbackfn, thisArg) {
        return this.arr.map(callbackfn);
    }
    /**
     * Remove elements from the array
     */
    clear() {
        this.arr = [];
    }
    /**
     * Set printedState in array and its elements to None
     */
    clearPrinted() {
        if (this._printedState) {
            this._printedState = PrintedState.Not;
            this.arr.forEach(element => {
                if (element instanceof SECDArray)
                    element.clearPrinted();
            });
        }
    }
    /**
     * Set colour and printedState to default values
     */
    clean() {
        this._colour = ColourType_1.ColourType.None;
        if (this._printedState === PrintedState.Not) { //This prevents the array to be called infinitely
            this.printedInc();
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean();
                else if (item instanceof SECDValue_1.SECDValue)
                    item.colour = ColourType_1.ColourType.None;
            });
        }
        this._printedState = PrintedState.Not;
    }
    /**
     * Get element on index
     * @param index
     */
    get(index) {
        return this.arr[index];
    }
    /**
     * True, if array is empty
     */
    empty() {
        return this.arr.length == 0;
    }
    /**
     * Increase the printedState
     */
    printedInc() {
        this._printedState = this._printedState === PrintedState.Not ? PrintedState.Once : PrintedState.More;
    }
    /**
     * Change pointers to reduce nodes to its original subtree. Also implements additional logic preventing infinite calls
     */
    removeReduction() {
        super.removeReduction();
        if (this._printedState === PrintedState.Not) { //This prevents the array to be called infinitely
            this.printedInc();
            this.arr.forEach(elem => elem.removeReduction());
        }
        this._printedState = PrintedState.Not;
    }
    /**
     * Clone the array
     */
    clone() {
        let other = new SECDArray();
        this.arr.forEach(item => other.push(item));
        other.node = this.node;
        other.name = this.name;
        return other;
    }
    /**
     * Print the array
     */
    print() {
        return '(' + this.arr.map(element => element.print() + " ").reduce((acc, str) => { return acc += str; }) + ')';
    }
}
exports.SECDArray = SECDArray;
//# sourceMappingURL=SECDArray.js.map