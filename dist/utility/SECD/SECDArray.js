"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDValue_1 = require("./SECDValue");
const AST_1 = require("../../AST/AST");
const ColourType_1 = require("./ColourType");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
const InterpreterErrors_1 = require("../../interpreter/InterpreterErrors");
const SECDMacro_1 = require("./SECDMacro");
var PrintedState;
(function (PrintedState) {
    PrintedState[PrintedState["Not"] = 0] = "Not";
    PrintedState[PrintedState["Once"] = 1] = "Once";
    PrintedState[PrintedState["More"] = 2] = "More";
})(PrintedState = exports.PrintedState || (exports.PrintedState = {}));
class SECDArray extends SECDElement_1.SECDElement {
    constructor(arr) {
        super(SECDElementType_1.SECDElementType.Array);
        this.arr = Array();
        this._printedState = PrintedState.Not;
        this._name = "";
        this._isClosure = false;
        if (arr) {
            arr.forEach(val => this.arr.push(val));
            this.node = arr.node;
        }
        else
            this.arr = [];
    }
    get isClosure() {
        return this._isClosure;
    }
    set isClosure(value) {
        this._isClosure = value;
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
    shift() {
        let res = this.arr.shift();
        if (typeof (res) == "undefined")
            throw new InterpreterErrors_1.InterpreterError("Empty array");
        return res;
    }
    pop() {
        let res = this.arr.pop();
        if (typeof (res) == "undefined")
            throw new InterpreterErrors_1.InterpreterError("Empty array");
        return res;
    }
    push(val) {
        return this.arr.push(val);
    }
    concat(other) {
        if (this.node == null)
            this.node = other._node;
        this.arr = this.arr.concat(other.arr);
        return this;
    }
    accept(visitor) {
        visitor.visit(this);
    }
    length() {
        return this.arr.length;
    }
    forEach(callbackfn, thisArg) {
        this.arr.forEach(callbackfn);
    }
    map(callbackfn, thisArg) {
        return this.arr.map(callbackfn);
    }
    clear() {
        this.arr = [];
    }
    clearPrinted() {
        if (this._printedState) {
            this._printedState = PrintedState.Not;
            this.arr.forEach(element => {
                if (element instanceof SECDArray)
                    element.clearPrinted();
            });
        }
    }
    get(index) {
        return this.arr[index];
    }
    empty() {
        return this.arr.length == 0;
    }
    clean() {
        this._colour = ColourType_1.ColourType.None;
        if (this._printedState === PrintedState.Not) {
            this.printedInc();
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean();
                else if (item instanceof SECDValue_1.SECDValue || item instanceof SECDMacro_1.SECDMacro)
                    item.colour = ColourType_1.ColourType.None;
            });
        }
        this._printedState = PrintedState.Not;
    }
    getNode() {
        if (this._node == null)
            this.initializeNode();
        return this._node;
    }
    setNode(node) {
        if (node instanceof AST_1.InnerNode)
            if (this.arr.length > 0)
                if (typeof (this.arr[this.arr.length - 1].getNode()) == "undefined") //TODO not sure if this should be here
                    this.arr[this.arr.length - 1].setNode(node);
        this._node = node;
    }
    toString() {
        if (this._printedState)
            return "[placeholder]";
        this.printedInc();
        if (this._node == null)
            this.initializeNode();
        return "neco"; //this._node.toString()
    }
    initializeNode() {
        if (!this._node)
            if (!this._printedState)
                if (this.arr.length > 0)
                    this._node = this.arr[this.arr.length - 1].getNode();
    }
    toListNode() {
        let nodes = Array();
        this.arr.forEach(item => {
            if (item.getNode() != undefined)
                nodes.push(item.node);
            else { //TODO maybe not needed
                if (item instanceof SECDArray) {
                    nodes.push(item.toListNode());
                }
                else if (item instanceof SECDValue_1.SECDValue) {
                    let val = item.val;
                    if (typeof (val) == "number" || typeof (val) == "boolean")
                        nodes.push(new AST_1.ValueNode(val));
                    else if (typeof (val) == "string")
                        nodes.push(new AST_1.StringNode(val));
                }
            }
        });
        return new AST_1.ListNode(nodes);
    }
    printedInc() {
        this._printedState = this._printedState === PrintedState.Not ? PrintedState.Once : PrintedState.More;
    }
    removeReduction() {
        super.removeReduction();
        if (this._printedState === PrintedState.Not) {
            this.printedInc();
            this.arr.forEach(elem => elem.removeReduction());
        }
        this._printedState = PrintedState.Not;
    }
    clone() {
        return new SECDArray(this);
    }
}
exports.SECDArray = SECDArray;
//# sourceMappingURL=SECDArray.js.map