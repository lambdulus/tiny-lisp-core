"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDElement = void 0;
const AST_1 = require("../AST/AST");
const ColourType_1 = require("./ColourType");
class SECDElement {
    constructor(type) {
        this._type = type;
        this._colour = ColourType_1.ColourType.None;
    }
    get type() {
        return this._type;
    }
    get colour() {
        return this._colour;
    }
    set colour(value) {
        this._colour = value;
    }
    get node() {
        return this._node;
    }
    set node(value) {
        this._node = value;
    }
    removeReduction() {
        if (this.node)
            if (this.node.parent instanceof AST_1.ReduceNode) {
                this.node.parent.parent.setNode(this.node.parent.original(), this.node.parent.position);
            }
    }
}
exports.SECDElement = SECDElement;
//# sourceMappingURL=SECDElement.js.map