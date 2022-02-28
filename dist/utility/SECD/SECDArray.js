"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDArray = exports.PrintedState = void 0;
const SECDValue_1 = require("./SECDValue");
const AST_1 = require("../../AST/AST");
const ColourType_1 = require("./ColourType");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
const SECDInvalid_1 = require("./SECDInvalid");
var PrintedState;
(function (PrintedState) {
    PrintedState[PrintedState["NO"] = 0] = "NO";
    PrintedState[PrintedState["First"] = 1] = "First";
    PrintedState[PrintedState["More"] = 2] = "More";
})(PrintedState = exports.PrintedState || (exports.PrintedState = {}));
class SECDArray extends SECDElement_1.SECDElement {
    constructor(arr) {
        super(SECDElementType_1.SECDElementType.Array);
        this.arr = Array();
        this._printed = PrintedState.NO;
        if (arr) {
            arr.forEach(val => this.arr.push(val));
            this.node = arr.node;
        }
        else
            this.arr = [];
    }
    get printed() {
        return this._printed;
    }
    set printed(value) {
        this._printed = value;
    }
    shift() {
        let res = this.arr.shift();
        if (typeof (res) == "undefined")
            return new SECDInvalid_1.SECDInvalid();
        return res;
    }
    pop() {
        let res = this.arr.pop();
        if (typeof (res) == "undefined")
            return new SECDInvalid_1.SECDInvalid();
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
        if (this._printed) {
            this._printed = PrintedState.NO;
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
        if (this._printed === PrintedState.NO) {
            this.printInc();
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean();
                else if (item instanceof SECDValue_1.SECDValue)
                    item.colour = ColourType_1.ColourType.None;
            });
        }
        this._printed = PrintedState.NO;
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
        if (this._printed)
            return "[placeholder]";
        this.printInc();
        if (this._node == null)
            this.initializeNode();
        return "neco"; //this._node.toString()
    }
    initializeNode() {
        if (!this._printed)
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
    printInc() {
        this._printed = this._printed === PrintedState.NO ? PrintedState.First : PrintedState.More;
    }
}
exports.SECDArray = SECDArray;
//# sourceMappingURL=SECDArray.js.map