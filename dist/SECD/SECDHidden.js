"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDHidden = void 0;
const AST_1 = require("..//AST/AST");
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
/**
 * Element storing nodes needed for function application (node of called function and of function call)
 */
class SECDHidden extends SECDElement_1.SECDElement {
    constructor() {
        super(SECDElementType_1.SECDElementType.Hidden);
        this._callNode = new AST_1.NullNode();
    }
    get callNode() {
        return this._callNode;
    }
    set callNode(value) {
        this._callNode = value;
    }
    clone() {
        return new SECDHidden();
    }
    print() {
        throw new Error("Method not implemented.");
    }
}
exports.SECDHidden = SECDHidden;
//# sourceMappingURL=SECDHidden.js.map