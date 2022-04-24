"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ColourType_1 = require("./ColourType");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
class SECDValue extends SECDElement_1.SECDElement {
    constructor(constant, node) {
        super(SECDElementType_1.SECDElementType.Value);
        this._constant = constant;
        this._colour = ColourType_1.ColourType.None;
        if (node != null)
            this.node = node;
    }
    get constant() {
        return this._constant;
    }
    getNode() {
        return this._node;
    }
    setNode(node) {
        if (this._node != null)
            this._node.update(node, false);
        this.node = node;
    }
    toString() {
        if (typeof (this._constant) == "string")
            return "'" + this._constant;
        return this._constant.toString();
    }
    clone() {
        return new SECDValue(this.constant, this.node.clone());
    }
    print() {
        return this._constant.toString();
    }
}
exports.SECDValue = SECDValue;
//# sourceMappingURL=SECDValue.js.map