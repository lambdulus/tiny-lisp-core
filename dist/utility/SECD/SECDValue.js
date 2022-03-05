"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ColourType_1 = require("./ColourType");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
class SECDValue extends SECDElement_1.SECDElement {
    constructor(val, node) {
        super(SECDElementType_1.SECDElementType.Value);
        this._val = val;
        this._colour = ColourType_1.ColourType.None;
        if (node != null)
            this.node = node;
    }
    get val() {
        return this._val;
    }
    getNode() {
        return this._node;
    }
    setNode(node) {
        if (this._node != null)
            this._node.update(node);
        this.node = node;
    }
    toString() {
        return this._val.toString();
    }
}
exports.SECDValue = SECDValue;
//# sourceMappingURL=SECDValue.js.map