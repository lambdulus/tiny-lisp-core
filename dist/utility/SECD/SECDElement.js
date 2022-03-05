"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    setNode(node) {
        throw new Error("Method not implemented.");
    }
    getNode() {
        throw new Error("Method not implemented.");
    }
}
exports.SECDElement = SECDElement;
//# sourceMappingURL=SECDElement.js.map