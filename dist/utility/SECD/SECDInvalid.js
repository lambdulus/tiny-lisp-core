"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AST_1 = require("../../AST/AST");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
class SECDInvalid extends SECDElement_1.SECDElement {
    constructor() {
        super(SECDElementType_1.SECDElementType.Invalid);
        this._otherNode = new AST_1.NullNode();
    }
    get otherNode() {
        return this._otherNode;
    }
    set otherNode(value) {
        this._otherNode = value;
    }
    clone() {
        return new SECDInvalid();
    }
}
exports.SECDInvalid = SECDInvalid;
//# sourceMappingURL=SECDInvalid.js.map