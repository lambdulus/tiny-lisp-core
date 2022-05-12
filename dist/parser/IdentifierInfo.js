"use strict";
/**
 * Info about an identifier in SymbTable
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierInfo = void 0;
class IdentifierInfo {
    constructor(name, args) {
        this._name = name;
        this._args = args;
    }
    get name() {
        return this._name;
    }
    get args() {
        return this._args;
    }
    set args(value) {
        this._args = value;
    }
}
exports.IdentifierInfo = IdentifierInfo;
//# sourceMappingURL=IdentifierInfo.js.map