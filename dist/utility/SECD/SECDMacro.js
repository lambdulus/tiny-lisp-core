"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
class SECDMacro extends SECDElement_1.SECDElement {
    constructor(macro, node) {
        super(SECDElementType_1.SECDElementType.Macro);
        this.macro = macro;
        this._node = node;
    }
    clone() {
        throw new Error("Method not implemented.");
    }
    add(macro) {
        this.macro += macro.macro;
        //(this._node as StringNode).add(macro.macro)
    }
    getNode() {
        return this._node;
    }
}
exports.SECDMacro = SECDMacro;
//# sourceMappingURL=SECDMacro.js.map